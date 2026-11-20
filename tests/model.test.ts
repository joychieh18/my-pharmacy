import { describe, expect, it } from 'vitest';
import {
  addRack,
  forms,
  initialGame,
  nameRack,
  packages,
  place,
  placementNotice,
  positions,
  previewSupply,
  removeMedicine,
  removeRack,
  searchCatalog,
  slots,
  snapshot,
  templateFor,
  upsert,
} from '../src/model';
import {
  checkHistory,
  normalizeCode,
  validateIndex,
  validatePack,
} from '../src/teaching';
import { safeJson } from '../src/download';

const tablet = {
  genericName: 'Sample A',
  dosageFormId: 'tablet',
  strength: '500 mg',
};
describe('個人藥品與固定模型', () => {
  it('初始空目錄及兩座空 OTC 架', () =>
    expect(initialGame()).toEqual({
      catalog: [],
      racks: [
        { id: 'OTC-01', name: '', items: {} },
        { id: 'OTC-02', name: '', items: {} },
      ],
    }));
  it('僅接受三項必填完整的資料', () => {
    for (const key of ['genericName', 'strength', 'dosageFormId'])
      expect(() => upsert([], { ...tablet, [key]: ' ' })).toThrow();
    expect(upsert([], tablet)).toHaveLength(1);
  });
  it('使用三欄正規化且不換算劑量', () => {
    const catalog = upsert([], tablet, 'x');
    expect(() =>
      upsert(catalog, {
        ...tablet,
        genericName: ' sample a ',
        strength: '500MG',
      }),
    ).toThrow();
    expect(upsert(catalog, { ...tablet, strength: '0.5 g' })).toHaveLength(2);
    expect(
      upsert(catalog, { ...tablet, genericName: 'Sample  A' }),
    ).toHaveLength(2);
    expect(
      upsert(catalog, { ...tablet, dosageFormId: 'capsule' }),
    ).toHaveLength(2);
    expect(upsert(catalog, { ...tablet, brand: 'Practice' }, 'x')[0].id).toBe(
      'x',
    );
    expect(
      searchCatalog(
        upsert(catalog, { ...tablet, brand: 'Practice' }, 'x'),
        'ACTI',
      ),
    ).toHaveLength(1);
  });
  it('核對所有固定劑型及映射順序與幾何尺寸', () => {
    const ordered =
      'tablet powder granules chewable-tablet orally-disintegrating-tablet extended-release-tablet enteric-coated-tablet oral-solution oral-suspension syrup oral-drops cream ointment gel lotion transdermal-patch topical-solution eye-drops eye-ointment ear-drops nasal-spray inhalation-aerosol inhalation-powder injection suppository vaginal-tablet capsule'.split(
        ' ',
      );
    expect(forms.map((row) => row[0])).toEqual(ordered);
    const mappings =
      'box pouch pouch box box box box bottle bottle bottle bottle box box box bottle box bottle bottle box bottle bottle box box box box box box'.split(
        ' ',
      );
    expect(
      ordered.map((dosageFormId) => templateFor({ ...tablet, dosageFormId })),
    ).toEqual(mappings);
    expect(templateFor({ ...tablet, template: 'pouch' })).toBe('pouch');
    expect(
      Object.values(packages).map((p) => [p.width, p.height, p.depth]),
    ).toEqual([
      [0.135, 0.225, 0.075],
      [0.12, 0.18, 0.12],
      [0.15, 0.21, 0.03],
    ]);
  });
  it('批次進貨保留首筆並拒絕無效整批', () => {
    const catalog = upsert([], tablet, 'x');
    const second = { ...tablet, strength: '750 mg' };
    expect(
      previewSupply(catalog, [tablet, second, { ...second, brand: 'Skipped' }]),
    ).toEqual({
      fresh: [second],
      duplicates: [tablet, { ...second, brand: 'Skipped' }],
    });
    expect(() =>
      previewSupply(catalog, [second, { ...tablet, strength: '' }]),
    ).toThrow();
    expect(catalog).toHaveLength(1);
  });
});
describe('藥架與分享', () => {
  const game = () => ({
    ...initialGame(),
    catalog: upsert([], tablet, 'test'),
  });
  it('七座固定位置和 70 格，禁止空間重複及無效引用', () => {
    const filled = positions.reduce(
      (g, p) =>
        slots.reduce((s, _, i) => place(s, p.id, i, 'test'), addRack(g, p.id)),
      game(),
    );
    expect(filled.racks).toHaveLength(7);
    expect(filled.racks.flatMap((r) => Object.keys(r.items))).toHaveLength(70);
    expect(
      slots.reduce<Record<string, number>>(
        (n, s) => ({ ...n, [s.y]: (n[s.y] ?? 0) + 1 }),
        {},
      ),
    ).toEqual({ '1.46': 2, '1.03': 3, '0.6': 3, '0.17': 2 });
    expect(place(filled, 'OTC-01', 10, 'test')).toEqual(filled);
    expect(place(filled, 'OTC-01', 0, 'missing')).toEqual(filled);
    expect(addRack(filled, 'OTC-01')).toEqual(filled);
  });
  it('最低一架、同名與 Unicode 名稱、級聯移除', () => {
    const filled = place(
      place(game(), 'OTC-01', 0, 'test'),
      'OTC-02',
      1,
      'test',
    );
    const named = nameRack(
      nameRack(filled, 'OTC-01', '藥架'),
      'OTC-02',
      '藥架',
    );
    expect(named.racks.map((r) => r.name)).toEqual(['藥架', '藥架']);
    expect(() => nameRack(filled, 'OTC-01', '👩‍🔬'.repeat(20))).not.toThrow();
    expect(() => nameRack(filled, 'OTC-01', '藥'.repeat(21))).toThrow();
    const one = removeRack(filled, 'OTC-02');
    expect(removeRack(one, 'OTC-01')).toEqual(one);
    expect(one.catalog).toHaveLength(1);
    expect(removeMedicine(filled, 'test')).toEqual(initialGame());
  });
  it('分類僅按規則提醒', () => {
    expect(placementNotice('RX', 'OTC')?.ms).toBe(5000);
    for (const zone of ['OTC', 'RX'] as const) {
      expect(placementNotice('OTC', zone)).toBeUndefined();
      expect(placementNotice(null, zone)?.ms).toBe(3000);
    }
    expect(placementNotice('RX', 'RX')).toBeUndefined();
  });
  it('只匯出上架資料且可安全嵌入 HTML', () => {
    const base = game();
    const g = place(
      {
        ...base,
        catalog: upsert(
          base.catalog,
          { ...tablet, genericName: 'Hidden' },
          'hidden',
        ),
      },
      'OTC-01',
      0,
      'test',
    );
    expect(snapshot(g).catalog.map((m) => m.id)).toEqual(['test']);
    expect(safeJson({ x: '</script>' })).not.toContain('</script>');
    expect(JSON.parse(safeJson({ x: '</script>' })).x).toBe('</script>');
  });
});
describe('教材規格', () => {
  it('先驗證 ASCII 再正規化，拒絕非法代碼', () => {
    expect(normalizeCode('ab2c34')).toBe('AB2C34');
    for (const code of [
      'ABOC34',
      'AB0C34',
      'ABIC34',
      'AB1C34',
      'ABCDEF',
      '234567',
      ' AB234',
      'ＡB2345',
      'ſB2345',
      'AB234\n',
    ])
      expect(() => normalizeCode(code)).toThrow();
  });
  it('拒絕路徑跳脫及版本改配，允許停用與重啟', () => {
    const active = validateIndex({
      schemaVersion: 1,
      codes: { AB2C34: { active: true, manifest: 'versions/sample.json' } },
    });
    const inactive = validateIndex({
      schemaVersion: 1,
      codes: { AB2C34: { active: false, manifest: 'versions/sample.json' } },
    });
    expect(() => checkHistory(active, inactive)).not.toThrow();
    expect(() => checkHistory(inactive, active)).not.toThrow();
    expect(() =>
      checkHistory(inactive, { schemaVersion: 1, codes: {} }),
    ).toThrow();
    expect(() =>
      validateIndex({
        schemaVersion: 1,
        codes: { AB2C34: { active: true, manifest: '../sample.json' } },
      }),
    ).toThrow();
    expect(() =>
      validatePack(
        {
          schemaVersion: 1,
          title: 'Sample',
          version: 'sample',
          medicines: [{ ...tablet, image: '//another/asset.png' }],
        },
        'versions/sample.json',
      ),
    ).toThrow();
  });
});
