from html import escape
from pathlib import Path

root = Path(__file__).resolve().parents[1]
chapters = [
("安裝開發環境", "電腦和終端機", "終端機", ["安裝 Node.js 24 LTS 與 Git。","輸入 node -v、npm -v、git --version。","進入 my-pharmacy 資料夾後執行 npm ci。"], "看到工具版本，npm ci 正常結束。", "若終端機找不到指令，重開終端機並確認安裝路徑。"),
("本機啟動", "完成 npm ci", "終端機 / 網站首頁", ["執行 npm run dev。","開啟終端機顯示網址的 /my-pharmacy/ 路徑。","按「進入我的藥局」，確認兩座初始空架。"], "首頁載入封面，進入總覽可見 OTC-01 和 OTC-02。", "若埠被占用，使用終端機新顯示的埠。"),
("GitHub 儲存庫", "GitHub 帳號", "GitHub 的 Code 頁籤", ["本專案儲存庫為 joychieh18/my-pharmacy，可直接開啟。","若要另建副本，在 GitHub 按 New repository，設定名稱、擁有者與可見性。","在 Code 複製 HTTPS URL，使用 git clone 再進入資料夾。"], "git remote -v 顯示你要操作的儲存庫。", "若資料夾已有下載的 checkout，直接進入它，避免重複複製。"),
("設定 GitHub Pages", "具有儲存庫設定權限", "GitHub → Settings → Pages", ["在 Build and deployment 的 Source 選 GitHub Actions。","確認 Pages 設定指向正式儲存庫。","完成部署後，從 Actions 的 Deploy 紀錄開啟環境網址。"], "部署成功後可開首頁與 /my-pharmacy/admin/。", "若網站 404，先查部署工作是否成功，以及網址是否含 /my-pharmacy/。正式部署待遠端驗證。"),
("查看 GitHub Actions", "GitHub 儲存庫已接收程式分支", "GitHub → Actions", ["開啟 Verify and deploy to GitHub Pages。","點擊工作紀錄並展開失敗的步驟。","在 main 可按 Run workflow 手動執行。"], "驗證、打包、部署皆顯示成功。", "如果流程尚未列出，確認工作流程檔已進入預設分支。遠端執行待驗證。"),
("更新遊戲網站", "GitHub 寫入權限及已開通 Pages", "本機終端機 / GitHub Pull requests", ["在開發分支執行 npm test 和 npm run build。","將變更提交至分支並開啟 Pull Request。","審查合併 main，等待 Actions 完成。"], "部署紀錄對應這次合併，重新載入可見更新。", "若看到舊介面，確認最新部署的 Git SHA 再重整。遠端流程待驗證。"),
("開啟教材管理端", "已啟動本機網站或已部署網站", "網址列 /my-pharmacy/admin/", ["在網站路徑後加入 admin/。","確認畫面有「教材藥品」「主題教材」「已發布代碼」。","固定使用同一瀏覽器與同一網址維護草稿。"], "頁首顯示「教材管理」。", "換分頁網址、埠號或瀏覽器後可能看不到原草稿，請回到原環境。"),
("新增教材藥品", "準備核實過的學名、劑量及劑型", "教材管理 → 教材藥品", ["按「新增教材藥品」。","填寫三個必填欄位，並按需要補充其他資料。","按「新增藥品」。"], "在教材藥品清單搜尋到品項。", "若重複，核對學名、劑量與劑型，並使用既有資料。"),
("圖片與包裝", "備妥有授權、5 MB 內的 PNG、JPEG 或 WebP", "藥品表單 → 正面包裝圖片／3D 包裝預覽", ["上傳圖片，最長邊會等比例縮至最多 2048 px；確認 2D 裁切與 3D 包裝預覽。","預設「填滿裁切」，滑鼠或手指可拖曳位置，並以滑桿調整放大；可按「重置裁切」或改選「完整顯示」。","切換盒、瓶或袋時檢查新的裁切框；藥瓶裁切框是曲面展開。可對無圖藥品選擇色票或恢復自動配色。"], "圖片保持比例。盒 13.5×22.5×7.5 cm，瓶直徑 12 cm、高 18 cm，袋 15×21×3 cm。", "圖片無法解碼時重新輸出有效圖檔。無圖會依配色顯示白底色帶，以及學名和劑量。有圖時其他表面為白色。"),
("建立主題", "教材藥品清單至少有一項", "教材管理 → 主題教材", ["按「新主題草稿」。","填寫主題名稱，勾選藥品。","核對「教材預覽」，按「儲存主題草稿」。"], "重整後可按同名草稿繼續編輯。", "若少了某品項，先回教材藥品確認已保存。"),
("手動指定主題代碼", "準備一個未使用的代碼", "主題教材 → 主題代碼", ["輸入六位 ASCII 英數混合字元。","避免 O、0、I、1 及空白。","儲存草稿並於匯出時確認無碰撞。"], "草稿以大寫保存，匯出時沒有碰撞警告。", "若代碼已占用，為這個版本另選一組。停用碼也會保留占用。"),
("匯出教材發布包", "已勾選藥品且有正常可讀的索引", "主題教材 → 驗證並匯出發布包", ["核對主題名稱、代碼與教材預覽。","按「驗證並匯出發布包」。","解壓 ZIP，核對 public/teaching 內的索引與版本。"], "得到 my-pharmacy-teaching.zip，圖檔在 teaching/images。", "索引讀取失敗時先確認網站路徑與連線。"),
("提交教材", "已解壓 ZIP，具 GitHub 寫入權限", "本機儲存庫 public/teaching", ["先同步最新 main，再開分支。","將 ZIP 的 public/teaching 合併至同名目錄，保留已有的版本和圖檔。","執行 npm run check:teaching -- <基準提交SHA> 並開啟 Pull Request。"], "差異只增加新教材與索引項，驗證成功。", "若有多份發布包，逐件依最新索引匯出和合併。以 GitHub Actions 的實際執行紀錄確認。"),
("驗證教材發布", "確認 main 部署成功", "遊戲 → 代碼進貨", ["另開瀏覽器或無痕視窗。","用新代碼預覽進貨，檢查名稱、藥品與圖檔。","確認進貨後到個人目錄查詢。"], "找到新藥且未自動上架。", "若找不到代碼，查 GitHub Actions、索引與版本路徑。以 GitHub Pages 部署紀錄確認。"),
("停用舊代碼", "目標代碼已發布", "教材管理 → 已發布代碼", ["按「載入已發布索引」。","找到目標代碼，按「匯出停用變更」。","只提交 ZIP 內的索引，部署後用遊戲預覽驗證。"], "遊戲提示代碼已停用，舊教材檔案仍保留。", "若索引變更提示過期，重載後再匯出。以 GitHub Pages 部署紀錄確認。"),
("重新啟用舊代碼", "代碼目前為停用狀態", "教材管理 → 已發布代碼", ["載入已發布索引。","按目標代碼的「匯出重新啟用變更」。","提交索引並部署，以相同代碼預覽。"], "代碼恢復，開啟原版本。", "若改指新版本，還原未發布的索引變更。以 GitHub Pages 部署紀錄確認。"),
("建立新教材版本", "原教材已發布，備妥新代碼", "教材管理 → 主題教材", ["開啟原草稿並調整題名或藥品內容。","填寫未使用的新代碼，再驗證及匯出。","提交新版發布包並保留舊版，視需要另行停用舊碼。"], "索引含獨立新舊版本，舊路徑仍可查詢。", "若沿用舊碼會撞碼，換新碼後再匯出。以 GitHub Pages 部署紀錄確認。"),
("學生代碼進貨", "教師提供有效代碼", "首頁 → 我要管理藥品 → 從已知的代碼進貨", ["輸入代碼並按「預覽進貨」。","核對新增與重複清單。","按「確認進貨」後查看結果。"], "新品加入目錄，重複品項跳過。", "代碼停用或資源錯誤時，聯絡教師確認部署。"),
("個人藥品管理", "備妥核實過的資料", "首頁 → 我要管理藥品", ["按「我要進貨」填寫學名、劑量、劑型。","到「管理藥品清單」，使用學名或商品名搜尋。","按「編輯」儲存變更；按「刪除」前核對受影響格位再確認。"], "新藥出現在目錄；刪除品項後相應格位會清空。", "若 500 MG 與 500mg 撞鍵，使用原品項或核對實際規格。"),
("配置 3D 藥架", "個人目錄已有品項", "首頁 → 進入我的藥局", ["拖曳旋轉、滾輪或雙指縮放；獨立藥架可用右鍵拖曳或兩指同向滑動平移。按地面＋或位置清單新增藥架。","點藥架或選位置後開啟；輸入名稱並按「儲存名稱」。","先選藥再點空格，同品項會整格直立陳列。點格內任一包裝可查看；替換或丟棄會更新整格。","回總覽選架，核對受影響的已上架格位數後再確認。"], "四層十格。RX 放 OTC 提醒 5 秒，未分類提醒 3 秒。", "若 WebGL 無法啟用，可用下方按鈕與格位清單。至少須保留一座架。"),
("下載 HTML 成果", "藥架已完成展示配置", "3D 藥局總覽", ["按「下載 HTML 成果」。","在下載目錄用支援 WebGL 的瀏覽器開啟 HTML。","旋轉並點選藥架與已上架藥品，確認成果。"], "成果可獨立開啟，保留整格陳列、配色、裁切與已上架品項；能在獨立藥架縮放和平移。", "手機若以檔案預覽開啟，改由支援本機 HTML 的瀏覽器處理。"),
("重新開始", "檢查是否需先下載成果", "3D 藥局總覽", ["按「重新開始遊戲」。","選取消可返回原配置。","確認後核對只剩兩座初始空架。"], "本次使用端資料清空，已下載成果仍可開啟。", "重整也會清空。請在重置前核對是否已下載成果。"),
("故障排除", "記下網址、操作步驟及錯誤訊息", "瀏覽器 / Actions 工作紀錄", ["404 時核對 /my-pharmacy/ 與部署紀錄。","教材無法載入時確認索引、版本與圖片路徑。","3D 不顯示時記下瀏覽器及 WebGL 狀態，試用下方按鈕。"], "能指出出錯範圍。滿架時可先切回總覽或恢復預設視角；並記下瀏覽器、裝置、操作與是否有畫面停頓。", "求助時可提供錯誤畫面，先遮蔽任何個資或憑證。"),
("日常維護", "準備獨立分支及正版素材", "docs、public/teaching 和 GitHub Pull requests", ["改動前讀取需求、測試報告及歷史教材規則。","在測試環境用測試藥品檢查引用；用真實設備驗證點選及觸控。","若更新封面，使用原創素材並檢查手機構圖。"], "測試通過，原有教材檔案仍完整，封面來源可追溯。", "若測試資料混入正式索引，在發布前移出並重新驗證。"),
("安全地請 AI 協助", "備妥可公開的重現資訊", "AI 對話與 Pull Request", ["描述畫面、步驟與錯誤，移除密碼、金鑰和私密資料。","要求 AI 先查原始碼與測試，再提出具體變更。","在分支檢查差異、測試及部署紀錄，再決定是否合併。"], "每項變更有可重現的查核結果。", "AI 未取得畫面或工具輸出時，請它清楚標示未驗證項目。"),
]

