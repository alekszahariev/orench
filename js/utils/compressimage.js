export async function compressImage(file, quality = 0.5, maxWidth = 1000) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const reader = new FileReader();

        reader.onload = (event) => {
            image.src = event.target.result;
        };

        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Maintain aspect ratio
            const scaleFactor = Math.min(maxWidth / image.width, 1);
            const width = image.width * scaleFactor;
            const height = image.height * scaleFactor;

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(image, 0, 0, width, height);

            // Compress to JPEG with quality (0.1–1.0)
            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error('Compression failed.'));
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                },
                'image/jpeg',
                quality
            );
        };

        image.onerror = (err) => {
            reject(err);
        };

        reader.readAsDataURL(file);
    });
}

export async function compressBase64Image(base64, mimeType = 'image/jpeg', quality = 0.7) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
  
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
  
        canvas.toBlob((blob) => {
          if (!blob) return reject('Compression failed');
          resolve(blob);
        }, mimeType, quality);
      };
      img.onerror = reject;
      img.src = base64;
    });
  }