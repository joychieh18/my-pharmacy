# my-pharmacy
Interactive 3D pharmacy education game.

短暫體驗的繁體中文 3D 藥學教育遊戲。遊戲只在記憶體保存個人進度，教材草稿則保存在管理端瀏覽器的 IndexedDB。

## 本機使用

需要 Node.js 24、npm 及支援 WebGL 的瀏覽器。

```sh
npm ci
npm run dev
```

使用終端機顯示的埠。Vite 預設埠 5173，遊戲路徑為 `/my-pharmacy/`，管理端為 `/my-pharmacy/admin/`，新手手冊為 `/my-pharmacy/ADMIN_GUIDE.html`。亦可直接開啟 [新手手冊](public/ADMIN_GUIDE.html)。

## 檢查與部署

```sh
npm test
npm run check:teaching
npm run build
npx playwright install chromium
npm run e2e
```

CI 在 Pull Request 與 main 上驗證教材歷史、測試與建置。GitHub 的 Settings → Pages → Build and deployment → Source 選 GitHub Actions。合併後由 workflow 部署 `dist/`。部署目標為 `https://joychieh18.github.io/my-pharmacy/`，實際可用性以 GitHub 部署紀錄及遠端驗證為準。

## 教材發布

在管理端建立教材藥品和主題，輸入事先選定的代碼並匯出 ZIP。具權限的維護者將 ZIP 中的 `public/teaching/` 合併至最新儲存庫分支，檢查差異後提出 PR。已發布版本、圖片及代碼對應不可變更。停用或重新啟用由管理端匯出索引變更，並經相同發布程序生效。教材與代碼均屬公開資料。

- [正式需求](docs/REQUIREMENTS_V22.md)
- [執行指令原文](docs/REQUIREMENTS_V22_SUPPLEMENT.md)
- [架構與場景參數](docs/ARCHITECTURE.md)
- [實作決策](docs/DECISIONS.md)
- [測試結果](docs/TEST_REPORT.md)
