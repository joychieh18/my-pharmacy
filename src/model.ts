import type { Crop } from './images';
export const packages = {
  box: { label: '藥盒', width: 0.09, height: 0.15, depth: 0.05 },
  bottle: { label: '藥瓶', width: 0.08, height: 0.12, depth: 0.08 },
  pouch: { label: '藥袋', width: 0.1, height: 0.14, depth: 0.02 },
} as const;

export type Package = keyof typeof packages;

export const forms = [
  ['tablet', '錠劑', 'Tablet', 'box'],
  ['powder', '散劑', 'Powder', 'pouch'],
  ['granules', '顆粒劑', 'Granules', 'pouch'],
  ['chewable-tablet', '咀嚼錠', 'Chewable tablet', 'box'],
  [
    'orally-disintegrating-tablet',
    '口崩錠',
    'Orally disintegrating tablet',
    'box',
  ],
  ['extended-release-tablet', '緩釋錠', 'Extended-release tablet', 'box'],
  ['enteric-coated-tablet', '腸溶錠', 'Enteric-coated tablet', 'box'],
  ['oral-solution', '口服液劑', 'Oral solution', 'bottle'],
  ['oral-suspension', '口服懸液劑', 'Oral suspension', 'bottle'],
  ['syrup', '糖漿劑', 'Syrup', 'bottle'],
  ['oral-drops', '口服滴劑', 'Oral drops', 'bottle'],
  ['cream', '乳膏', 'Cream', 'box'],
  ['ointment', '軟膏', 'Ointment', 'box'],
  ['gel', '凝膠', 'Gel', 'box'],
  ['lotion', '洗劑', 'Lotion', 'bottle'],
  ['transdermal-patch', '經皮貼片', 'Transdermal patch', 'box'],
  ['topical-solution', '外用液劑', 'Topical solution', 'bottle'],
  ['eye-drops', '眼用滴劑', 'Eye drops', 'bottle'],
  ['eye-ointment', '眼用軟膏', 'Eye ointment', 'box'],
  ['ear-drops', '耳用滴劑', 'Ear drops', 'bottle'],
  ['nasal-spray', '鼻用噴劑', 'Nasal spray', 'bottle'],
  ['inhalation-aerosol', '吸入氣霧劑', 'Inhalation aerosol', 'box'],
  ['inhalation-powder', '吸入粉劑', 'Inhalation powder', 'box'],
  ['injection', '注射劑', 'Injection', 'box'],
  ['suppository', '栓劑', 'Suppository', 'box'],
  ['vaginal-tablet', '陰道錠', 'Vaginal tablet', 'box'],
  ['capsule', '膠囊', 'Capsule', 'box'],
] as const satisfies readonly (readonly [string, string, string, Package])[];

export type Zone = 'OTC' | 'RX';
export interface MedicineInput {
  genericName: string;
  strength: string;
  dosageFormId: string;
  brand?: string;
  category?: string;
  indication?: string;
  classification?: Zone | null;
  template?: Package;
  image?: string;
  crop?: Crop;
}
export interface Medicine extends MedicineInput {
  id: string;
}

export const formLabel = (id: string) => {
  const form = forms.find(([key]) => key === id);
  return form ? `${form[1]} / ${form[2]}` : id;
};
export const templateFor = (medicine: MedicineInput) =>
  medicine.template ??
  forms.find(([id]) => medicine.dosageFormId === id)?.[3] ??
  'box';
export const identity = (medicine: MedicineInput) =>
  JSON.stringify([
    medicine.genericName.trim().toLowerCase(),
    medicine.strength.replace(/\s/gu, '').toLowerCase(),
    medicine.dosageFormId,
  ]);

export function validateMedicine(
  value: unknown,
): asserts value is MedicineInput {
  if (!value || typeof value !== 'object')
    throw new Error('藥品資料格式錯誤。');
  const med = value as MedicineInput;
  if (
    typeof med.genericName !== 'string' ||
    !med.genericName.trim() ||
    typeof med.strength !== 'string' ||
    !med.strength.trim() ||
    !forms.some(([id]) => id === med.dosageFormId)
  ) {
    throw new Error('請填寫英文學名、劑量及有效的劑型。');
  }
  for (const field of ['brand', 'category', 'indication', 'image'] as const) {
    if (med[field] !== undefined && typeof med[field] !== 'string')
      throw new Error(`欄位格式錯誤：${field}`);
  }
  if (
    med.classification != null &&
    med.classification !== 'OTC' &&
    med.classification !== 'RX'
  ) {
    throw new Error('OTC／RX 分類無效。');
  }
  if (
    med.crop &&
    (!['contain', 'fill'].includes(med.crop.mode) ||
      ![med.crop.x, med.crop.y].every(
        (n) => Number.isFinite(n) && n >= 0 && n <= 1,
      ) ||
      !Number.isFinite(med.crop.zoom) ||
      med.crop.zoom < 1 ||
      med.crop.zoom > 3)
  )
    throw new Error('裁切設定無效。');
  if (med.template !== undefined && !Object.hasOwn(packages, med.template))
    throw new Error('包裝模板無效。');
}

