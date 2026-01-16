import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/auth-server';
import { processDocument, canProcessNow } from '@/lib/processing';
import { checkUploadLimits } from '@/lib/usageMiddleware';
import { usageService } from '@/services/usageService';
import { getPlanLimits, formatBytes, formatDuration } from '@/lib/plans';
import { checkFileSize } from '@/lib/media/durationChecker';
import type { DocumentInsert, UploadResponse } from '@/types';

// Route segment config for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 300;  // 5 minutes timeout for large files
export const dynamic = 'force-dynamic';

// Supported file extensions and their types
const FILE_TYPE_MAP: Record<string, string> = {
  'pdf': 'pdf',
  'docx': 'docx',
  'pptx': 'pptx',
  'xlsx': 'xlsx',
  'txt': 'txt',
  'md': 'md',
  'mp4': 'mp4',
  'mp3': 'mp3',
  'wav': 'wav',
  'jpg': 'jpg',
  'jpeg': 'jpg',
  'png': 'png',
  'gif': 'gif',
  'webp': 'webp',
};

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '100') * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Authenticate user before upload
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in to upload documents' },
        { status: 401 }
      );
    }

    // Get user's plan for file size limit check
    const planName = await usageService.getPlanName(user.id);
    const planLimits = getPlanLimits(planName);

    console.log('[Upload] User plan:', {
      userId: user.id,
      planName,
      maxUpload: formatBytes(planLimits.maxUploadBytes),
    });

    // Check content-length vs plan's max upload size BEFORE parsing FormData
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const contentSize = parseInt(contentLength);
      const sizeCheck = checkFileSize(contentSize, planName);

      if (!sizeCheck.allowed) {
        console.log('[Upload] File too large for plan:', sizeCheck);
        return NextResponse.json(
          {
            error: sizeCheck.error,
            code: 'FILE_TOO_LARGE',
            plan: planName,
            fileSize: sizeCheck.fileSizeFormatted,
            maxSize: sizeCheck.maxSizeFormatted,
            upgradeHint: sizeCheck.upgradeHint,
          },
          { status: 413 }
        );
      }
    }

    // Parse FormData with error handling for large files
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      console.error('[Upload] FormData parse error:', parseError);
      return NextResponse.json(
        {
          error: 'Cannot process file upload. File may be too large or corrupted.',
          code: 'PARSE_ERROR',
          hint: `Upload limit for ${planName} plan is ${formatBytes(planLimits.maxUploadBytes)}`,
          maxSize: formatBytes(planLimits.maxUploadBytes),
        },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Double-check file.size vs plan limit (in case content-length was missing/wrong)
    const fileSizeCheck = checkFileSize(file.size, planName);
    if (!fileSizeCheck.allowed) {
      return NextResponse.json(
        {
          error: fileSizeCheck.error,
          code: 'FILE_TOO_LARGE',
          plan: planName,
          fileSize: fileSizeCheck.fileSizeFormatted,
          maxSize: fileSizeCheck.maxSizeFormatted,
          upgradeHint: fileSizeCheck.upgradeHint,
        },
        { status: 413 }
      );
    }

    // Check usage limits (documents count, storage quota)
    const limitCheck = await checkUploadLimits(user.id, file.size);
    if (!limitCheck.ok) {
      return limitCheck.response;
    }

    // Detect media file type for logging
    const fileName = file.name.toLowerCase();
    const isAudio = file.type.startsWith('audio/') ||
      ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'].some(ext => fileName.endsWith(ext));
    const isVideo = file.type.startsWith('video/') ||
      ['.mp4', '.mov', '.avi', '.mkv', '.webm'].some(ext => fileName.endsWith(ext));

    if (isAudio || isVideo) {
      console.log('[Upload] Media file detected:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: formatBytes(file.size),
        isAudio,
        isVideo,
        planLimits: {
          audio: formatDuration(planLimits.audioSeconds),
          video: formatDuration(planLimits.videoSeconds),
        },
      });
    }

    // Get optional user-provided metadata
    const description = formData.get('description') as string | null;
    const tagsRaw = formData.get('tags') as string | null;
    const category = formData.get('category') as string | null;
    const customMetadataRaw = formData.get('customMetadata') as string | null;

    // Parse tags (comma-separated or JSON array)
    let tags: string[] = [];
    if (tagsRaw) {
      try {
        tags = JSON.parse(tagsRaw);
      } catch {
        // Assume comma-separated
        tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    // Parse custom metadata JSON
    let customMetadata: Record<string, unknown> = {};
    if (customMetadataRaw) {
      try {
        customMetadata = JSON.parse(customMetadataRaw);
      } catch {
        console.warn('Invalid customMetadata JSON, ignoring');
      }
    }

    // Get file extension and validate
    const originalFileName = file.name;
    const extension = originalFileName.split('.').pop()?.toLowerCase() || '';
    const fileType = FILE_TYPE_MAP[extension];

    if (!fileType) {
      return NextResponse.json(
        { error: `Unsupported file type: .${extension}` },
        { status: 400 }
      );
    }

    // Generate unique document ID
    const documentId = uuidv4();

    // Sanitize filename for storage (replace spaces and special chars)
    const sanitizedFileName = originalFileName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const storagePath = `uploads/${documentId}/${sanitizedFileName}`;

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to Supabase Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      // Provide more specific error message to user
      let errorMessage = 'Failed to upload file to storage';
      if (storageError.message?.includes('Payload too large')) {
        errorMessage = `File is too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 100}MB`;
      } else if (storageError.message?.includes('already exists')) {
        errorMessage = 'A file with this name already exists. Please rename and try again.';
      } else if (storageError.message) {
        errorMessage = `Storage error: ${storageError.message}`;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // Create document record in database with user metadata
    // CRITICAL: Include user_id for data isolation
    const documentData: DocumentInsert = {
      id: documentId,
      user_id: user.id, // CRITICAL: Associate document with authenticated user
      file_name: originalFileName,
      file_type: fileType,
      file_size: file.size,
      file_path: storagePath,
      status: 'pending',
      metadata: {
        // System metadata
        originalName: originalFileName,
        sanitizedName: sanitizedFileName,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        // User-provided metadata
        ...(description && { description }),
        ...(tags.length > 0 && { tags }),
        ...(category && { category }),
        // Custom user metadata (merged in)
        ...customMetadata,
      },
    };

    const { error: dbError } = await supabaseAdmin
      .from('documents')
      .insert(documentData);

    if (dbError) {
      console.error('Database insert error:', dbError);

      // Try to clean up the uploaded file
      await supabaseAdmin.storage
        .from('documents')
        .remove([storagePath]);

      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      );
    }

    // Increment usage counters after successful upload
    try {
      await usageService.incrementUsage(user.id, 'documents', 1);
      await usageService.incrementUsage(user.id, 'storage', file.size);
      // Pages will be incremented after processing completes (in processDocument)
    } catch (usageError) {
      console.error('Failed to increment usage:', usageError);
      // Don't fail the upload if usage tracking fails
    }

    // Track media duration usage (passed from client after validation)
    const mediaTypeFromForm = formData.get('mediaType') as string | null;
    const durationSecondsStr = formData.get('durationSeconds') as string | null;
    const durationSeconds = durationSecondsStr ? parseInt(durationSecondsStr) : null;

    if (mediaTypeFromForm && durationSeconds && durationSeconds > 0) {
      try {
        const validMediaType = mediaTypeFromForm as 'audio' | 'video';
        const success = await usageService.incrementMediaDuration(user.id, validMediaType, durationSeconds);

        if (success) {
          console.log('[Upload] Updated media duration via usageService:', {
            mediaType: validMediaType,
            added: durationSeconds,
          });
        } else {
          console.warn('[Upload] Failed to increment media duration - usageService returned false');
        }
      } catch (trackError) {
        console.error('[Upload] Failed to track media duration:', trackError);
        // Don't fail upload if tracking fails
      }
    }

    // Trigger processing if the file type can be processed now
    // Processing runs asynchronously - we don't wait for it to complete
    if (canProcessNow(fileType)) {
      // Fire and forget - processing happens in the background
      processDocument(documentId, storagePath, fileType, 'default')
        .then(result => {
          if (result.success) {
            console.log(`Document ${documentId} processed successfully: ${result.chunksCreated} chunks created`);
          } else {
            console.error(`Document ${documentId} processing failed: ${result.error}`);
          }
        })
        .catch(async (error) => {
          // Ensure document status is updated even on unexpected errors
          console.error(`Document ${documentId} processing error:`, error);
          try {
            await supabaseAdmin
              .from('documents')
              .update({
                status: 'failed',
                error_message: error instanceof Error ? error.message : 'Unexpected processing error',
                updated_at: new Date().toISOString(),
              })
              .eq('id', documentId);
          } catch (updateError) {
            console.error(`Failed to update document ${documentId} status:`, updateError);
          }
        });
    }

    const response: UploadResponse = {
      documentId,
      status: 'pending',
      message: canProcessNow(fileType)
        ? 'File uploaded successfully, processing started'
        : `File uploaded successfully. ${fileType.toUpperCase()} processing will be available in a future update.`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
