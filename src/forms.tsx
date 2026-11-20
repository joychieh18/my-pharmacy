import { useRef, useState } from 'react';
import { defaultCrop, legacyCrop, imageFromBlob } from './images';
import {
  forms,
  packages,
  palettes,
  paletteFor,
  searchCatalog,
  templateFor,
  type Medicine,
  type MedicineInput,
} from './model';
import { CropEditor } from './crop-editor';
import { PackagePreview } from './scene';

export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
export function MedicineForm({
  item,
  onSave,
  onCancel,
}: {
  item?: Medicine;
  onSave: (input: MedicineInput) => void;
  onCancel: () => void;
}) {
  const [value, update] = useState<MedicineInput>(
    () =>
      item ?? {
        genericName: '',
        dosageFormId: '',
        strength: '',
        classification: null,
      },
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const request = useRef(0);
  const set = <K extends keyof MedicineInput>(key: K, next: MedicineInput[K]) =>
    update((v) => ({ ...v, [key]: next }));
  const crop = value.crop ?? legacyCrop;
  return (
    <form
      className="medicine-form"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          onSave(value);
        } catch (err) {
          setError(errorText(err));
        }
      }}
    >
      <div className="fields">
        <label>
          英文學名 <span aria-hidden="true">*</span>
          <input
            required
            value={value.genericName}
            onChange={(e) => set('genericName', e.target.value)}
          />
        </label>
        <label>
          劑量 <span aria-hidden="true">*</span>
          <input
            required
            value={value.strength}
            onChange={(e) => set('strength', e.target.value)}
            placeholder="例如 500 mg"
          />
        </label>
        <label>
          劑型 <span aria-hidden="true">*</span>
          <select
            required
            value={value.dosageFormId}
            onChange={(e) => set('dosageFormId', e.target.value)}
          >
            <option value="">選擇劑型</option>
            {forms.map(([id, zh, en]) => (
              <option key={id} value={id}>
                {zh} / {en}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ['brand', '商品名'],
            ['category', '藥理分類'],
            ['indication', '適應症'],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              value={value[key] ?? ''}
              onChange={(e) => set(key, e.target.value)}
            />
          </label>
        ))}
        <label>
          OTC／RX 分類
          <select
            value={value.classification ?? ''}
            onChange={(e) =>
              set(
                'classification',
                (e.target.value || null) as MedicineInput['classification'],
              )
            }
          >
            <option value="">未分類</option>
            <option>OTC</option>
            <option>RX</option>
          </select>
        </label>
        <label>
          3D 包裝模板
          <select
            value={value.template ?? ''}
            onChange={(e) =>
              set(
                'template',
                (e.target.value || undefined) as MedicineInput['template'],
              )
            }
          >
            <option value="">
              依劑型選擇（
              {packages[templateFor({ ...value, template: undefined })].label}）
            </option>
            {Object.entries(packages).map(([id, pkg]) => (
              <option key={id} value={id}>
                {pkg.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="palette">
          <legend>包裝配色</legend>
          <div className="palette-options">
            <button
              type="button"
              aria-pressed={!value.palette}
              onClick={() => set('palette', undefined)}
            >
              <i
                style={{
                  background:
                    palettes[paletteFor({ ...value, palette: undefined })][1],
                }}
              />
              自動配色
            </button>
            {(Object.keys(palettes) as (keyof typeof palettes)[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={value.palette === key}
                onClick={() => set('palette', key)}
              >
                <i style={{ background: palettes[key][1] }} />
                {palettes[key][0]}
              </button>
            ))}
          </div>
          {value.image && (
            <small>有上傳圖片時，移除圖片後才會顯示此配色。</small>
          )}
        </fieldset>
        <label>
          正面包裝圖片
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const ticket = ++request.current;
              setLoading(true);
              setError('');
              try {
                const image = await imageFromBlob(file);
                if (ticket === request.current)
                  update((v) => ({ ...v, image, crop: defaultCrop }));
              } catch (err) {
                if (ticket === request.current) setError(errorText(err));
              } finally {
                if (ticket === request.current) setLoading(false);
              }
            }}
          />
        </label>
        {value.image && (
          <>
            <label>
              圖片顯示
              <select
                value={crop.mode}
                onChange={(e) =>
                  set('crop', {
                    ...crop,
                    mode: e.target.value as typeof crop.mode,
                  })
                }
              >
                <option value="contain">完整顯示</option>
                <option value="fill">填滿裁切</option>
              </select>
            </label>
            {crop.mode === 'fill' &&
              (
                [
                  ['x', '水平位置', 0, 1],
                  ['y', '垂直位置', 0, 1],
                  ['zoom', '裁切放大', 1, 3],
                ] as const
              ).map(([key, label, min, max]) => (
                <label key={key}>
                  {label}
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step=".01"
                    value={crop[key]}
                    onChange={(e) =>
                      set('crop', { ...crop, [key]: Number(e.target.value) })
                    }
                  />
                </label>
              ))}
            <button
              type="button"
              onClick={() => set('crop', { ...defaultCrop, mode: crop.mode })}
            >
              重置裁切
            </button>
            <button
              type="button"
              onClick={() => {
                request.current++;
                setLoading(false);
                update((v) => ({ ...v, image: undefined, crop: undefined }));
              }}
            >
              移除圖片
            </button>
          </>
        )}
      </div>
      <div>
        {value.image && (
          <CropEditor
            src={value.image}
            crop={crop}
            template={templateFor(value)}
            onChange={(next) => set('crop', next)}
          />
        )}
        <h3>3D 包裝預覽</h3>
        <PackagePreview medicine={value} />
        <small>
          圖片上限 5 MB，處理後最長邊 2048 px。模型尺寸依包裝模板固定。
        </small>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button className="primary" disabled={loading}>
          {item ? '儲存修改' : '新增藥品'}
        </button>
        <button type="button" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}

export function MedicineList({
  catalog,
  children,
}: {
  catalog: Medicine[];
  children: (med: Medicine) => React.ReactNode;
}) {
  const [query, setQuery] = useState('');
  const matches = searchCatalog(catalog, query);
  return (
    <>
      <label>
        搜尋學名或商品名
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
        />
      </label>
      {matches.length ? (
        <ul className="medicine-list">
          {matches.map((m) => (
            <li key={m.id}>
              <div>
                <strong>{m.genericName}</strong> <span>{m.strength}</span>
                {m.brand && <small>{m.brand}</small>}
              </div>
              <span className="pill">{m.classification ?? '未分類'}</span>
              {children(m)}
            </li>
          ))}
        </ul>
      ) : (
        <p>{catalog.length ? '找不到符合的藥品。' : '目錄目前沒有藥品。'}</p>
      )}
    </>
  );
}
