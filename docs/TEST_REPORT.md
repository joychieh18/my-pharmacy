# v22 驗收紀錄

## 已通過

環境為 Node.js 24.22.1、npm 11.9.0、Chromium 156.0.8078.79。瀏覽器以 SwiftShader 渲染，使用 production build 及 /my-pharmacy/ 路徑。

| 指令 | 結果 |
|---|---|
| `npm test` | 12 項通過。含共用模型規則、27 劑型與包裝映射、70 格容量、級聯刪除、分類、快照及 Git 歷史保護。 |
| `npm run check:teaching -- <基準提交SHA>` | 通過。正式索引目前空白。獨立測試驗證有效圖片、無效圖片、停用及重新啟用、拒絕覆寫歷史版本。 |
| `npm run build` | TypeScript 及 Vite production build 通過。輸出遊戲、管理端、靜態教材與可內嵌檢視器。Vite 提示共用 3D JS 約 1.18 MB、gzip 約 327 kB。 |
| `PHARMACY_CHROMIUM=/usr/bin/chromium PHARMACY_INLINE_OFFLINE=1 npm run e2e` | 5 項通過。涵蓋首頁、個人藥品、七架、3D 格位射線點選、重置前確認與取消、觸控模擬查看離線成果、草稿重載、ZIP、匯入與停用、圖片限制與裁切、延遲請求、手冊搜尋／核取／複製備援。 |

測試用教材經 Playwright 攔截靜態資源請求，正式索引保持空白。遊戲與管理流程檢查瀏覽器執行時錯誤。中文有意包含特殊字元以驗證安全序列化。

## 環境限制及尚未執行

- 管理環境的 Chromium 曾以 ERR_BLOCKED_BY_ADMINISTRATOR 拒絕 `file://`。最終以離線的新瀏覽器 context 直接載入下載 HTML 及手冊的完整內容，通過渲染、點選與手冊互動。CI 預設從本機檔案 URL 開啟，遠端 CI 執行待驗證。
- 真實 Safari、Firefox、手機和平板仍待驗證。觸控是 Chromium 模擬。尚未量測 70 包裝滿載的實體裝置效能。
- GitHub Pages 正式部署、遠端教材發布、跨裝置正式代碼驗證待執行。測試不代表遠端已上線。

## 實際畫面

- [首頁](screenshots/01-home.png)
- [個人藥品清單](screenshots/02-catalog.png)
- [初始藥局總覽](screenshots/03-pharmacy.png)
- [七座藥架](screenshots/04-seven-racks.png)
- [單座藥架](screenshots/05-shelf.png)
- [行動視窗離線成果](screenshots/06-offline-share.png)
- [教材管理端](screenshots/07-admin.png)
