# 我的藥局 My Pharmacy｜v22 正式需求

正式開發依據為使用者補充的原始 v22 規格及 [正式執行指令](REQUIREMENTS_V22_SUPPLEMENT.md)。這份文件整理正式規格與部署目標。若舊措辭相衝突，後續補充決策優先。

## 目的與環境

建立短暫體驗的繁體中文 3D 藥學教育遊戲。使用者不用登入，無後端或付費服務。使用 React、TypeScript、Vite、Three.js、React Three Fiber 和 Drei。正式儲存庫為公開的 joychieh18/my-pharmacy，預設分支 main，GitHub Actions 部署至 GitHub Pages。預期根路徑為 https://joychieh18.github.io/my-pharmacy/，管理端為 admin/、教材為 teaching/。所有程式與素材原創，參考專案僅供概念參考。

## 使用者流程

- 首頁包括原創白色與醫療綠社區藥局封面，以及「我要管理藥品」和「進入我的藥局」。
- 管理藥品提供「從已知的代碼進貨」、「我要進貨」及「管理藥品清單」。
- 只在記憶體保存個人目錄、圖片、藥架、擺放及選取。新頁面或重整均為 0 藥品及 OTC-01、OTC-02 兩座空架。頁內導航保留資料。總覽重置需二次確認，取消未完成進貨，不提供離頁提醒、個人備份、匯入及續編。
- 學名、劑量、劑型為三項必填。商品名、藥理分類、適應症、OTC/RX、包裝、圖片與裁切均選填且直接顯示。分類未填用 null。搜尋英文學名與商品名。
- 重複鍵為 `[genericName.trim().toLowerCase(), strength.replace(/\s/gu, '').toLowerCase(), dosageFormId]`。維持內部學名空白及原字串，不做同義詞或等價劑量轉換。編輯排除自身 ID，逐一列出目錄刪除的擺放引用並確認後級聯刪除。
- 包裝固定盒 9×15×5 cm、瓶直徑 8 cm 高 12 cm、袋 10×14×2 cm。手選覆蓋映射，無單品尺寸控制。PNG、JPEG、WebP 原始上限 2,000,000 bytes，最長邊縮至 1024 px，不放大。保持圖片比例，提供完整顯示、填滿裁切與 3D 預覽。無圖採白色包裝印學名和劑量。

## 固定 27 種劑型與包裝

| ID | 英文／繁體中文 | 預設包裝 |
|---|---|---|
| tablet | Tablet／錠劑 | 盒 |
| powder | Powder／散劑 | 袋 |
| granules | Granules／顆粒劑 | 袋 |
| chewable-tablet | Chewable tablet／咀嚼錠 | 盒 |
| orally-disintegrating-tablet | Orally disintegrating tablet／口崩錠 | 盒 |
| extended-release-tablet | Extended-release tablet／緩釋錠 | 盒 |
| enteric-coated-tablet | Enteric-coated tablet／腸溶錠 | 盒 |
| oral-solution | Oral solution／口服液劑 | 瓶 |
| oral-suspension | Oral suspension／口服懸液劑 | 瓶 |
| syrup | Syrup／糖漿劑 | 瓶 |
| oral-drops | Oral drops／口服滴劑 | 瓶 |
| cream | Cream／乳膏 | 盒 |
| ointment | Ointment／軟膏 | 盒 |
| gel | Gel／凝膠 | 盒 |
| lotion | Lotion／洗劑 | 瓶 |
| transdermal-patch | Transdermal patch／經皮貼片 | 盒 |
| topical-solution | Topical solution／外用液劑 | 瓶 |
| eye-drops | Eye drops／眼用滴劑 | 瓶 |
| eye-ointment | Eye ointment／眼用軟膏 | 盒 |
| ear-drops | Ear drops／耳用滴劑 | 瓶 |
| nasal-spray | Nasal spray／鼻用噴劑 | 瓶 |
| inhalation-aerosol | Inhalation aerosol／吸入氣霧劑 | 盒 |
| inhalation-powder | Inhalation powder／吸入粉劑 | 盒 |
| injection | Injection／注射劑 | 盒 |
| suppository | Suppository／栓劑 | 盒 |
| vaginal-tablet | Vaginal tablet／陰道錠 | 盒 |
| capsule | Capsule／膠囊 | 盒 |

## 固定場景及操作

採配置 A，公尺為單位。場景 9×7×3。OTC-01／02／03 的 x 為 2.7、4.5、6.3，z=3、yaw=180。OTC-04 為 (0.65,0,1.75)、90°，OTC-05 為 (8.35,0,1.75)、−90°。RX-01／02 的 x 為 3.2、5.6，z=6.55、yaw=180。櫃檯中心 (3.55,0,4.55)，寬 6.80、深 0.65、高 1.05，右側開口 2.05。工作桌中心 (1.25,0,6.10)，寬 1.40、深 0.60、高 0.85。入口 x=4.5、z=0、寬 1.5、高 2.2。磁磚 0.60 方形，邊緣裁切。明亮柔光、陰影與剖面視圖。

架外廓 1.20×1.80×0.40，OTC 開放式，RX 白色金屬背板 0.01；層板厚 0.02，每架由上到下 2／3／3／2 格。選藥後高亮有效空格，一格一包裝，可重複同品項。每位置一架，總計 1–7 架，兩區各可為零。空位顯示＋。名稱可同名、可空白、上限 20 個使用者可見字元。顯示固定位置編號，不允許拖動。總覽選架後可確認刪架，保留目錄。細部視角先選藥再點空格，替換和丟棄無二次確認。點藥品只顯示學名、商品名、劑量、劑型。RX 放 OTC 提醒 5 秒，未分類放任一區提醒 3 秒，均不阻擋。總覽透視相機、旋轉縮放與預設恢復；細部限制正面左右視角。手機上下分區，支援觸控。

## 管理與發布

獨立無登入管理端，草稿與使用者隔離，無公開寫入或前端憑證。管理員逐一建立、編輯藥品，建立、選藥與預覽主題草稿，手動輸入六位 ASCII 英數混合碼，排除 O/0/I/1，忽略大小寫且存大寫。發布包含靜態驗證索引、不可變版本 JSON 和相對路徑圖片，由維護者提交及部署。CI 檢查 schema、圖檔、碰撞、路徑及歷史不可變性。代碼永久占用，新內容用新版本新碼；停用及重啟只改索引。代碼並非保密憑證。進貨先取索引、驗證狀態、取版本及圖檔，預覽新項與重複，以最新目錄原子追加。首筆有效項目優先，重複不覆蓋。個人副本不回寫。

## 分享、手冊與驗收

總覽下載唯讀單一 HTML，優先完全離線。只包含必要的已上架藥品、圖片、架名與當前配置，安全序列化，支援縮放、旋轉、選架和查看品項，無編輯或續玩。重新開始後仍可開啟。提供可離線的繁體中文新手手冊，涵蓋準備、操作位置、步驟、成功判準、常見問題及 AI 求助，含搜尋、核取、步驟、章節及完整 Prompt 複製與手動備援。驗收區分單元、整合、瀏覽器模擬、實體裝置與正式部署。測試資料不得進入正式初始目錄或索引。
