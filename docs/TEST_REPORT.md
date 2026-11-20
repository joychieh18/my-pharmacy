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

# v23 驗收紀錄

基準為 GitHub `main` 的 `9330d92`。現有兩組啟用代碼和兩份正式版本通過驗證。教材檔案及部署 workflow 與基準比對無差異。未加入測試教材。

| 指令 | 結果 |
|---|---|
| `npm ci --cache /tmp/pharmacy-npm` | 成功安裝鎖定依賴。 |
| `npm test` | 14 項通過。涵蓋尺寸、兩種結構的所有格位淨空、邊界和間距、色票、舊版本與原 v22 資料規則。 |
| `npm run check:teaching -- "$(git rev-parse origin/main)"` | 通過，2 組代碼和 2 份既有版本。 |
| `npm run build` | TypeScript、網站及單檔檢視器建置通過。 |
| `PHARMACY_CHROMIUM=/usr/bin/chromium PHARMACY_INLINE_OFFLINE=1 npm run e2e` | 7 項通過。Chromium 回歸涵蓋上架、替換、丟棄、搜尋、裁切、草稿與發布包、下載重置後離線內容、手冊及六種 70 格滿載情境。 |

額外定向重跑的圖片整合測試也通過，涵蓋預設填滿、滑鼠及 Chromium 觸控拖曳、重置、模板切換、橫向／直向／方形／極端比例／低解析度、2048 px、接近 5 MB、超限及無法解碼。

直接開啟下載成品的測試收到受管 Chromium 的 `ERR_BLOCKED_BY_ADMINISTRATOR`。替代驗收從磁碟讀取下載 HTML 的實際內容，在新建立的離線瀏覽器環境渲染和操作。CI 保留一般 `file://` 路徑。Chrome 觸控模擬不等同實體裝置測試。尚待驗收的項目為實體手機、iPad、Safari／Firefox、實體 GPU 效能及 v23 GitHub Pages 部署；雲端 HTTP 存取正式教材端點回傳 403。

## v23 實際渲染

- [v22 單包裝藥架，既有可核實截圖](screenshots/05-shelf.png)
- [新版滿格多色藥架](screenshots/v23/v23-mixed.png) · [七架七十格總覽](screenshots/v23/v23-full-overview.png)
- [藥盒橫向與縱深](screenshots/v23/v23-boxes-angle.png) · [藥瓶整格](screenshots/v23/v23-same-across-racks-angle.png) · [藥袋整格](screenshots/v23/v23-pouches-angle.png)
- [全正面藥盒、裁切與 2D／3D 預覽及色票](screenshots/v23/crop-box.png) · [藥瓶正面](screenshots/v23/bottle-front.png) · [藥瓶側面](screenshots/v23/bottle-side.png)
- [近距縮放及平移](screenshots/v23/v23-zoom-pan.png) · [離線唯讀 HTML](screenshots/v23/06-offline-share.png) · [管理端包裝編輯](screenshots/v23/07-admin.png)

## 70 格渲染量測

Debian Linux、Chromium 156.0.8078.79、SwiftShader 軟體渲染、Playwright 預設桌面視窗，測試使用 production 唯讀檢視器和隔離的合成資料。模型數由與渲染相同的格位演算法計算。首繪耗時從導覽至偵測到滿載實例繪製；Draw calls 為每次操作後兩個 RAF 之間各自取樣的單窗峰值，可能包含陰影繪製。平均耗時為八次縮放取樣中，每次等待兩個 RAF 的平均，包含瀏覽器排程和軟體渲染。GL 資源是量測時仍存活的 texture 和 buffer 物件數，含渲染器內部物件。此資料不代表實體 GPU 記憶體、實際桌面 FPS 或行動裝置表現。

| 70 格情境 | 模型數 | 首繪 ms | Draw calls 峰值 | 兩 RAF 平均 ms | GL texture／buffer | Context loss |
|---|---:|---:|---:|---:|---:|---:|

| 全藥盒 | 672 | 788 | 78 | 317 | 8／318 | 0 |
| 全藥袋 | 1,512 | 1,209 | 78 | 432 | 8／318 | 0 |
| 盒瓶袋混合 | 873 | 1,055 | 82 | 335 | 10／338 | 0 |
| 跨架同品項藥瓶 | 570 | 3,602 | 78 | 644 | 8／318 | 0 |
| 十種不同圖片 | 873 | 1,324 | 96 | 476 | 17／352 | 0 |
| 十種最長邊 2048 px 圖片 | 873 | 5,877 | 96 | 351 | 17／352 | 0 |

[原始量測數據](screenshots/v23/shelf-metrics.json)
