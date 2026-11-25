/**
 * Shrinks an uploaded photo to a small data URL (max side 480px, WebP keeps transparency).
 * Keeps each prize document tiny, well below Firestore's 1 MB document limit.
 */
export const compressImageFile = (file: File, maxSide = 480, quality = 0.85): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const original = typeof reader.result === 'string' ? reader.result : '';
      const img = new Image();
      img.onerror = () => resolve(original);
      img.onload = () => {
        try {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(original);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/webp', quality);
          resolve(compressed.length < original.length ? compressed : original);
        } catch {
          resolve(original);
        }
      };
      img.src = original;
    };
    reader.readAsDataURL(file);
  });
