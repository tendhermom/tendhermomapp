/**
 * Client-side image compression before upload.
 * Reduces bandwidth and storage costs significantly.
 */

const MAX_DIMENSION = 1200;
const QUALITY = 0.8;

export async function compressImage(
  file: File,
  options?: { maxDimension?: number; quality?: number; maxSizeKB?: number }
): Promise<File> {
  const maxDim = options?.maxDimension || MAX_DIMENSION;
  const quality = options?.quality || QUALITY;
  const maxSizeKB = options?.maxSizeKB || 500;

  // Skip if already small enough
  if (file.size <= maxSizeKB * 1024) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if exceeds max dimension
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          // Only use compressed if smaller
          resolve(compressed.size < file.size ? compressed : file);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fallback to original
    };

    img.src = url;
  });
}
