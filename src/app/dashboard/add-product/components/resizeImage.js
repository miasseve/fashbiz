// Phone photos (iPhones especially) are routinely 3-8MB+ at full resolution.
// Vercel's serverless functions hard-reject request bodies over ~4.5MB. The
// old crop screen used to downscale every photo before upload; now that the
// crop step is gone (photos go straight through), we keep the exact same
// safeguard here so large phone photos still upload without any manual step.
const MAX_DIMENSION = 1600;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this image."));
    img.src = src;
  });

/**
 * Downscale a selected image File so its longest side is at most
 * MAX_DIMENSION, re-encode it as JPEG, and guard against the platform's
 * upload size limit. Returns a new File, or throws a friendly Error.
 */
export async function resizeImageFile(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);

    let width = img.naturalWidth;
    let height = img.naturalHeight;
    const longestSide = Math.max(width, height);
    if (longestSide > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / longestSide;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    // fillColor: JPEG has no alpha channel, so any transparency flattens to
    // black on export without this white base (the old "black edge" bug).
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) {
      throw new Error(
        "Could not process this image. Please try a different photo.",
      );
    }
    if (blob.size > MAX_UPLOAD_BYTES) {
      throw new Error(
        "This image is too large to upload. Please try a different photo.",
      );
    }

    const baseName = (file.name || "photo").replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpeg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
