// utils/imageOptimizer.ts - Fast client-side image compression and resizing for mobile networks
export interface OptimizedImageResult {
  base64: string;
  dataUrl: string;
  mimeType: string;
  originalSize: number;
  optimizedSize: number;
  reductionPercentage: number;
  dimensions: { width: number; height: number };
}

/**
 * Resizes and compresses an image file on an HTML Canvas.
 * Dramatically speeds up uploads on rural mobile networks (reduces 10MB+ down to ~150KB).
 */
export async function optimizeImage(
  file: File,
  maxDimension = 1280,
  quality = 0.82
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    const originalSize = file.size;
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.onload = () => {
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        // Scale down while maintaining aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // Draw image with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Prefer image/jpeg for consistency and high compression
        const outputMime = 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputMime, quality);
        const base64 = dataUrl.split(',')[1];

        // Approximate size of base64 in bytes: (length * 3 / 4)
        const optimizedSize = Math.round((base64.length * 3) / 4);
        const reductionPercentage = Math.max(
          0,
          Math.round(((originalSize - optimizedSize) / originalSize) * 100)
        );

        resolve({
          base64,
          dataUrl,
          mimeType: outputMime,
          originalSize,
          optimizedSize,
          reductionPercentage,
          dimensions: { width, height },
        });
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes into human readable format (KB / MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