export function upsert(
  catalog: Medicine[],
  input: MedicineInput,
  id = crypto.randomUUID() as string,
) {
  validateMedicine(input);
  if (catalog.some((m) => m.id !== id && identity(m) === identity(input)))
    throw new Error('已有相同學名、劑量及劑型的藥品。');
  const item = { ...input, id };
  return catalog.some((m) => m.id === id)
    ? catalog.map((m) => (m.id === id ? item : m))
    : [...catalog, item];
}

export function previewSupply<T extends MedicineInput>(
  catalog: Medicine[],
  batch: T[],
) {
  const seen = new Set(catalog.map(identity));
  const fresh: T[] = [];
  const duplicates: T[] = [];
  for (const input of batch) {
    validateMedicine(input);
    const key = identity(input);
    (seen.has(key) ? duplicates : fresh).push(input);
    seen.add(key);
  }
  return { fresh, duplicates };
}

export function searchCatalog(catalog: Medicine[], query: string) {
  const key = query.trim().toLowerCase();
  return catalog.filter(
    (m) =>
      m.genericName.toLowerCase().includes(key) ||
      m.brand?.toLowerCase().includes(key),
  );
}

export const positions = [
  { id: 'OTC-01', zone: 'OTC', x: 2.7, z: 3.0, degrees: 180 },
  { id: 'OTC-02', zone: 'OTC', x: 4.5, z: 3.0, degrees: 180 },
  { id: 'OTC-03', zone: 'OTC', x: 6.3, z: 3.0, degrees: 180 },
  { id: 'OTC-04', zone: 'OTC', x: 0.65, z: 1.75, degrees: 90 },
  { id: 'OTC-05', zone: 'OTC', x: 8.35, z: 1.75, degrees: -90 },
  { id: 'RX-01', zone: 'RX', x: 3.2, z: 6.55, degrees: 180 },
  { id: 'RX-02', zone: 'RX', x: 5.6, z: 6.55, degrees: 180 },
] as const;
export type Position = (typeof positions)[number];
export type RackId = Position['id'];

export const slots = [2, 3, 3, 2].flatMap((cols, row) =>
  Array.from({ length: cols }, (_, col) => ({
    x: -0.6 + ((col + 0.5) * 1.2) / cols,
    y: 1.46 - row * 0.43,
    width: 1.2 / cols,
  })),
);

export interface Rack {
  id: RackId;
  name: string;
  items: Record<number, string>;
}
export interface Game {
  catalog: Medicine[];
  racks: Rack[];
}
export const emptyRack = (id: RackId): Rack => ({ id, name: '', items: {} });
export const initialGame = (): Game => ({
  catalog: [],
  racks: [emptyRack('OTC-01'), emptyRack('OTC-02')],
});

export function addRack(game: Game, id: RackId): Game {
  if (
    !positions.some((position) => position.id === id) ||
    game.racks.some((rack) => rack.id === id)
  )
    return game;
  return { ...game, racks: [...game.racks, emptyRack(id)] };
}
export function removeRack(game: Game, id: RackId): Game {
  return game.racks.length <= 1
    ? game
    : { ...game, racks: game.racks.filter((rack) => rack.id !== id) };
}
export function nameRack(game: Game, id: RackId, name: string): Game {
  const chars =
    typeof Intl.Segmenter === 'function'
      ? Array.from(
          new Intl.Segmenter('zh-Hant').segment(name),
          (part) => part.segment,
        )
      : Array.from(name.normalize('NFC'));
  if (chars.length > 20) throw new Error('藥架名稱最多 20 個字元。');
  return {
    ...game,
    racks: game.racks.map((rack) =>
      rack.id === id ? { ...rack, name } : rack,
    ),
  };
}
export function place(
  game: Game,
  id: RackId,
  slot: number,
  medicine?: string,
): Game {
  if (
    !Number.isInteger(slot) ||
    slot < 0 ||
    slot >= slots.length ||
    (medicine !== undefined && !game.catalog.some((m) => m.id === medicine))
  )
    return game;
  return {
    ...game,
    racks: game.racks.map((rack) => {
      if (rack.id !== id) return rack;
      const items = { ...rack.items };
      if (medicine === undefined) delete items[slot];
      else items[slot] = medicine;
      return { ...rack, items };
    }),
  };
}
export function removeMedicine(game: Game, id: string): Game {
  return {
    catalog: game.catalog.filter((m) => m.id !== id),
    racks: game.racks.map((rack) => ({
      ...rack,
      items: Object.fromEntries(
        Object.entries(rack.items).filter(([, medicine]) => medicine !== id),
      ),
    })),
  };
}
export function placementNotice(
  classification: Zone | null | undefined,
  zone: Zone,
) {
  if (!classification) return { text: '這項藥品尚未分類。', ms: 3000 };
  if (classification === 'RX' && zone === 'OTC')
    return { text: '此處方藥放在 OTC 區，請留意分類。', ms: 5000 };
}

export function snapshot(game: Game): Game {
  const ids = new Set(game.racks.flatMap((rack) => Object.values(rack.items)));
  return {
    racks: game.racks,
    catalog: game.catalog
      .filter((m) => ids.has(m.id))
      .map((m) => ({
        id: m.id,
        genericName: m.genericName,
        strength: m.strength,
        dosageFormId: m.dosageFormId,
        brand: m.brand,
        template: templateFor(m),
        image: m.image,
        crop: m.crop,
      })),
  };
}
