// Advertiser profile photos (a headshot or company logo).
//
// Uploads are never stored or served as sent. Only JPEG, PNG and WebP are accepted (checked by their first
// bytes, before any decoder sees them); each one is decoded with a pixel limit and re-encoded as a fresh
// 400x400 WebP, which drops metadata such as GPS location and anything hidden in the original file. The result
// is served from our own origin, only after an admin approves it, and its SHA-256 is published in the signed
// directory so browsers can check the picture they get is the one that was approved.

import { createHash } from 'node:crypto';
import sharp from 'sharp';

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_SIZE = 400;
const MAX_INPUT_PIXELS = 40_000_000; // about 7,000 x 5,700: bigger than any phone photo, small enough to decode safely

export type PhotoType = 'jpeg' | 'png' | 'webp';

/** Recognizes the three accepted formats by their signature bytes; anything else (SVG, GIF, HEIC, TIFF...) is refused. */
export function sniffPhoto(buf: Buffer): PhotoType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}

export class PhotoError extends Error {}

/** Checks, decodes and re-encodes an upload. Throws PhotoError with a message fit to show the advertiser. */
export async function processPhoto(buf: Buffer): Promise<{ image: Buffer; sha256: string }> {
  if (buf.length === 0) throw new PhotoError('Choose a photo to upload.');
  if (buf.length > PHOTO_MAX_BYTES) throw new PhotoError('That photo is over 5 MB. Choose a smaller one.');
  const type = sniffPhoto(buf);
  if (!type) throw new PhotoError('Use a JPG, PNG or WebP photo.');
  let image: Buffer;
  try {
    const input = sharp(buf, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error', animated: false });
    const meta = await input.metadata();
    if (meta.format !== type) throw new PhotoError('That file isn’t a valid JPG, PNG or WebP photo.');
    if (!meta.width || !meta.height || meta.width < 100 || meta.height < 100) throw new PhotoError('Use a photo at least 100 × 100 pixels.');
    image = await input
      .rotate() // respect the camera's orientation before its metadata is dropped
      .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: 'cover', position: 'attention' })
      .flatten({ background: '#ffffff' }) // transparent logos on white
      .webp({ quality: 82 })
      .toBuffer();
  } catch (e) {
    if (e instanceof PhotoError) throw e;
    throw new PhotoError('That photo couldn’t be read. Try a different JPG or PNG.');
  }
  return { image, sha256: createHash('sha256').update(image).digest('hex') };
}
