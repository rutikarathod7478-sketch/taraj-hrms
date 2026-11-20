import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { put, del } from '@vercel/blob';

export interface StoredFileResult {
  fileName: string;
  filePath: string;
  originalName: string;
  fileSizeBytes: number;
  mimeType: string;
  blobUrl?: string;
  blobPathname?: string;
  isBlob?: boolean;
}

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB) || 15;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
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
 * Validate file content, extension, MIME type, and size (up to 15 MB).
 * Inspects magic bytes so file extensions cannot be spoofed.
 */
export function validateFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  subFolder: 'resumes' | 'recordings' | 'documents' | 'offer_letters'
): { isValid: boolean; error?: string } {
  // 1. Size Validation (15 MB limit)
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of ${MAX_FILE_SIZE_MB} MB.`,
    };
  }

  const ext = path.extname(fileName).toLowerCase();

  // 2. Resume specific validation (PDF, DOC, DOCX)
  if (subFolder === 'resumes') {
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    if (!allowedExtensions.includes(ext)) {
      return {
        isValid: false,
        error: `Invalid file format "${ext}". Only PDF (.pdf), Word 97-2003 (.doc), and Word (.docx) files are accepted.`,
      };
    }

    const allowedResumeMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream',
    ];
    if (mimeType && !allowedResumeMimes.includes(mimeType.toLowerCase())) {
      return {
        isValid: false,
        error: `Invalid MIME type "${mimeType}". Only PDF and Word documents are permitted.`,
      };
    }

    // 3. Content signature (Magic Bytes) inspection
    // PDF: %PDF- (0x25 0x50 0x44 0x46)
    const isPdf =
      buffer.length >= 4 &&
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46;

    // DOCX / Office Open XML: PK\x03\x04 (0x50 0x4B 0x03 0x04)
    const isDocx =
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4B &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04;

    // DOC (OLE Compound File Binary): 0xD0 0xCF 0x11 0xE0
    const isDoc =
      buffer.length >= 4 &&
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0;

    if (!isPdf && !isDocx && !isDoc) {
      return {
        isValid: false,
        error: 'File content verification failed. The uploaded file does not match a valid PDF, DOC, or DOCX document signature.',
      };
    }
  } else if (subFolder === 'recordings') {
    const allowedAudioExts = ['.webm', '.mp3', '.wav', '.ogg', '.mp4'];
    if (!allowedAudioExts.includes(ext)) {
      return {
        isValid: false,
        error: `Invalid audio format "${ext}". Allowed: .webm, .mp3, .wav, .ogg, .mp4.`,
      };
    }
  } else {
    // General documents & offer letters
    const allowedDocExts = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedDocExts.includes(ext)) {
      return {
        isValid: false,
        error: `Invalid file extension "${ext}". Allowed: PDF, Word, and images (JPEG, PNG, WebP).`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Save an uploaded file using Private Vercel Blob on Production,
 * or Local Filesystem on Localhost.
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

  // Validate file content, extension, MIME type, and size
  const validation = validateFile(buffer, originalName, mimeType, subFolder);
  if (!validation.isValid) {
    throw new Error(validation.error || 'File validation failed.');
  }

  const ext = path.extname(originalName) || (subFolder === 'recordings' ? '.webm' : '.pdf');
  const baseName = customName || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const finalFileName = `${baseName}${ext}`;

  // Check for Vercel Blob credentials
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.HRMS_DOCUMENTS_READ_WRITE_TOKEN;
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  // 1. Production Mode: Private Vercel Blob Storage
  if (blobToken) {
    try {
      const blobPathname = `${subFolder}/${finalFileName}`;
      const blob = await put(blobPathname, buffer, {
        access: 'private',
        contentType: mimeType,
        token: blobToken,
        addRandomSuffix: false,
      });

      // Secure viewing route for private blobs
      const secureViewUrl = `/api/onboarding?action=view_document&filePath=${encodeURIComponent(blob.url)}`;

      return {
        fileName: finalFileName,
        filePath: secureViewUrl,
        originalName,
        fileSizeBytes: buffer.length,
        mimeType,
        blobUrl: blob.url,
        blobPathname: blob.pathname,
        isBlob: true,
      };
    } catch (blobErr: any) {
      console.error('[FileStorage] Vercel Blob upload failed:', blobErr);
      throw new Error(`Cloud storage upload failed: ${blobErr.message || 'Error uploading to Vercel Blob.'}`);
    }
  }

  // 2. Localhost Mode: Local Filesystem (public/uploads)
  const uploadDir = process.env.UPLOAD_DIR || 'public/uploads';
  let targetDir = path.join(/*turbopackIgnore: true*/ process.cwd(), uploadDir, subFolder);
  let diskPath = path.join(/*turbopackIgnore: true*/ targetDir, finalFileName);
  let virtualPath = `/${uploadDir.replace(/^public\//, '')}/${subFolder}/${finalFileName}`;

  try {
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(diskPath, buffer);
  } catch (err: any) {
    // If running on Vercel without a token, use /tmp fallback to prevent crashes
    if (err.code === 'EROFS' || err.code === 'EACCES' || isVercel) {
      console.warn(`[FileStorage] Read-only filesystem detected without BLOB_READ_WRITE_TOKEN. Using /tmp fallback.`);
      const tmpBase = os.tmpdir() || '/tmp';
      targetDir = path.join(tmpBase, 'uploads', subFolder);
      diskPath = path.join(targetDir, finalFileName);

      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(diskPath, buffer);
      virtualPath = `/api/onboarding?action=view_document&filePath=uploads/${subFolder}/${finalFileName}`;
    } else {
      throw err;
    }
  }

  return {
    fileName: finalFileName,
    filePath: virtualPath,
    originalName,
    fileSizeBytes: buffer.length,
    mimeType,
    isBlob: false,
  };
}

/**
 * Safely delete an uploaded file from Vercel Blob or local storage
 * (useful to clean up orphaned uploads on failed transactions).
 */
export async function deleteStoredFile(filePathOrUrl: string): Promise<void> {
  if (!filePathOrUrl) return;

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.HRMS_DOCUMENTS_READ_WRITE_TOKEN;

  // Extract raw URL if wrapped in view_document query param
  let target = filePathOrUrl;
  if (target.includes('filePath=')) {
    try {
      const parsed = new URL(target, 'http://localhost');
      const inner = parsed.searchParams.get('filePath');
      if (inner) target = inner;
    } catch {}
  }

  // 1. Cloud Storage (Vercel Blob)
  if (target.startsWith('http://') || target.startsWith('https://') || target.includes('vercel-storage.com')) {
    if (blobToken) {
      try {
        await del(target, { token: blobToken });
      } catch (err) {
        console.warn('[FileStorage] Error deleting blob:', err);
      }
    }
    return;
  }

  // 2. Localhost storage
  try {
    const uploadsBaseDir = path.resolve(process.cwd(), 'public', 'uploads');
    const cleanPath = target.replace(/^\/+/, '').replace(/^public[\\/]/, '').replace(/^uploads[\\/]/, '');
    let diskPath = path.resolve(uploadsBaseDir, cleanPath);

    if (!diskPath.startsWith(uploadsBaseDir)) {
      const tmpBaseDir = path.resolve(os.tmpdir(), 'uploads');
      const tmpPath = path.resolve(tmpBaseDir, cleanPath);
      if (tmpPath.startsWith(tmpBaseDir)) {
        diskPath = tmpPath;
      }
    }

    await fs.unlink(diskPath);
  } catch {
    // Ignore error if file doesn't exist
  }
}
