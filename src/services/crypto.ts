/**
 * Cryptographic utility service using the Web Crypto API
 * Implements SHA-256 for audit hash chains, document integrity hashes, and file signature inspection.
 */

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

// Fallback pure JS SHA-256 for non-secure / restricted iframe contexts
function fallbackSha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0, j = 0;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;
  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0, ...hash];
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export async function sha256(message: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      const msgUint8 = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('SubtleCrypto digest fallback activated:', e);
  }
  return fallbackSha256(message);
}

export async function sha256Bytes(buffer: ArrayBuffer): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('SubtleCrypto bytes fallback activated:', e);
  }
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return fallbackSha256(str);
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