def prompt(title, step):
    return f"我在《我的藥局》進行「{title}」，目前步驟為：{step} 請先確認我實際看到的頁面、錯誤訊息與操作順序，再逐步協助。不要假裝已看到畫面或已修改網站，也不要要求我提供任何秘密。"

nav, sections = [], []
for i, (title, prep, location, steps, success, fix) in enumerate(chapters, 1):
    nav.append(f'<a href="#c{i}">{i}. {escape(title)}</a>')
    lis = "".join(f'<li><label><input type="checkbox">{escape(step)}</label> <button data-copy="{escape(prompt(title,step),quote=True)}">複製本步 AI 求助</button></li>' for step in steps)
    sections.append(f'<section id="c{i}"><h2>{i}. {escape(title)}</h2><p><strong>目的</strong>　完成「{escape(title)}」。</p><p><strong>事前準備</strong>　{escape(prep)}</p><p><strong>操作位置</strong>　{escape(location)}</p><ol>{lis}</ol><p><strong>成功判準</strong>　{escape(success)}</p><p><strong>常見問題與處理</strong>　{escape(fix)}</p><button data-copy="{escape(prompt(title,"依序完成本章各步驟。")+"\n"+"\n".join(steps),quote=True)}">複製整章 AI 求助</button></section>')

