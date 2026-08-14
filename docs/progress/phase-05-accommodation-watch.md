# Phase 05 — Accommodation Watch（2026-08-14）

## 這次完成

- 建立 `docs/accommodation-watch/`：固定住宿設定、追加式 observation 歷史、最新比較、價格歷史、通知去重與執行摘要。
- 實作零外部依賴的 Node.js routine：`quick`／`full` 模式、固定旅行條件驗證、JPY/TWD、宿泊稅、Effective Cost、White Shisa 價差、100 分評分、通知規則與 HTML 產生。
- White Shisa 原始 Benchmark `NT$32,676` 永久保留；2026-08-14 最新顯示價 `NT$32,563` 另行記錄。
- 初始即時查核：White Shisa 與 The Villa Miyako 有可售結果；Villa Capri 3BR、Feliz、Hotel ESTRELLAS、Villa OLOO 沒有可售結果但不能判定售罄；PRIVATE INGYA、Villa Aparagi、Villaze 需官方入口人工查核。
- 查證 2027/2/1 起宮古島市／沖繩縣宿泊稅合計 2%，並以 UNKNOWN／EXCLUDED_AMOUNT_UNKNOWN 阻止不可靠 Effective Cost。
- 新增 `docs/site/accommodation-watch.html` 並接入根目錄單頁網站；Feliz 保留海龜活動區、博愛わいわい Beach、家人分流與使用者高興趣標示。
- 建立每天 08:30 的 Codex heartbeat：平日快查、週一／週四完整掃描、2026-11-14 起每日完整掃描。

## 驗證

- `node docs/accommodation-watch/tests/watcher.test.cjs`：PASS
- `node docs/accommodation-watch/tests/site.test.cjs`：PASS
- `node docs/accommodation-watch/run.cjs --mode full`：第二次執行為 `NO_ACTIONABLE_CHANGE`，證明通知不重複。
- `node docs/build-standalone.cjs`：PASS
- `git diff --check`：PASS
- 本機頁面因瀏覽器安全政策封鎖 localhost／file URL，尚未取得完整視窗視覺驗收；推送部署後應改用公開 GitHub Pages 完成視覺查核。

## 現在還沒完成

- PRIVATE INGYA、Villa Aparagi、Villaze 的官方訂房引擎仍需首輪人工查核。
- The Villa Miyako 與 White Shisa 的目標方案取消期限、付款時點、2027 宿泊稅是否已含仍待訂房頁確認。
- Feliz 2 Bedroom Type 的 Toilet／Bathroom 數與實際步行海灘動線仍維持 UNKNOWN。

## 下一步第一個動作

下一次 heartbeat 先依當天模式查核目標住宿；若是 2026-08-17（週一）完整掃描，優先打開 PRIVATE INGYA、Villa Aparagi 與 Villaze 官方訂房引擎，將結果寫入 `.codex-temp` observation 後用 `--input` 匯入。
