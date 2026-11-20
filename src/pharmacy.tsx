import { useEffect, useState } from 'react';
import { MedicineList, errorText } from './forms';
import { Scene } from './scene';
import {
  addRack,
  formLabel,
  nameRack,
  place,
  placementNotice,
  positions,
  removeRack,
  slots,
  type Game,
  type Medicine,
  type RackId,
} from './model';

interface Editing {
  setGame: (game: Game) => void;
  onRestart: () => void;
  onShare: () => Promise<void>;
}

export function Pharmacy({ game, editing }: { game: Game; editing?: Editing }) {
  const [rackId, setRack] = useState<RackId>();
  const [overviewSelection, setOverviewSelection] = useState<RackId>();
  const [medicineId, setMedicine] = useState<string>();
  const [slot, setSlot] = useState<number>();
  const [replace, setReplace] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ms: number }>();
  const [reset, setReset] = useState(0);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const rack = game.racks.find((r) => r.id === rackId);
  const selectedRack = game.racks.find((r) => r.id === overviewSelection);
  const selected = game.catalog.find(
    (m) => slot !== undefined && rack?.items[slot] === m.id,
  );
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(undefined), notice.ms);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function openRack(id?: RackId) {
    setRack(id);
    setSlot(undefined);
    setMedicine(undefined);
    setReplace(false);
    setError('');
  }
  function add(id: RackId) {
    editing?.setGame(addRack(game, id));
    setOverviewSelection(id);
  }
  function put(i: number, med: Medicine) {
    if (!rack || !editing) return;
    editing.setGame(place(game, rack.id, i, med.id));
    setNotice(
      placementNotice(
        med.classification,
        positions.find((p) => p.id === rack.id)!.zone,
      ),
    );
    setMedicine(undefined);
    setSlot(undefined);
    setReplace(false);
  }
  function chooseSlot(i: number) {
    const med = game.catalog.find((m) => m.id === medicineId);
    if (!rack?.items[i] && med) put(i, med);
    else {
      setSlot(i);
      setReplace(false);
    }
  }

  return (
    <section>
      <div className="section-title">
        <div>
          <p className="eyebrow">3D PHARMACY</p>
          <h1>
            {rack
              ? `${rack.id}${rack.name ? ` · ${rack.name}` : ''}`
              : '我的 3D 藥局'}
          </h1>
        </div>
        <div className="actions">
          {rack && <button onClick={() => openRack()}>返回總覽</button>}
          <button onClick={() => setReset((n) => n + 1)}>恢復預設視角</button>
        </div>
      </div>
      <div className={rack ? 'shelf-layout' : undefined}>
        <div>
          {rack && (
            <p className="camera-help">
              拖曳旋轉，滾輪或雙指縮放。按右鍵拖曳或兩指同向滑動可平移。
            </p>
          )}
          <Scene
            game={game}
            rack={rack}
            reset={reset}
            onRack={(id) => {
              setOverviewSelection(id);
              openRack(id);
            }}
            onAdd={editing ? add : undefined}
            onSlot={chooseSlot}
            highlight={Boolean(medicineId && editing)}
          />
          {rack && (
            <div className="slot-list" aria-label="格位清單">
              {slots.map((_, i) => (
                <button
                  className={slot === i ? 'selected' : ''}
                  key={i}
                  onClick={() => chooseSlot(i)}
                >
                  {i + 1} ·{' '}
                  {game.catalog.find((m) => m.id === rack.items[i])
                    ?.genericName ?? '空'}
                </button>
              ))}
            </div>
          )}
        </div>
        {rack && (
          <aside className="panel">
            {editing && (
              <form
                key={rack.id}
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    editing.setGame(
                      nameRack(
                        game,
                        rack.id,
                        String(new FormData(e.currentTarget).get('name')),
                      ),
                    );
                    setError('');
                  } catch (err) {
                    setError(errorText(err));
                  }
                }}
              >
                <label>
                  藥架名稱
                  <input name="name" defaultValue={rack.name} />
                </label>
                <button>儲存名稱</button>
              </form>
            )}
            {selected && (
              <section className="item-details" aria-label="上架藥品資訊">
                <h2>{selected.genericName}</h2>
                {selected.brand && <p>{selected.brand}</p>}
                <p>
                  {selected.strength} · {formLabel(selected.dosageFormId)}
                </p>
                <div className="actions">
                  <button
                    onClick={() => {
                      setSlot(undefined);
                      setReplace(false);
                    }}
                  >
                    關閉資訊
                  </button>
                  {editing && (
                    <>
                      <button
                        onClick={() => {
                          setReplace(true);
                          setMedicine(undefined);
                        }}
                      >
                        替換
                      </button>
                      <button
                        onClick={() => {
                          editing.setGame(place(game, rack.id, slot!));
                          setSlot(undefined);
                          setReplace(false);
                        }}
                      >
                        丟棄
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}
            {editing && (
              <>
                <h2>{replace ? '選擇替換藥品' : '選擇上架藥品'}</h2>
                <p>
                  {medicineId
                    ? '請點選空格放置藥品。'
                    : '選擇藥品後，點選空格。'}
                </p>
                {medicineId && (
                  <button onClick={() => setMedicine(undefined)}>
                    取消選藥
                  </button>
                )}
                <MedicineList catalog={game.catalog}>
                  {(med) => (
                    <button
                      className={medicineId === med.id ? 'selected' : ''}
                      onClick={() => {
                        if (replace && slot !== undefined) put(slot, med);
                        else {
                          setMedicine(med.id);
                          setSlot(undefined);
                        }
                      }}
                    >
                      {replace ? '換成此藥品' : '選擇'}
                    </button>
                  )}
                </MedicineList>
              </>
            )}
          </aside>
        )}
      </div>
      {!rack && (
        <>
          <div className="position-list">
            {positions
              .filter((p) => editing || game.racks.some((r) => r.id === p.id))
              .map((p) => {
                const current = game.racks.find((r) => r.id === p.id);
                return (
                  <button
                    key={p.id}
                    className={overviewSelection === p.id ? 'selected' : ''}
                    onClick={() => {
                      if (!current) add(p.id);
                      else if (editing) setOverviewSelection(p.id);
                      else openRack(p.id);
                    }}
                  >
                    {current
                      ? p.id + (current.name ? ` · ${current.name}` : '')
                      : `＋ ${p.id}`}
                  </button>
                );
              })}
          </div>
          {selectedRack && (
            <div className="actions">
              <button
                className="primary"
                onClick={() => openRack(selectedRack.id)}
              >
                開啟 {selectedRack.id} 藥架
              </button>
              {editing && (
                <button
                  disabled={game.racks.length <= 1}
                  title={
                    game.racks.length <= 1 ? '至少須保留一座藥架' : undefined
                  }
                  onClick={() => {
                    if (
                      confirm(
                        `刪除 ${selectedRack.id}？將移除 ${Object.keys(selectedRack.items).length} 個已上架格位，藥品目錄會保留。`,
                      )
                    ) {
                      editing.setGame(removeRack(game, selectedRack.id));
                      setOverviewSelection(undefined);
                    }
                  }}
                >
                  刪除藥架
                </button>
              )}
            </div>
          )}
          {editing && (
            <div className="actions footer-actions">
              <button
                disabled={sharing}
                onClick={async () => {
                  setSharing(true);
                  setError('');
                  try {
                    await editing.onShare();
                  } catch (err) {
                    setError(errorText(err));
                  } finally {
                    setSharing(false);
                  }
                }}
              >
                {sharing ? '正在準備成果…' : '下載 HTML 成果'}
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      '重新開始遊戲？本次個人藥品、藥架名稱及擺放將清除。',
                    )
                  ) {
                    setOverviewSelection(undefined);
                    setNotice(undefined);
                    setError('');
                    setReset((n) => n + 1);
                    editing.onRestart();
                  }
                }}
              >
                重新開始遊戲
              </button>
            </div>
          )}
        </>
      )}
      {notice && (
        <p className="toast" role="status">
          {notice.text}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
