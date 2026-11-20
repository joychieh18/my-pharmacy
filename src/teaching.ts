import { previewSupply, validateMedicine, type MedicineInput } from './model';
import { decodeImage, imageTypes } from './images';

export interface CodeEntry {
  active: boolean;
  manifest: string;
}
export interface CodeIndex {
  schemaVersion: 1;
  codes: Record<string, CodeEntry>;
}
export interface TeachingPack {
  schemaVersion: 1;
  title: string;
  version: string;
  medicines: MedicineInput[];
}

export function normalizeCode(raw: string) {
  if (
    raw.length !== 6 ||
    !/^[A-HJ-NP-Za-hj-np-z2-9]+$/.test(raw) ||
    !/[A-Za-z]/.test(raw) ||
    !/[2-9]/.test(raw)
  ) {
    throw new Error('請輸入六位英數混合代碼，且不含 O、0、I、1 或空白。');
  }
  return raw.toUpperCase();
}
export const manifestPath = (version: string) => `versions/${version}.json`;
export const safeManifest = (path: unknown): path is string =>
  typeof path === 'string' && /^versions\/[a-z0-9-]{1,80}\.json$/.test(path);
export const safeImage = (path: unknown): path is string =>
  typeof path === 'string' &&
  /^images\/[a-z0-9-]{1,120}\.(png|jpg|webp)$/.test(path);

export function validateIndex(value: unknown): CodeIndex {
  const data = value as CodeIndex;
  if (
    data?.schemaVersion !== 1 ||
    !data.codes ||
    typeof data.codes !== 'object' ||
    Array.isArray(data.codes)
  )
    throw new Error('教材代碼索引格式錯誤。');
  if (
    Object.keys(data).some((key) => key !== 'schemaVersion' && key !== 'codes')
  )
    throw new Error('索引含未定義的欄位。');
  const paths = new Set<string>();
  for (const [code, entry] of Object.entries(data.codes)) {
    if (
      normalizeCode(code) !== code ||
      typeof entry?.active !== 'boolean' ||
      !safeManifest(entry.manifest) ||
      paths.has(entry.manifest)
    )
      throw new Error(`索引項目無效：${code}`);
    if (
      Object.keys(entry).some((key) => key !== 'active' && key !== 'manifest')
    )
      throw new Error(`索引欄位無效：${code}`);
    paths.add(entry.manifest);
  }
  return data;
}

export function validatePack(value: unknown, path: string): TeachingPack {
  const pack = value as TeachingPack;
  if (
    pack?.schemaVersion !== 1 ||
    typeof pack.title !== 'string' ||
    !pack.title.trim() ||
    typeof pack.version !== 'string' ||
    manifestPath(pack.version) !== path ||
    !safeManifest(path) ||
    !Array.isArray(pack.medicines) ||
    !pack.medicines.length
  )
    throw new Error('教材版本或內容格式錯誤。');
  if (
    Object.keys(pack).some(
      (key) =>
        !['schemaVersion', 'title', 'version', 'medicines'].includes(key),
    )
  )
    throw new Error('教材含未定義的欄位。');
  const fields = new Set([
    'genericName',
    'strength',
    'dosageFormId',
    'brand',
    'category',
    'indication',
    'classification',
    'template',
    'image',
    'crop',
  ]);
  pack.medicines.forEach((med, i) => {
    try {
      validateMedicine(med);
      if (Object.keys(med).some((key) => !fields.has(key)))
        throw new Error('藥品含未定義的欄位。');
      if (med.image !== undefined && !safeImage(med.image))
        throw new Error('圖片路徑無效。');
    } catch (err) {
      throw new Error(`第 ${i + 1} 項藥品無效。`, { cause: err });
    }
  });
  return pack;
}

const resource = (path: string) =>
  `${import.meta.env.BASE_URL}teaching/${path}`;
async function fetchResource(path: string, signal?: AbortSignal) {
  const response = await fetch(resource(path), { signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`無法載入教材資源（${response.status}）。`);
  return response;
}
export async function loadIndex(signal?: AbortSignal) {
  return validateIndex(
    await (await fetchResource('index.json', signal)).json(),
  );
}
export async function loadPack(raw: string, signal: AbortSignal) {
  const code = normalizeCode(raw);
  const index = await loadIndex(signal);
  const entry = index.codes[code];
  if (!entry) throw new Error('找不到這組教材代碼。');
  if (!entry.active) throw new Error('這組代碼已停用。');
  const pack = validatePack(
    await (await fetchResource(entry.manifest, signal)).json(),
    entry.manifest,
  );
  const requests = new Map<string, Promise<string>>();
  const getImage = (path: string) => {
    const existing = requests.get(path);
    if (existing) return existing;
    const request = (async () => {
      const blob = await (await fetchResource(path, signal)).blob();
      if (!imageTypes.includes(blob.type) || blob.size > 2_000_000)
        throw new Error('教材圖片格式或容量錯誤。');
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('教材圖片讀取失敗。'));
        reader.readAsDataURL(blob);
      });
      const img = await decodeImage(data);
      if (Math.max(img.naturalWidth, img.naturalHeight) > 1024)
        throw new Error('教材圖片尺寸超出 1024 px。');
      return data;
    })();
    requests.set(path, request);
    return request;
  };
  const medicines = await Promise.all(
    pack.medicines.map(async (med) => ({
      ...med,
      image: med.image ? await getImage(med.image) : undefined,
    })),
  );
  signal.throwIfAborted();
  return { ...pack, medicines };
}

export const uniqueForPublication = <T extends MedicineInput>(items: T[]) =>
  previewSupply([], items).fresh;

export function checkHistory(before: CodeIndex, after: CodeIndex) {
  for (const [code, old] of Object.entries(before.codes)) {
    if (after.codes[code]?.manifest !== old.manifest)
      throw new Error(`不得刪除或重新分配已發布代碼 ${code}。`);
  }
}
