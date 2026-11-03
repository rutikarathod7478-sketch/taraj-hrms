import { promises as fs } from 'fs';
import path from 'path';

export interface StoredFileResult {
  fileName: string;
  filePath: string;
  originalName: string;
  fileSizeBytes: number;
  mimeType: string;
}

const MAX_FILE_SIZE = (Number(process.env.MAX_FILE_SIZE_MB) || 15) * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/webm',
  'audio/ogg',
  'audio/wav',
  'audio/mpeg',
  'audio/mp4',
  'image/jpeg',
  'image/png',
  'image/webp',
];

/**
 * Save an uploaded file to the local filesystem with size and MIME validation
 */
export async function saveUploadedFile(
  subFolder: 'resumes' | 'recordings' | 'documents' | 'offer_letters',
  file: File | Blob,
  customName?: string
): Promise<StoredFileResult> {
  const originalName = file instanceof File ? file.name : 'upload.bin';
  const mimeType = file.type || 'application/octet-stream';

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
  }

  // Validate mime type if provided and not generic
  if (mimeType && mimeType !== 'application/octet-stream' && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  // Save under public/uploads or configured storage path
  const uploadDir = process.env.UPLOAD_DIR || 'public/uploads';
  const targetDir = path.join(/*turbopackIgnore: true*/ process.cwd(), uploadDir, subFolder);
  await fs.mkdir(targetDir, { recursive: true });

  const ext = path.extname(originalName) || (subFolder === 'recordings' ? '.webm' : '.pdf');
  const baseName = customName || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const finalFileName = `${baseName}${ext}`;
  const diskPath = path.join(/*turbopackIgnore: true*/ targetDir, finalFileName);

  await fs.writeFile(diskPath, buffer);

  // Return public or virtual storage URL
  const virtualPath = `/${uploadDir.replace(/^public\//, '')}/${subFolder}/${finalFileName}`;

  return {
    fileName: finalFileName,
    filePath: virtualPath,
    originalName,
    fileSizeBytes: buffer.length,
    mimeType,
  };
}
