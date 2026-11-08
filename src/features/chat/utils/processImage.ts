import imageCompression from "browser-image-compression";

export type ProcessImageOptions = { maxDimension: number; maxSizeMB: number; cropSquare?: boolean };

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("This image could not be prepared for compression.")), "image/webp", 1));
}

async function cropSquare(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error("This image could not be opened. Choose a readable image file."); }
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, side, side);
    return new File([await canvasBlob(canvas)], "avatar.webp", { type: "image/webp" });
  } finally { bitmap.close(); }
}

export async function processImage(file: File, options: ProcessImageOptions): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  const input = options.cropSquare ? await cropSquare(file) : file;
  const settings = { maxSizeMB: options.maxSizeMB, maxWidthOrHeight: options.maxDimension, useWebWorker: true, fileType: "image/webp" as const };
  let result = await imageCompression(input, settings);
  const maxBytes = options.maxSizeMB * 1024 * 1024;
  if (result.type !== "image/webp" || result.size > maxBytes) {
    result = await imageCompression(input, { ...settings, maxSizeMB: options.maxSizeMB * 0.8, maxWidthOrHeight: Math.max(1, Math.floor(options.maxDimension * 0.9)), initialQuality: 0.65 });
  }
  if (result.type !== "image/webp" || result.size > maxBytes) throw new Error(`This image could not be compressed to ${Math.round(options.maxSizeMB * 1024)} KB. Choose a smaller image.`);
  return result;
}
