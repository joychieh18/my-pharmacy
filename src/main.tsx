import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MedicineForm, MedicineList, errorText } from './forms';
import {
  initialGame,
  formLabel,
  previewSupply,
  removeMedicine,
  upsert,
  type Medicine,
} from './model';
import { loadPack, type TeachingPack } from './teaching';
import { GameHelp } from './game-help';
import { Pharmacy } from './pharmacy';
import { exportShare } from './share';
import './style.css';

type Page = 'home' | 'management' | 'add' | 'catalog' | 'code' | 'scene';
const titles = {
  home: '',
  management: '管理藥品',
  add: '自行進貨',
  catalog: '管理藥品清單',
  code: '從已知的代碼進貨',
  scene: '',
};

function App() {
  const [page, setPage] = useState<Page>('home');
  const [game, setGame] = useState(initialGame);
  const [edit, setEdit] = useState<Medicine>();
  const [pack, setPack] = useState<TeachingPack>();
  const [result, setResult] = useState<ReturnType<typeof previewSupply>>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);

  function cancelRequest() {
    pending.current?.abort();
    pending.current = null;
    setBusy(false);
    setPack(undefined);
  }
  function navigate(destination: Page) {
    cancelRequest();
    setError('');
    setResult(undefined);
    setEdit(undefined);
    setPage(destination);
  }
  const batch = pack ? previewSupply(game.catalog, pack.medicines) : undefined;

  return (
    <>
      <header
        className={page === 'home' ? 'site-header home-header' : 'site-header'}
      >
        {page === 'home' ? (
          <span className="brand">
            <b>+</b> 我的藥局 <small>My Pharmacy</small>
          </span>
        ) : (
          <button className="home-back" onClick={() => navigate('home')}>
            <span aria-hidden="true">←</span> 返回首頁
          </button>
        )}
        {page === 'home' ? (
          <div className="actions home-toolbar">
            <button
              type="button"
              onClick={() => {
                if (
                  !confirm('重新開始遊戲？本次個人藥品、藥架名稱及擺放將清除。')
                )
                  return;
                navigate('home');
                setGame(initialGame());
              }}
            >
              重新開始遊戲
            </button>
            <GameHelp title="遊戲說明">
              <ol>
                <li>從「我要管理藥品」新增藥品，或輸入教師提供的代碼進貨。</li>
                <li>進入我的藥局，點選藥架與藥品，再點空格上架。</li>
                <li>點已上架的藥品查看資訊、替換或丟棄。</li>
                <li>在 3D 總覽點「下載 HTML 成果」保存唯讀展示。</li>
              </ol>
              <p className="game-help-note">
                重新整理網頁後，本次遊戲進度會消失。
              </p>
            </GameHelp>
          </div>
        ) : (
          <span>藥學互動教學</span>
        )}
      </header>
      <main className={page === 'home' ? 'landing' : undefined}>
        {page === 'home' ? (
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">
                <i></i> 互動式 3D 藥學教室
              </p>
              <h1>
                我的藥局<span>My Pharmacy</span>
              </h1>
              <p className="intro">
                從進貨到上架，打造你的社區藥局。
                <br />在 3D 空間中練習整理、辨識與陳列藥品。
              </p>
              <div className="home-start-guide">
                <strong>先進貨，再開始上架吧！</strong>
                <p>先到『管理藥品』新增或匯入藥品，再進入藥局開始擺放。</p>
              </div>
              <div className="actions home-actions">
                <button onClick={() => navigate('management')}>
                  我要管理藥品
                </button>
                <button className="primary" onClick={() => navigate('scene')}>
                  進入我的藥局 <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
            <figure className="cover">
              <img
                src={`${import.meta.env.BASE_URL}images/pharmacy-cover.webp`}
                alt="白色與醫療綠相間的原創 3D 社區藥局"
              />
            </figure>
          </section>
        ) : (
          <>
            {page !== 'scene' && (
              <button
                className="back"
                onClick={() =>
                  navigate(page === 'management' ? 'home' : 'management')
                }
              >
                ← 返回{page === 'management' ? '首頁' : '管理藥品'}
              </button>
            )}
            {titles[page] && <h1>{edit ? '編輯藥品' : titles[page]}</h1>}
            {page === 'management' && (
              <div className="menu">
                <button onClick={() => navigate('code')}>
                  從已知的代碼進貨 <span>讀取教師發布的主題教材</span>
                </button>
                <button onClick={() => navigate('add')}>
                  我要進貨 <span>逐一新增個人藥品</span>
                </button>
                <button onClick={() => navigate('catalog')}>
                  管理藥品清單 <span>目前有 {game.catalog.length} 種藥品</span>
                </button>
              </div>
            )}
            {page === 'add' && (
              <MedicineForm
                key={edit?.id ?? 'new'}
                item={edit}
                onCancel={() => navigate(edit ? 'catalog' : 'management')}
                onSave={(input) => {
                  const catalog = upsert(game.catalog, input, edit?.id);
                  setGame({ ...game, catalog });
                  navigate('catalog');
                }}
              />
            )}
            {page === 'catalog' && (
              <MedicineList catalog={game.catalog}>
                {(med) => (
                  <div className="actions">
                    <button
                      onClick={() => {
                        navigate('add');
                        setEdit(med);
                      }}
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => {
                        const references = game.racks.flatMap((r) =>
                          Object.entries(r.items)
                            .filter(([, id]) => id === med.id)
                            .map(([i]) => `${r.id} 第 ${Number(i) + 1} 格`),
                        );
                        if (
                          confirm(
                            `刪除 ${med.genericName}？將清空 ${references.length} 個格位${references.length ? '：' + references.join('、') : ''}。`,
                          )
                        )
                          setGame(removeMedicine(game, med.id));
                      }}
                    >
                      刪除
                    </button>
                  </div>
                )}
              </MedicineList>
            )}
            {page === 'code' && (
              <div className="panel">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const code = String(
                      new FormData(e.currentTarget).get('code'),
                    );
                    cancelRequest();
                    setError('');
                    setResult(undefined);
                    const controller = new AbortController();
                    pending.current = controller;
                    setBusy(true);
                    try {
                      const next = await loadPack(code, controller.signal);
                      if (pending.current === controller) setPack(next);
                    } catch (err) {
                      if (pending.current === controller)
                        setError(errorText(err));
                    } finally {
                      if (pending.current === controller) {
                        pending.current = null;
                        setBusy(false);
                      }
                    }
                  }}
                >
                  <label>
                    教材代碼
                    <input
                      name="code"
                      required
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </label>
                  <button className="primary" disabled={busy}>
                    {busy ? '正在讀取…' : '預覽進貨'}
                  </button>
                </form>
                {batch && pack && (
                  <section>
                    <h2>{pack.title}</h2>
                    <BatchList batch={batch} />
                    <div className="actions">
                      <button
                        className="primary"
                        onClick={() => {
                          try {
                            const next = previewSupply(
                              game.catalog,
                              pack.medicines,
                            );
                            setGame({
                              ...game,
                              catalog: next.fresh.reduce(
                                (catalog, input) => upsert(catalog, input),
                                game.catalog,
                              ),
                            });
                            setPack(undefined);
                            setResult(next);
                          } catch (err) {
                            setError(errorText(err));
                          }
                        }}
                      >
                        確認進貨
                      </button>
                      <button onClick={() => setPack(undefined)}>取消</button>
                    </div>
                  </section>
                )}
                {result && (
                  <section role="status">
                    <h2>進貨完成</h2>
                    <BatchList batch={result} />
                  </section>
                )}
                {error && (
                  <p role="alert" className="error">
                    {error}
                  </p>
                )}
              </div>
            )}
            {page === 'scene' && (
              <Pharmacy
                game={game}
                editing={{
                  setGame,
                  onShare: () => exportShare(game),
                }}
              />
            )}
          </>
        )}
      </main>
      {page === 'home' && (
        <footer className="site-footer">
          <span>我的藥局 · 藥學教育</span>
          <span>遊戲進度僅保留於本次體驗</span>
        </footer>
      )}
    </>
  );
}
function BatchList({ batch }: { batch: ReturnType<typeof previewSupply> }) {
  return (
    <ul>
      {(['fresh', 'duplicates'] as const).map((key) => (
        <li key={key}>
          {key === 'fresh' ? '新增' : '重複品項，不可加入'} {batch[key].length}{' '}
          項
          {batch[key].length > 0 && (
            <ul>
              {batch[key].map((m, i) => (
                <li key={i}>
                  {m.genericName} · {m.strength} · {formLabel(m.dosageFormId)}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
