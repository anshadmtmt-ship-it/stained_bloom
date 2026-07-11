// storage.js — Image upload, compression, thumbnail generation & deletion
// Handles all Supabase Storage operations for Stained Blooms CMS
import { supabase } from '../utils/supabase.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates file MIME type, extension, and size.
 * Throws a descriptive Error if invalid.
 */
export function validateImageFile(file) {
  if (!file) throw new Error('No file provided.');

  const mime = file.type.toLowerCase();
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    throw new Error(
      `Unsupported file type "${file.type}". Allowed: JPG, JPEG, PNG, WEBP.`
    );
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported extension ".${ext}". Allowed: jpg, jpeg, png, webp.`
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(
      `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed: 10 MB.`
    );
  }
}

// ─── Image Processing ─────────────────────────────────────────────────────────

/**
 * Resizes and compresses an image using Canvas API.
 * Converts to WebP for optimal size. Returns a Blob.
 */
function processImageToBlob(file, { maxWidth, maxHeight, quality }) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Maintain aspect ratio while capping dimensions
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width  = maxWidth;
        }
        if (height > maxHeight) {
          width  = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // White background for transparent PNGs converted to JPEG/WebP
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Prefer WebP; fall back to JPEG on unsupported browsers
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              // Fallback: try JPEG
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) resolve(jpegBlob);
                  else reject(new Error('Image processing failed: could not create blob.'));
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to decode image.'));
      img.src = evt.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

// ─── UUID Filename Generator ──────────────────────────────────────────────────

function uniqueFilename(ext = 'webp') {
  return `${crypto.randomUUID()}.${ext}`;
}

// ─── Gallery Uploads ─────────────────────────────────────────────────────────

/**
 * Uploads a gallery image (main + thumbnail) to the 'gallery' bucket.
 * Returns { imageUrl, thumbnailUrl }.
 * Validates → compresses → converts to WebP → uploads → verifies URL.
 */
export async function uploadGalleryImage(file) {
  validateImageFile(file);

  // Process main image (max 1600×1600, 85% quality)
  const mainBlob  = await processImageToBlob(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
  // Process thumbnail (max 400×400, 80% quality)
  const thumbBlob = await processImageToBlob(file, { maxWidth: 400,  maxHeight: 400,  quality: 0.80 });

  const mainPath  = `uploads/${uniqueFilename('webp')}`;
  const thumbPath = `thumbnails/${uniqueFilename('webp')}`;

  // Upload main image
  const { error: mainErr } = await supabase.storage
    .from('gallery')
    .upload(mainPath, mainBlob, { contentType: 'image/webp', upsert: false });

  if (mainErr) throw new Error(`Gallery upload failed: ${mainErr.message}`);

  const { data: { publicUrl: imageUrl } } = supabase.storage
    .from('gallery')
    .getPublicUrl(mainPath);

  // Verify URL is valid before proceeding
  if (!imageUrl?.startsWith('http')) {
    await supabase.storage.from('gallery').remove([mainPath]);
    throw new Error('Upload failed: could not retrieve a valid public URL.');
  }

  // Upload thumbnail (non-critical — don't fail the whole operation)
  let thumbnailUrl = null;
  const { error: thumbErr } = await supabase.storage
    .from('gallery')
    .upload(thumbPath, thumbBlob, { contentType: 'image/webp', upsert: false });

  if (!thumbErr) {
    const { data: { publicUrl: tUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(thumbPath);
    if (tUrl?.startsWith('http')) thumbnailUrl = tUrl;
  }

  return { imageUrl, thumbnailUrl };
}

// ─── Logo Upload ─────────────────────────────────────────────────────────────

/**
 * Uploads a logo image to the 'logo' bucket.
 * Returns the public URL string.
 */
export async function uploadLogoImage(file) {
  validateImageFile(file);
  const blob     = await processImageToBlob(file, { maxWidth: 800, maxHeight: 800, quality: 0.90 });
  const filename = uniqueFilename('webp');

  const { error } = await supabase.storage
    .from('logo')
    .upload(filename, blob, { contentType: 'image/webp', upsert: false });

  if (error) throw new Error(`Logo upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from('logo').getPublicUrl(filename);
  if (!publicUrl?.startsWith('http')) throw new Error('Logo upload failed: invalid URL returned.');

  return publicUrl;
}

// ─── Hero Image Upload ────────────────────────────────────────────────────────

/**
 * Uploads a hero image to the 'hero' bucket.
 * Returns the public URL string.
 */
export async function uploadHeroImage(file) {
  validateImageFile(file);
  const blob     = await processImageToBlob(file, { maxWidth: 1200, maxHeight: 1600, quality: 0.88 });
  const filename = uniqueFilename('webp');

  const { error } = await supabase.storage
    .from('hero')
    .upload(filename, blob, { contentType: 'image/webp', upsert: false });

  if (error) throw new Error(`Hero image upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from('hero').getPublicUrl(filename);
  if (!publicUrl?.startsWith('http')) throw new Error('Hero upload failed: invalid URL returned.');

  return publicUrl;
}

// ─── Storage Deletion ─────────────────────────────────────────────────────────

/**
 * Parses a Supabase Storage public URL into { bucket, path }.
 * Returns null if the URL is not a valid storage URL.
 */
function parseStorageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const marker = '/object/public/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rest  = url.slice(idx + marker.length);
  const slash = rest.indexOf('/');
  if (slash === -1) return null;
  const bucket = rest.slice(0, slash);
  const path   = decodeURIComponent(rest.slice(slash + 1));
  return { bucket, path };
}

/**
 * Deletes a single file from Supabase Storage by its public URL.
 * Silently logs a warning on failure (non-critical path).
 */
export async function deleteStorageFile(url) {
  if (!url) return;
  const parsed = parseStorageUrl(url);
  if (!parsed) return; // Not a storage URL — skip silently

  const { error } = await supabase.storage
    .from(parsed.bucket)
    .remove([parsed.path]);

  if (error) {
    // Non-fatal: file may have been deleted already
    console.warn(`[Storage] Could not delete ${parsed.bucket}/${parsed.path}:`, error.message);
  }
}

/**
 * Deletes a gallery image's main file AND its thumbnail from Storage.
 * Both deletions run in parallel; failures are warned but not thrown.
 */
export async function deleteGalleryImageFiles(imageUrl, thumbnailUrl) {
  await Promise.allSettled([
    deleteStorageFile(imageUrl),
    deleteStorageFile(thumbnailUrl),
  ]);
}
