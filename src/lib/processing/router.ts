import { supabaseAdmin } from '@/lib/supabase/server';
import { processTextFile, processMarkdownFile } from './text-processor';
import { processDocumentFile, isDocumentType } from './document-processor';
import { processOfficeFile, isOfficeType } from './office-processor';
import { processStandaloneImage } from './image-processor';
import { processVideoFile } from './video-processor';
import { processAudioFile } from './audio-processor';
import { processEntitiesForDocument } from './entity-extractor';
import { addEmbeddingsToChunks } from '@/lib/gemini/embeddings';
import type { ChunkInsert, DocumentStatus } from '@/types';

// Enable/disable entity extraction (can be controlled via env)
const ENABLE_ENTITY_EXTRACTION = process.env.ENABLE_ENTITY_EXTRACTION !== 'false';

// File type to processor mapping for simple text files
type ProcessorFunction = (
  content: string,
  documentId: string,
  workspace: string
) => Promise<ChunkInsert[]>;

const TEXT_PROCESSORS: Record<string, ProcessorFunction> = {
  'txt': processTextFile,
  'md': processMarkdownFile,
};

// Document types that require the Gemini parsing service (only PDF)
const DOCUMENT_TYPES = ['pdf'];

// Office types that need text extraction (not supported by Gemini directly)
const OFFICE_TYPES = ['docx', 'pptx', 'xlsx', 'doc', 'xls', 'ppt'];

// Image types
const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// Video types
const VIDEO_TYPES = ['mp4', 'webm', 'mov', 'avi'];

// Audio types
const AUDIO_TYPES = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  // Documents
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Images
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  // Video
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'mov': 'video/quicktime',
  'avi': 'video/x-msvideo',
  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'flac': 'audio/flac',
  'm4a': 'audio/mp4',
  'aac': 'audio/aac',
};

interface ProcessingResult {
  success: boolean;
  chunksCreated: number;
  entitiesCreated?: number;
  relationsCreated?: number;
  error?: string;
}

/**
 * Processing options for multi-tenancy support
 */
export interface ProcessingOptions {
  workspace: string;
  geminiApiKey?: string;
  userId?: string;       // For plan-based limits
  planName?: string;     // User's subscription plan
}

/**
 * Update document status in database
 */
async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus,
  chunksCount?: number,
  errorMessage?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (chunksCount !== undefined) {
    updateData.chunks_count = chunksCount;
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabaseAdmin
    .from('documents')
    .update(updateData)
    .eq('id', documentId);

  if (error) {
    console.error('Error updating document status:', error);
  }
}

/**
 * Get file content as text from Supabase storage
 */
async function getFileContentAsText(filePath: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from('documents')
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }

  const text = await data.text();
  return text;
}

/**
 * Get file content as ArrayBuffer from Supabase storage
 */
async function getFileContentAsBuffer(filePath: string): Promise<ArrayBuffer> {
  const { data, error } = await supabaseAdmin.storage
    .from('documents')
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }

  return await data.arrayBuffer();
}

/**
 * Store chunks in database
 * Note: Due to Supabase/pgvector INSERT limitation, we insert without vectors first,
 * then update each chunk with its vector separately.
 *
 * CRITICAL: This function fetches user_id from the document and sets it on all chunks
 * for proper data isolation in multi-tenant queries.
 */
