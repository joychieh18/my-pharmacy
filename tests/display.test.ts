import { expect, it } from 'vitest';
import { displayFor, labelSize, packageGap } from '../src/display';
import {
  packages,
  paletteFor,
  slots,
  validateMedicine,
  type Package,
} from '../src/model';
import { validatePack } from '../src/teaching';

it('以模型邊界驗證所有槽位的陳列、淨空、固定間距及容量', () => {
  const templates: Package[] = ['box', 'bottle', 'pouch'];
  for (const zone of ['OTC', 'RX'] as const) {
    for (const slot of slots) {
      for (const template of templates) {
        const pkg = packages[template];
        const { offsets, left, right, top, front, back, columns, rows } =
          displayFor(slot, zone, template);
        expect(offsets.length).toBeGreaterThan(1);
        expect(offsets.length).toBe(columns * rows);
        for (const [x, y, z] of offsets) {
          expect(x + slot.x - pkg.width / 2).toBeGreaterThanOrEqual(
            left - 1e-9,
          );
          expect(x + slot.x + pkg.width / 2).toBeLessThanOrEqual(right + 1e-9);
          expect(z + pkg.depth / 2).toBeLessThanOrEqual(front + 1e-9);
          expect(z - pkg.depth / 2).toBeGreaterThanOrEqual(back - 1e-9);
          expect(slot.y + y + pkg.height / 2).toBeLessThan(top);
          expect(y).toBe(pkg.height / 2);
        }
        expect(offsets[0][2] + pkg.depth / 2).toBeCloseTo(front);
        for (const [i, [x, , z]] of offsets.entries()) {
          for (const [otherX, , otherZ] of offsets.slice(i + 1)) {
            expect(
              Math.abs(otherX - x) >= pkg.width + packageGap - 1e-9 ||
                Math.abs(otherZ - z) >= pkg.depth + packageGap - 1e-9,
            ).toBe(true);
          }
        }
      }
    }
  }
});
it('保留舊格式並驗證新版色票，不改變自動配色的重複鍵', () => {
  const med = {
    genericName: 'Sample A',
    strength: '0.5 mg/mL',
    dosageFormId: 'tablet',
  };
  const pack = {
    schemaVersion: 1,
    title: 'Example',
    version: 'v1',
    medicines: [med],
  };
  expect(validatePack(pack, 'versions/v1.json')).toEqual(pack);
  expect(paletteFor(med)).toBe(
    paletteFor({ ...med, genericName: ' Sample a ', strength: '0.5mg/ML' }),
  );
  expect(paletteFor({ ...med, palette: 'navy' })).toBe('navy');
  expect(() => validateMedicine({ ...med, palette: 'url(foo)' })).toThrow();
  expect(() =>
    validatePack(
      { ...pack, medicines: [{ ...med, palette: 'navy' }] },
      'versions/v1.json',
    ),
  ).not.toThrow();
  expect(labelSize('box')).toEqual({
    width: packages.box.width,
    height: packages.box.height,
  });
  expect(labelSize('bottle').width).toBeCloseTo((Math.PI * 0.12) / 3);
});