full = "\n\n".join((root / "docs" / name).read_text() for name in ["REQUIREMENTS_V23.md","REQUIREMENTS_V22.md","REQUIREMENTS_V22_SUPPLEMENT.md"])
html = """<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>我的藥局｜新手管理手冊</title><style>
body{margin:auto;max-width:1050px;padding:1.3rem;background:#f3f8f3;color:#173c2d;font:1rem/1.6 system-ui,sans-serif}nav{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.45rem;margin:1rem 0}a{color:#065d42}button,input,textarea{font:inherit}button{border:1px solid #b0cec0;background:#e5f2ea;border-radius:.5rem;padding:.3rem .65rem;cursor:pointer}input[type=search],textarea{width:100%;padding:.45rem;box-sizing:border-box}section{background:white;border:1px solid #d4e6dd;border-radius:.75rem;padding:1rem;margin:1rem 0}li{margin:.7rem 0}dialog{width:min(85vw,45rem)}[hidden]{display:none!important}
</style></head><body><header><h1>我的藥局 · 新手管理手冊</h1><p>依畫面操作，完成一項即可勾選。此手冊可離線開啟。</p><label>搜尋章節<input type="search" id="search"></label><button id="copy-all">複製完整開發 Prompt</button><p id="status" role="status"></p></header><nav aria-label="章節導覽">NAV</nav><main>SECTIONS</main>
<dialog id="copy-dialog"><p>請按 Ctrl+C（Mac 按 ⌘C），或長按選取後複製。</p><textarea id="manual" rows="8" readonly></textarea><form method="dialog"><button>關閉</button></form></dialog>
<textarea id="full" hidden>FULL</textarea>
<script>
const search=document.querySelector('#search');
const sections=[...document.querySelectorAll('section')];
search.addEventListener('input',()=>{const query=search.value.trim().toLowerCase();for(const section of sections){section.hidden=!section.textContent.toLowerCase().includes(query);document.querySelector('a[href="#'+section.id+'"]').hidden=section.hidden;}});
async function copy(text){try{await navigator.clipboard.writeText(text);document.querySelector('#status').textContent='已複製。';}catch{const dialog=document.querySelector('#copy-dialog');const field=document.querySelector('#manual');field.value=text;dialog.showModal();field.select();}}
document.querySelector('#copy-all').onclick=()=>copy(document.querySelector('#full').value);
document.querySelectorAll('[data-copy]').forEach(button=>button.onclick=()=>copy(button.dataset.copy));
</script></body></html>"""
(root / "public" / "ADMIN_GUIDE.html").write_text(html.replace("NAV","".join(nav)).replace("SECTIONS","".join(sections)).replace("FULL",escape(full)))