async function storeChunks(chunks: ChunkInsert[]): Promise<void> {
  if (chunks.length === 0) return;

  console.log(`[storeChunks] Storing ${chunks.length} chunks`);

  // Get document_id from first chunk to fetch user_id
  const documentId = chunks[0]?.document_id;
  let userId: string | null = null;

  if (documentId) {
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('user_id')
      .eq('id', documentId)
      .single();

    userId = doc?.user_id || null;
    console.log(`[storeChunks] Fetched user_id from document: ${userId}`);
  }

  // Separate vectors from chunks for two-step insert
  const chunksWithVectors: { id: string; vector: string | number[] }[] = [];
  const chunksForInsert: ChunkInsert[] = [];

  for (const chunk of chunks) {
    const { content_vector, ...chunkWithoutVector } = chunk;
    // Add user_id to each chunk for data isolation
    const chunkWithUserId = {
      ...chunkWithoutVector,
      user_id: userId || undefined,
    } as ChunkInsert;
    chunksForInsert.push(chunkWithUserId);
    if (content_vector && chunk.id) {
      chunksWithVectors.push({ id: chunk.id, vector: content_vector });
    }
  }

  console.log(`[storeChunks] Chunks with content_vector: ${chunksWithVectors.length}/${chunks.length}`);

  const batchSize = 100;

  // Step 1: Insert chunks WITHOUT vectors (but WITH user_id)
  for (let i = 0; i < chunksForInsert.length; i += batchSize) {
    const batch = chunksForInsert.slice(i, i + batchSize);

    console.log(`[storeChunks] Inserting batch ${Math.floor(i / batchSize) + 1}, ${batch.length} chunks (user_id: ${userId})`);

    const { error } = await supabaseAdmin
      .from('chunks')
      .insert(batch);

    if (error) {
      console.error(`[storeChunks] ERROR inserting batch:`, error);
      throw new Error(`Failed to insert chunks: ${error.message}`);
    }
  }

  // Step 2: Update each chunk with its vector (Supabase pgvector requires UPDATE for vectors)
  if (chunksWithVectors.length > 0) {
    console.log(`[storeChunks] Updating ${chunksWithVectors.length} chunks with vectors...`);
    let updateCount = 0;

    for (const { id, vector } of chunksWithVectors) {
      const { error: updateError } = await supabaseAdmin
        .from('chunks')
        .update({ content_vector: vector })
        .eq('id', id);

      if (updateError) {
        console.error(`[storeChunks] ERROR updating vector for chunk ${id}:`, updateError.message);
        // Continue with other chunks, don't fail completely
      } else {
        updateCount++;
      }
    }

    console.log(`[storeChunks] Updated ${updateCount}/${chunksWithVectors.length} chunks with vectors`);
  }

  console.log(`[storeChunks] All chunks stored successfully`);
}

/**
 * Process a text file (TXT or MD)
 */
