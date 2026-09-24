/**
 * Browser-only: re-encodes a chosen image as the cover JPEG the server
 * accepts (`data:image/jpeg;base64,…`, at most 256 KB decoded). Same ladder as
 * the desktop codec: 16:9 center crop at 1200×675, then smaller sizes and
 * lower qualities until it fits.
 */
export const MAX_COVER_BYTES = 256 * 1024;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const SIZES: [number, number][] = [[1200, 675], [960, 540], [720, 405]];
const QUALITIES = [0.82, 0.7, 0.58, 0.46];

export class CoverEncodeError extends Error {}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new CoverEncodeError("Could not read the encoded image."));
    reader.readAsDataURL(blob);
  });
}

export async function encodeCoverImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new CoverEncodeError("Choose an image file (JPEG, PNG, WebP…).");
  if (file.size > MAX_SOURCE_BYTES) throw new CoverEncodeError("That image is larger than 20 MB. Choose a smaller one.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new CoverEncodeError("This browser could not read that image. Try a JPEG or PNG.");
  }
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new CoverEncodeError("This browser cannot re-encode images.");
    for (const [width, height] of SIZES) {
      canvas.width = width;
      canvas.height = height;
      const scale = Math.max(width / bitmap.width, height / bitmap.height);
      const drawWidth = bitmap.width * scale;
      const drawHeight = bitmap.height * scale;
      context.fillStyle = "#141413";
      context.fillRect(0, 0, width, height);
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      for (const quality of QUALITIES) {
        const blob = await toBlob(canvas, quality);
        if (blob && blob.size <= MAX_COVER_BYTES) return toDataUrl(blob);
      }
    }
  } finally {
    bitmap.close();
  }
  throw new CoverEncodeError("Could not get this image under 256 KB. Choose a simpler image.");
}
