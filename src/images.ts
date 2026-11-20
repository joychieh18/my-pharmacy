export type Crop = {
  mode: 'contain' | 'fill';
  x: number;
  y: number;
  zoom: number;
};
export const defaultCrop: Crop = { mode: 'contain', x: 0.5, y: 0.5, zoom: 1 };
export const imageTypes = ['image/png', 'image/jpeg', 'image/webp'];
export const validDataImage = (src: string) =>
  /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(src);

export async function imageFromBlob(blob: Blob) {
  if (blob.size > 2_000_000 || !imageTypes.includes(blob.type))
    throw new Error('請選擇 2 MB 以內的 PNG、JPEG 或 WebP 圖片。');
  const url = URL.createObjectURL(blob);
  try {
    const img = await decodeImage(url);
    const ratio = Math.min(
      1,
      1024 / Math.max(img.naturalWidth, img.naturalHeight),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', 0.87);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function decodeImage(src: string) {
  const img = new Image();
  img.src = src;
  try {
    await img.decode();
    if (img.naturalWidth && img.naturalHeight) return img;
  } catch {
    /* invalid data */
  }
  throw new Error('圖片無法解碼。');
}

export function paintImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  crop: Crop,
) {
  const { width, height } = ctx.canvas;
  const fit = crop.mode === 'fill' ? Math.max : Math.min;
  const scale =
    fit(width / img.naturalWidth, height / img.naturalHeight) *
    (crop.mode === 'fill' ? crop.zoom : 1);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(
    img,
    (width - w) * (crop.mode === 'fill' ? crop.x : 0.5),
    (height - h) * (crop.mode === 'fill' ? crop.y : 0.5),
    w,
    h,
  );
}
