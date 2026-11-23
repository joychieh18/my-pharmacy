# My Pharmacy v24
Interactive 3D pharmacy education game.

短暫體驗的繁體中文 3D 藥學教育遊戲。遊戲只在記憶體保存個人進度，教材草稿則保存在管理端瀏覽器的 IndexedDB。

學生上架一次即可自動填滿同品項的橫列及縱深。新版使用固定 1.5 倍包裝、彩色通用標籤、全正面及曲面貼圖，獨立藥架支援縮放及平移。

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

1. 在管理端驗證並匯出 ZIP 後，先解壓縮。確認有 `public/teaching/index.json`、新的 `versions/*.json`，有圖片時另有 `images/*`。
2. 將檔案合併到從最新 `main` 建立的 Git 分支，維持這些相對路徑。新版本與圖片放進各自資料夾；比對索引，確認保留原有代碼和版本對應。若匯出後 `main` 又收錄其他教材，取得最新索引並重新匯出，或合併索引時只增加本次代碼。
3. 以 GitHub Pull Request 檢查差異及驗證結果。合併後等 Pages 的部署工作成功。
4. 開啟學生遊戲的「我要管理藥品 → 從已知的代碼進貨」，輸入該六位代碼，點「預覽進貨」核對後再確認。ZIP 供維護者發布，學生只需輸入代碼。

已發布的版本、圖片及代碼對應維持不可變；停用或重新啟用只提交索引狀態。教材與代碼均屬公開資料。

- [v24 第一階段 UI／UX](docs/REQUIREMENTS_V24.md)
- [v23 正式需求](docs/REQUIREMENTS_V23.md)
- [v22 正式需求](docs/REQUIREMENTS_V22.md)
- [v22 補充指令](docs/REQUIREMENTS_V22_SUPPLEMENT.md)
- [架構與場景參數](docs/ARCHITECTURE.md)
- [實作決策與陳列數量](docs/DECISIONS.md)
- [測試結果](docs/TEST_REPORT.md)
