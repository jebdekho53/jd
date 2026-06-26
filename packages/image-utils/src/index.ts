export type ImageCropMode = 'square' | 'banner';

export interface ImageDimensions {
  width: number;
  height: number;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.88): string {
  return canvas.toDataURL('image/jpeg', quality);
}

/** Center-crop to square and resize to `size` px. */
export async function cropToSquare(file: File, size = 512): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const side = Math.min(img.width, img.height);
  const sx = Math.floor((img.width - side) / 2);
  const sy = Math.floor((img.height - side) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  return canvasToJpeg(canvas);
}

/** Center-crop to 3:1 banner (default 1200×400). */
export async function cropToBanner(
  file: File,
  width = 1200,
  height = 400,
): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const targetRatio = width / height;
  const sourceRatio = img.width / img.height;

  let sw: number;
  let sh: number;
  let sx: number;
  let sy: number;

  if (sourceRatio > targetRatio) {
    sh = img.height;
    sw = sh * targetRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
  return canvasToJpeg(canvas);
}

export async function readImageDimensions(dataUrl: string): Promise<ImageDimensions> {
  const img = await loadImage(dataUrl);
  return { width: img.width, height: img.height };
}

export async function processImageFile(
  file: File,
  mode: ImageCropMode,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }
  return mode === 'banner' ? cropToBanner(file) : cropToSquare(file);
}
