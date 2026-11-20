export type Crop = {
  mode: 'contain' | 'fill';
  x: number;
  y: number;
  zoom: number;
};
export const defaultCrop: Crop = { mode: 'fill', x: 0.5, y: 0.5, zoom: 1 };
export const legacyCrop: Crop = { ...defaultCrop, mode: 'contain' };
export const maxImageBytes = 5_000_000;
export const maxImageSide = 2048;
export const imageTypes = ['image/png', 'image/jpeg', 'image/webp'];
export const validDataImage = (src: string) =>
  /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(src);

export async function matchesImageType(blob: Blob) {
  const header = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const matches = (offset: number, bytes: number[]) =>
    bytes.every((byte, index) => header[offset + index] === byte);
  switch (blob.type) {
    case 'image/png':
      return matches(0, [137, 80, 78, 71, 13, 10, 26, 10]);
    case 'image/jpeg':
      return matches(0, [255, 216, 255]);
    case 'image/webp':
      return matches(0, [82, 73, 70, 70]) && matches(8, [87, 69, 66, 80]);
    default:
      return false;
  }
}

export async function imageFromBlob(blob: Blob) {
  if (blob.size > maxImageBytes || !imageTypes.includes(blob.type))
    throw new Error('請選擇 5 MB 以內的 PNG、JPEG 或 WebP 圖片。');
  if (!(await matchesImageType(blob)))
    throw new Error('圖片無法解碼，請檢查檔案格式。');
  const url = URL.createObjectURL(blob);
  try {
    const img = await decodeImage(url);
    const ratio = Math.min(
      1,
      maxImageSide / Math.max(img.naturalWidth, img.naturalHeight),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.91, 0.82, 0.7]) {
      const converted = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', quality),
      );
      if (converted && converted.size <= maxImageBytes)
        return blobDataUrl(converted);
    }
    if (ratio === 1) return blobDataUrl(blob);
    throw new Error('處理後的圖片仍超過 5 MB，請選擇另一張圖片。');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function blobDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('圖片讀取失敗。'));
    reader.readAsDataURL(blob);
  });
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

export function cropLayout(
  width: number,
  height: number,
  img: HTMLImageElement,
  crop: Crop,
) {
  const fit = crop.mode === 'fill' ? Math.max : Math.min;
  const scale =
    fit(width / img.naturalWidth, height / img.naturalHeight) *
    (crop.mode === 'fill' ? crop.zoom : 1);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  return {
    w,
    h,
    x: (width - w) * (crop.mode === 'fill' ? crop.x : 0.5),
    y: (height - h) * (crop.mode === 'fill' ? crop.y : 0.5),
  };
}

export function paintImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  crop: Crop,
) {
  const { w, h, x, y } = cropLayout(
    ctx.canvas.width,
    ctx.canvas.height,
    img,
    crop,
  );
  ctx.drawImage(img, x, y, w, h);
}
