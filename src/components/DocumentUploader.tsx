'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, FileImage, FileVideo, FileAudio, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { extractDurationClient, getMediaType } from '@/lib/media/extractDuration';
import { useTranslation } from '@/i18n';
import type { DocumentUploaderProps } from '@/types';

// Supported file types and their MIME types
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'video/mp4': ['.mp4'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

interface FileUpload {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'validating' | 'uploading' | 'success' | 'error';
  error?: string;
  documentId?: string;
  mediaType?: 'audio' | 'video' | null;
  durationSeconds?: number | null;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType.startsWith('video/')) return FileVideo;
  if (fileType.startsWith('audio/')) return FileAudio;
  if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function DocumentUploader({
  onUploadComplete,
  onUploadError,
  maxFileSizeMB = 100
}: DocumentUploaderProps) {
  const { t } = useTranslation();
  const [uploads, setUploads] = useState<FileUpload[]>([]);

  const uploadFile = async (fileUpload: FileUpload) => {
    try {
      // Step 1: Update status to validating
      setUploads(prev => prev.map(u =>
        u.id === fileUpload.id ? { ...u, status: 'validating' as const, progress: 0 } : u
      ));

      // Step 2: Detect media type and extract duration
      const mediaType = getMediaType(fileUpload.file);
      let durationSeconds: number | null = null;

      if (mediaType) {
        console.log('[Upload] Extracting duration for:', fileUpload.file.name);
        durationSeconds = await extractDurationClient(fileUpload.file);
        console.log('[Upload] Duration extracted:', durationSeconds, 'seconds');

        // Update with extracted info
        setUploads(prev => prev.map(u =>
          u.id === fileUpload.id ? { ...u, mediaType, durationSeconds } : u
        ));
      }

      // Step 3: Validate BEFORE upload
      const validateResponse = await fetch('/api/upload/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: fileUpload.file.name,
          fileSize: fileUpload.file.size,
          mediaType,
          durationSeconds,
        }),
      });

      const validateResult = await validateResponse.json();

      // Check both HTTP status and valid field
      if (!validateResponse.ok || !validateResult.valid) {
        // Validation failed - show error
        const errorMessage = validateResult.error || 'Validation failed';
        console.log('[Upload] Validation failed:', errorMessage);
        setUploads(prev => prev.map(u =>
          u.id === fileUpload.id ? { ...u, status: 'error' as const, error: errorMessage } : u
        ));
        onUploadError?.(new Error(errorMessage));
        return;
      }

      // Step 4: Validation passed - proceed with actual upload
      setUploads(prev => prev.map(u =>
        u.id === fileUpload.id ? { ...u, status: 'uploading' as const, progress: 10 } : u
      ));

      const formData = new FormData();
      formData.append('file', fileUpload.file);

      // Include duration in form data for server to track
      if (mediaType && durationSeconds) {
        formData.append('mediaType', mediaType);
        formData.append('durationSeconds', durationSeconds.toString());
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      // Update status to success
      setUploads(prev => prev.map(u =>
        u.id === fileUpload.id
          ? { ...u, status: 'success' as const, progress: 100, documentId: data.documentId }
          : u
      ));

      onUploadComplete?.(data.documentId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      // Update status to error
      setUploads(prev => prev.map(u =>
        u.id === fileUpload.id ? { ...u, status: 'error' as const, error: errorMessage } : u
      ));

      onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const maxSize = maxFileSizeMB * 1024 * 1024;

    const newUploads: FileUpload[] = acceptedFiles
      .filter(file => {
        if (file.size > maxSize) {
          onUploadError?.(new Error(`File ${file.name} exceeds ${maxFileSizeMB}MB limit`));
          return false;
        }
        return true;
      })
      .map(file => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        progress: 0,
        status: 'pending' as const,
      }));

    setUploads(prev => [...prev, ...newUploads]);

    // Start uploading each file
    newUploads.forEach(upload => {
      uploadFile(upload);
    });
  }, [maxFileSizeMB, onUploadComplete, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    multiple: true,
  });

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(u => u.status !== 'success'));
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium">{String(t('upload.dropFilesHere'))}</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-1">{String(t('upload.dragDropHere'))}</p>
            <p className="text-sm text-muted-foreground mb-2">{String(t('upload.orClickToBrowse'))}</p>
            <p className="text-xs text-muted-foreground">
              {String(t('upload.supports'))}
            </p>
            <p className="text-xs text-muted-foreground">{String(t('upload.maxSize'))}: {maxFileSizeMB}MB</p>
          </>
        )}
      </div>

      {/* Upload list */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">{String(t('upload.uploads'))}</h3>
            {uploads.some(u => u.status === 'success') && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                {String(t('upload.clearCompleted'))}
              </Button>
            )}
          </div>

          {uploads.map(upload => {
            const FileIcon = getFileIcon(upload.file.type);

            return (
              <Card key={upload.id} className="p-3">
                <div className="flex items-center gap-3">
                  <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{upload.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(upload.file.size)}
                    </p>

                    {upload.status === 'validating' && (
                      <p className="text-xs text-yellow-600 mt-1">{String(t('upload.validating'))}</p>
                    )}

                    {upload.status === 'uploading' && (
                      <Progress value={upload.progress} className="h-1 mt-2" />
                    )}

                    {upload.status === 'error' && (
                      <p className="text-xs text-destructive mt-1">{upload.error}</p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {upload.status === 'pending' && (
                      <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                    )}
                    {upload.status === 'validating' && (
                      <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                    )}
                    {upload.status === 'uploading' && (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    )}
                    {upload.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {upload.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => removeUpload(upload.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DocumentUploader;
