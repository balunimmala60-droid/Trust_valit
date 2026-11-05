/**
 * Cryptographic utility service using the Web Crypto API
 * Implements SHA-256 for audit hash chains, document integrity hashes, and file signature inspection.
 */

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Bytes(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates file magic bytes (signatures)
 */
export async function inspectFileMagicBytes(file: File): Promise<{
  valid: boolean;
  detectedType: string;
  expectedExtension: string;
  error?: string;
}> {
  const slice = file.slice(0, 16);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;

  // DOCX / ZIP: PK\x03\x04 (0x50 0x4B 0x03 0x04)
  const isZipDocx = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;

  // PNG: \x89PNG\r\n\x1a\n (0x89 0x50 0x4E 0x47)
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;

  // JPEG: \xFF\xD8\xFF (0xFF 0xD8 0xFF)
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

  let detectedType = 'UNKNOWN_BINARY';
  if (isPdf) detectedType = 'application/pdf';
  else if (isZipDocx) detectedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  else if (isPng) detectedType = 'image/png';
  else if (isJpeg) detectedType = 'image/jpeg';

  const validExts = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
  if (!validExts.includes(ext)) {
    return {
      valid: false,
      detectedType,
      expectedExtension: ext,
      error: `Disallowed extension '.${ext}'. Permitted: pdf, docx, jpg, jpeg, png.`
    };
  }

  // Cross-reference extension with signature
  if (ext === 'pdf' && !isPdf) {
    return {
      valid: false,
      detectedType,
      expectedExtension: ext,
      error: `File signature mismatch! File claims to be .pdf but header does not begin with '%PDF-'. Spoofing rejected.`
    };
  }

  if (ext === 'docx' && !isZipDocx) {
    return {
      valid: false,
      detectedType,
      expectedExtension: ext,
      error: `File signature mismatch! File claims to be .docx but header does not match ZIP container (PK\x03\x04).`
    };
  }

  if (ext === 'png' && !isPng) {
    return {
      valid: false,
      detectedType,
      expectedExtension: ext,
      error: `File signature mismatch! File claims to be .png but header does not match PNG magic bytes.`
    };
  }

  if ((ext === 'jpg' || ext === 'jpeg') && !isJpeg) {
    return {
      valid: false,
      detectedType,
      expectedExtension: ext,
      error: `File signature mismatch! File claims to be JPEG but header does not match \\xFF\\xD8\\xFF.`
    };
  }

  return {
    valid: true,
    detectedType,
    expectedExtension: ext
  };
}

/**
 * Format bytes into human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
