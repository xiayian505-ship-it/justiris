# Justiris｜劇情播放器及章節資料

## 資料夾

- `data/catalog.json`：六集索引、正式章回名稱、每回十節和開放狀態。
- `data/episode_01/` ～ `data/episode_06/`：六集各自獨立。
- `data/episode_01/chapter_01/section_01.json`：第一集／第一回／第一節。
- 第一至第四集依已確認的六回目錄，各預留 10 節：4 × 6 × 10 ＝ 240 份空白 JSON。
- 第五、六集僅預留集數資料夾；因回目未公開，不代填回數或節數。

## 每節填入方式

空白節目前長這樣：

```json
{
  "id": "section_01",
  "events": []
}
```

之後可將 `events` 填入正式劇情，並在 `catalog.json` 對應節設定 `"enabled": true` 才公開。

可用事件類型：

- `scene`：場景，欄位 `title`、`text`。
- `narration`／`text`：敘事，欄位 `text`。
- `dialogue`：對話，欄位 `speaker`、`text`。
- `choice`：分支，欄位 `prompt`、`options`，每個選項可用 `goto` 指向其他事件的 `id`。
- `challenge`：預留獨立解謎玩法接口；目前不會假裝已完成遊戲。

播放器會檢查節 ID、`events` 是否非空。尚未啟用的節無法點擊。

## 導航

`game/index.html` 選擇集 → 回 → 進入 `game/story/index.html?episode=episode_01&chapter=chapter_01` → 點選已開放的節 → 播放劇情。

當某回的節數少於十節時，可以刪除多餘的空白 JSON，並且**同步刪除 `catalog.json` 中對應的節索引**。只刪檔案但保留索引會造成無效路徑。

## 技術

- 維持 HTML、功能 CSS/JS、外觀 CSS、UI JS 的分離結構。
- 不引用鹿雨森的美術素材與深綠色 CSS。
- 不使用 AI 圖像；示意眼形以內嵌 SVG 繪製。
- 本版沒有非必要的軍火庫依賴；日後若引用，使用軍火庫的 HTTPS 絕對路徑。
- `fetch()` 讀取 JSON 時需使用 GitHub Pages 或本機 HTTP 伺服器；直接以 `file://` 打開可能被瀏覽器限制。
