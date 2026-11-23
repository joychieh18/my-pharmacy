import { useId, useRef, type ReactNode } from 'react';

export function GameHelp({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const headingId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const startedOnBackdrop = useRef(false);

  return (
    <>
      <button
        type="button"
        className="help-icon"
        aria-label="遊戲說明"
        aria-haspopup="dialog"
        ref={trigger}
        onClick={() => {
          startedOnBackdrop.current = false;
          dialog.current?.showModal();
          closeButton.current?.focus({ preventScroll: true });
        }}
      >
        <span aria-hidden="true">?</span>
      </button>
      <dialog
        className="game-help"
        ref={dialog}
        aria-labelledby={headingId}
        onClose={() => trigger.current?.focus({ preventScroll: true })}
        onPointerDown={(event) => {
          startedOnBackdrop.current = event.target === event.currentTarget;
        }}
        onClick={(event) => {
          if (startedOnBackdrop.current && event.target === event.currentTarget)
            event.currentTarget.close();
          startedOnBackdrop.current = false;
        }}
      >
        <div className="game-help-content">
          <div className="game-help-heading">
            <h2 id={headingId}>{title}</h2>
            <button
              type="button"
              className="help-icon"
              aria-label="關閉說明"
              ref={closeButton}
              onClick={() => dialog.current?.close()}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="game-help-body">{children}</div>
        </div>
      </dialog>
    </>
  );
}

export function PharmacyHelp({
  hasMedicines,
  shelf,
}: {
  hasMedicines: boolean;
  shelf: boolean;
}) {
  return (
    <GameHelp title="3D 藥局操作說明">
      {!hasMedicines && (
        <p className="game-help-note">
          還沒有藥品。請先回首頁，到「我要管理藥品」進貨。
        </p>
      )}
      <ol>
        <li>
          <strong>選擇藥架</strong>　從總覽點選藥架，進入獨立藥架。
        </li>
        <li>
          <strong>選擇藥品</strong>　在藥品清單搜尋並選取品項。
        </li>
        <li>
          <strong>上架藥品</strong>　點擊 3D 藥架的空格完成上架。
        </li>
        <li>
          <strong>查看與替換</strong>
          　點擊已上架的藥品，即可查看資訊、替換或丟棄。
        </li>
        <li>
          <strong>調整視角</strong>　拖曳旋轉，滾輪或雙指縮放。
          {shelf
            ? '右鍵拖曳或雙指同向滑動可平移。'
            : '進入獨立藥架後，可用右鍵拖曳或雙指同向滑動平移。'}
        </li>
        <li>
          <strong>下載成果</strong>　返回總覽後，點選「下載 HTML 成果」。
        </li>
      </ol>
    </GameHelp>
  );
}
