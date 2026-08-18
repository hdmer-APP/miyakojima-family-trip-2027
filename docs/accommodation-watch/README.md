# Accommodation Watch

## 正式入口

- 網頁：`docs/site/accommodation-watch.html`
- 最新通知：`latest-report.txt`
- 固定住宿條件與設施：`config.json`
- 追加式查核紀錄：`data/observations.json`
- 最新比較結果：`data/current.json`
- 價格歷史：`data/price-history.json`
- 上次執行摘要：`data/last-run.json`

需求來源為 `docs/miyakojima-accommodation-watcher-routine.md`。5 位成人、4 晚的住宿顯示總價以 `NT$50,000` 為硬上限；超過上限仍保留歷史，但不產生推薦通知。White Shisa 的原始 Benchmark `NT$32,676` 永久保留；最新價格另行計算，不覆寫原始值。

## 執行方式

```powershell
# 每日優先候選快查後重算
node docs/accommodation-watch/run.cjs --mode quick

# 週一／週四完整掃描後重算
node docs/accommodation-watch/run.cjs --mode full

# 匯入本次人工／瀏覽器查核結果並重算
node docs/accommodation-watch/run.cjs --mode full --input .codex-temp/accommodation-observations.json

# 執行測試
node docs/accommodation-watch/tests/watcher.test.cjs
node docs/accommodation-watch/tests/site.test.cjs

# 重建 GitHub Pages 單頁版
node docs/build-standalone.cjs
```

`data/manual-observations.example.json` 只是欄位範例，價格是假的，不會自動匯入。真正的本次輸入應先放在已忽略的 `.codex-temp/`，確認內容後再以 `--input` 追加；程式會拒絕錯誤日期、人數、晚數、未知住宿及完全相同的重複紀錄。

## 排程

- 每天 08:30（Asia/Taipei）：White Shisa、PRIVATE INGYA、Villa Aparagi、Villaze、Villa Capri 3BR、Feliz，以及兩個五萬元內 Airbnb 候選快查。
- 每週一與週四：完整檢查全部候選、宿泊稅、匯率、取消條款、租車優惠及新 Villa。
- 2026-11-14 起：距出發約 180 天，改為每日完整檢查。
- 沒有重要變化時只輸出 `NO ACTIONABLE CHANGE`。

排程代理應先查官方網站／官方訂房引擎，再查 Booking.com 等合法公開通路。不得繞過 CAPTCHA、登入或反爬蟲；遇到阻擋時寫入 `MANUAL_CHECK_REQUIRED` 並保留直接訂房連結。

## 狀態語意

- `AVAILABLE`：目標日期、5 位成人、4 晚有明確可售結果。
- `UNAVAILABLE_OR_NOT_RELEASED`：目前沒有可售結果，但無法區分未釋房或已無房。
- `MANUAL_CHECK_REQUIRED`：自動來源無法可靠查核，不能視為不可訂。
- `UNKNOWN`：尚未成功查核。

## 成本與評分

預算門檻以訂房頁的住宿顯示總價判斷；2027 宿泊稅或強制費用若未明示，仍另外標為待確認。Effective Cost 只有在顯示價、宿泊稅狀態及可量化租車價值都足夠時才會計算。2027/5 的宮古島住宿適用市／縣合計 2% 宿泊稅；稅基是每人每晚純住宿費，1,000 日圓以下捨去，故不能從含其他費用的總價硬拆。

100 分制依需求文件實作：Toilet 15、Bathroom／Shower 15、長輩友善 15、正式床位 15、Bedroom 10、廚房／洗衣 10、海灘體驗 10、有效價格 10。缺少硬資料時得分為 0 或按明定的未知規則計分，頁面會標為「暫定」。

## 下次接續

1. 先看 `data/last-run.json` 與 `latest-report.txt`。
2. 只針對排程模式列出的目標做查核。
3. 把新結果寫成 observation array，透過 `--input` 追加。
4. 檢查通知與頁面後，執行測試及 `node docs/build-standalone.cjs`。
5. 僅在資料確有變化時提交網站與歷史紀錄。