async function processText(
  documentId: string,
  filePath: string,
  fileType: string,
  workspace: string
): Promise<ProcessingResult> {
  console.log(`[processText] Starting for document ${documentId}, type: ${fileType}`);

  try {
    const content = await getFileContentAsText(filePath);
    console.log(`[processText] File content length: ${content.length} chars`);

    if (!content.trim()) {
      return { success: false, chunksCreated: 0, error: 'File is empty' };
    }

    const processor = TEXT_PROCESSORS[fileType];
    if (!processor) {
      return { success: false, chunksCreated: 0, error: `No processor for: ${fileType}` };
    }

    const chunks = await processor(content, documentId, workspace);
    console.log(`[processText] Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      return { success: false, chunksCreated: 0, error: 'No chunks created' };
    }

    console.log(`[processText] Starting embedding generation...`);
    const chunksWithEmbeddings = await addEmbeddingsToChunks(chunks);

    const withVectors = chunksWithEmbeddings.filter(c => c.content_vector && c.content_vector.length > 0).length;
    console.log(`[processText] Chunks with vectors after embedding: ${withVectors}/${chunksWithEmbeddings.length}`);

    await storeChunks(chunksWithEmbeddings);

    return { success: true, chunksCreated: chunks.length };
  } catch (error) {
    console.error(`[processText] ERROR:`, error);
    return {
      success: false,
      chunksCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process a document file (PDF only) using Gemini
 */
async function processDocFile(
  documentId: string,
  filePath: string,
  fileType: string,
  workspace: string
): Promise<ProcessingResult> {
  try {
    const buffer = await getFileContentAsBuffer(filePath);
    const filename = filePath.split('/').pop() || 'document';
    const mimeType = MIME_TYPES[fileType] || 'application/octet-stream';

    const { chunks } = await processDocumentFile(buffer, filename, mimeType, documentId, workspace);

    if (chunks.length === 0) {
      return { success: false, chunksCreated: 0, error: 'No content extracted from document' };
    }

    const chunksWithEmbeddings = await addEmbeddingsToChunks(chunks);
    await storeChunks(chunksWithEmbeddings);

    return { success: true, chunksCreated: chunks.length };
  } catch (error) {
    return {
      success: false,
      chunksCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process Office files (DOCX, XLSX, PPTX) by extracting text first
 * Gemini API does not support Office formats directly
 */
async function processOffice(
  documentId: string,
  filePath: string,
  fileType: string,
  workspace: string
): Promise<ProcessingResult> {
  console.log(`[processOffice] ===== START PROCESSING =====`);
  console.log(`[processOffice] Document ID: ${documentId}`);
  console.log(`[processOffice] File type: ${fileType}`);

  try {
    const buffer = await getFileContentAsBuffer(filePath);
    console.log(`[processOffice] Buffer size: ${buffer.byteLength} bytes`);

    const chunks = await processOfficeFile(buffer, fileType, documentId, workspace);
    console.log(`[processOffice] Created ${chunks.length} chunks`);

    // Log chunk details
    chunks.forEach((chunk, i) => {
      console.log(`[processOffice] Chunk ${i}: id=${chunk.id}, type=${chunk.chunk_type}, contentLen=${chunk.content.length}`);
    });

    if (chunks.length === 0) {
      return { success: false, chunksCreated: 0, error: 'No content extracted from Office document' };
    }

    console.log(`[processOffice] Starting embedding generation...`);
    const chunksWithEmbeddings = await addEmbeddingsToChunks(chunks);

    const withVectors = chunksWithEmbeddings.filter(c => c.content_vector && c.content_vector.length > 0).length;
    console.log(`[processOffice] Chunks with vectors after embedding: ${withVectors}/${chunksWithEmbeddings.length}`);

    await storeChunks(chunksWithEmbeddings);
    console.log(`[processOffice] ===== PROCESSING COMPLETE =====`);

    return { success: true, chunksCreated: chunks.length };
  } catch (error) {
    console.error(`[processOffice] ERROR:`, error);
    return {
      success: false,
      chunksCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process a standalone image file
 */
async function processImage(
  documentId: string,
  filePath: string,
  fileType: string,
  workspace: string
): Promise<ProcessingResult> {
  try {
    const buffer = await getFileContentAsBuffer(filePath);
    const mimeType = MIME_TYPES[fileType] || 'image/png';

    const chunks = await processStandaloneImage(buffer, mimeType, documentId, workspace);

    if (chunks.length === 0) {
      return { success: false, chunksCreated: 0, error: 'Could not process image' };
    }

    const chunksWithEmbeddings = await addEmbeddingsToChunks(chunks);
    await storeChunks(chunksWithEmbeddings);

    return { success: true, chunksCreated: chunks.length };
  } catch (error) {
    return {
      success: false,
      chunksCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process a video file via Gemini native video support
 */
async function processVideo(
  documentId: string,
  filePath: string,
  fileType: string,
  workspace: string,
  options?: ProcessingOptions
): Promise<ProcessingResult> {
  console.log(`[processVideo] ===== START PROCESSING =====`);
  console.log(`[processVideo] Document ID: ${documentId}`);
  console.log(`[processVideo] File path: ${filePath}`);
  console.log(`[processVideo] File type: ${fileType}`);

  try {
    const buffer = await getFileContentAsBuffer(filePath);
    console.log(`[processVideo] Buffer size: ${buffer.byteLength} bytes`);

    const mimeType = MIME_TYPES[fileType] || 'video/mp4';
    console.log(`[processVideo] MIME type: ${mimeType}`);

    const chunks = await processVideoFile(buffer, mimeType, documentId, workspace, {
      planName: options?.planName,
      userId: options?.userId,
    });

    console.log(`[processVideo] Video processor returned ${chunks.length} chunks`);

    if (chunks.length === 0) {
      console.log(`[processVideo] ERROR: No chunks created`);
      return { success: false, chunksCreated: 0, error: 'Could not process video' };
    }

    // Log chunk details before embedding
    chunks.forEach((chunk, i) => {
      console.log(`[processVideo] Chunk ${i} before embedding:`, {
        id: chunk.id,
        type: chunk.chunk_type,
        timestampStart: chunk.timestamp_start,
        timestampEnd: chunk.timestamp_end,
        contentLength: chunk.content.length,
      });
    });

    console.log(`[processVideo] Starting embedding generation for ${chunks.length} chunks...`);
    const chunksWithEmbeddings = await addEmbeddingsToChunks(chunks);

    // Log embedding results
    const withVectors = chunksWithEmbeddings.filter(c => c.content_vector).length;
    console.log(`[processVideo] Embedding complete: ${withVectors}/${chunksWithEmbeddings.length} chunks have vectors`);

    chunksWithEmbeddings.forEach((chunk, i) => {
      console.log(`[processVideo] Chunk ${i} after embedding:`, {
        id: chunk.id,
        hasVector: !!chunk.content_vector,
        vectorPreview: chunk.content_vector ? String(chunk.content_vector).substring(0, 50) + '...' : 'NULL',
      });
    });

    console.log(`[processVideo] Storing chunks...`);
    await storeChunks(chunksWithEmbeddings);

    console.log(`[processVideo] ===== PROCESSING COMPLETE =====`);
    return { success: true, chunksCreated: chunks.length };
  } catch (error) {
    console.error(`[processVideo] ERROR:`, error);
    return {
      success: false,
      chunksCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process an audio file via Gemini native audio support
 */
async function processAudio(
  documentId: string,
  filePath: string,
  fileType: string,
  workspace: string,
  options?: ProcessingOptions
): Promise<ProcessingResult> {
  try {
    const buffer = await getFileContentAsBuffer(filePath);
    const mimeType = MIME_TYPES[fileType] || 'audio/mpeg';

    const chunks = await processAudioFile(buffer, mimeType, documentId, workspace, {
      planName: options?.planName,
      userId: options?.userId,
    });

    if (chunks.length === 0) {
      return { success: false, chunksCreated: 0, error: 'Could not process audio' };
    }

    const chunksWithEmbeddings = await addEmbeddingsToChunks(chunks);
    await storeChunks(chunksWithEmbeddings);

    return { success: true, chunksCreated: chunks.length };
  } catch (error) {
    return {
      success: false,
      chunksCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main processing router - routes files to appropriate processor
 */
export async function processDocument(
  documentId: string,
  filePath: string,
  fileType: string,
  options: ProcessingOptions | string = 'default'
): Promise<ProcessingResult> {
  // Handle backwards compatibility
  const workspace = typeof options === 'string' ? options : options.workspace;
  const processingOptions: ProcessingOptions = typeof options === 'string'
    ? { workspace }
    : options;

  // Note: geminiApiKey from options can be used in future for per-tenant processing
  // Currently the processors use the default API key, but the infrastructure is in place
  await updateDocumentStatus(documentId, 'processing');

  let result: ProcessingResult;

  try {
    if (fileType in TEXT_PROCESSORS) {
      // Text files (TXT, MD)
      result = await processText(documentId, filePath, fileType, workspace);
    } else if (OFFICE_TYPES.includes(fileType)) {
      // Office files (DOCX, XLSX, PPTX) - extract text first, then chunk
      result = await processOffice(documentId, filePath, fileType, workspace);
    } else if (DOCUMENT_TYPES.includes(fileType)) {
      // PDF files via Gemini
      result = await processDocFile(documentId, filePath, fileType, workspace);
    } else if (IMAGE_TYPES.includes(fileType)) {
      // Image files via Gemini Vision
      result = await processImage(documentId, filePath, fileType, workspace);
    } else if (VIDEO_TYPES.includes(fileType)) {
      // Video files via Gemini native video support (with plan limits)
      result = await processVideo(documentId, filePath, fileType, workspace, processingOptions);
    } else if (AUDIO_TYPES.includes(fileType)) {
      // Audio files via Gemini native audio support (with plan limits)
      result = await processAudio(documentId, filePath, fileType, workspace, processingOptions);
    } else {
      result = {
        success: false,
        chunksCreated: 0,
        error: `Unsupported file type: ${fileType}`,
      };
    }

    // Update document status based on result
    if (result.success) {
      await updateDocumentStatus(documentId, 'processed', result.chunksCreated);

      // Run entity extraction if enabled and we have text content
      console.log(`[processDocument] Entity extraction check: ENABLE_ENTITY_EXTRACTION=${ENABLE_ENTITY_EXTRACTION}, chunksCreated=${result.chunksCreated}`);
      if (ENABLE_ENTITY_EXTRACTION && result.chunksCreated > 0) {
        try {
          console.log(`[processDocument] Querying chunks for entity extraction, documentId=${documentId}`);
          // Get the stored chunks for entity extraction
          // Include ALL chunk types that have text content (text, audio, video_segment, table, image descriptions)
          const { data: storedChunks, error: chunkQueryError } = await supabaseAdmin
            .from('chunks')
            .select('id, content, chunk_type')
            .eq('document_id', documentId)
            .not('content', 'is', null); // Get all chunks with content, entity-extractor will filter by content length

          console.log(`[processDocument] Chunk query result: ${storedChunks?.length || 0} chunks found, error=${chunkQueryError?.message || 'none'}`);
          if (storedChunks) {
            storedChunks.forEach((c, i) => console.log(`[processDocument] Chunk ${i}: id=${c.id}, type=${c.chunk_type}, contentLen=${c.content?.length || 0}`));
          }

          if (storedChunks && storedChunks.length > 0) {
            const entityResult = await processEntitiesForDocument(
              documentId,
              storedChunks,
              workspace
            );
            result.entitiesCreated = entityResult.entitiesCreated;
            result.relationsCreated = entityResult.relationsCreated;

            console.log(
              `Entity extraction complete: ${entityResult.entitiesCreated} entities, ${entityResult.relationsCreated} relations`
            );
          }
        } catch (entityError) {
          // Log but don't fail the whole processing for entity extraction errors
          console.error('Entity extraction error (non-fatal):', entityError);
        }
      }
    } else {
      await updateDocumentStatus(documentId, 'failed', 0, result.error);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
    await updateDocumentStatus(documentId, 'failed', 0, errorMessage);

    return { success: false, chunksCreated: 0, error: errorMessage };
  }
}

/**
 * Check if a file type is supported for processing
 */
export function isFileTypeSupported(fileType: string): boolean {
  return (
    fileType in TEXT_PROCESSORS ||
    OFFICE_TYPES.includes(fileType) ||
    DOCUMENT_TYPES.includes(fileType) ||
    IMAGE_TYPES.includes(fileType) ||
    VIDEO_TYPES.includes(fileType) ||
    AUDIO_TYPES.includes(fileType)
  );
}

/**
 * Check if a file type can be processed now
 */
export function canProcessNow(fileType: string): boolean {
  return (
    fileType in TEXT_PROCESSORS ||
    OFFICE_TYPES.includes(fileType) ||
    DOCUMENT_TYPES.includes(fileType) ||
    IMAGE_TYPES.includes(fileType) ||
    VIDEO_TYPES.includes(fileType) ||
    AUDIO_TYPES.includes(fileType)
  );
}
