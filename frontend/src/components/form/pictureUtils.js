/** Shared image-picking rules (mirrors backend/.env limits). */

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");

export const MAX_FILE_MB = 5;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
export const MAX_PICTURES = 8;

/** Returns an error message for a rejected file, or null when it is fine. */
export function checkFile(file, maxBytes = MAX_FILE_BYTES) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `${file.name}: choose a PNG, JPEG, GIF or WEBP image.`;
  }
  if (file.size > maxBytes) {
    return `${file.name}: larger than ${MAX_FILE_MB} MB.`;
  }
  return null;
}

export function sameFile(a, b) {
  return a.name === b.name && a.size === b.size && a.type === b.type;
}