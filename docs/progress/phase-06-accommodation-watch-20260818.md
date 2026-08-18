# Phase 06 — 住宿監看 2026-08-18 quick check

## 這次完成

- 依 Asia/Taipei 週二規則執行 quick：固定檢查 2027/5/13–5/17、5 位成人、4 晚。
- White Shisa：Booking.com 顯示 Two-Bedroom House 可訂，總價由 NT$32,563 降至 NT$25,414。
- Villa Aparagi：官方 Chillnn 顯示可訂；60 日前早鳥連泊方案總價 JPY 352,000。
- Feliz Ueno 2 Bedroom：官方 Chillnn 顯示可訂；3–4 連泊折扣後總價 JPY 429,525。
- PRIVATE INGYA：官方 AirHost 月曆顯示 5/15–5/17 不可選，無法完成四晚連住。
- Villaze MAEHAMA：官方 Beds24 於相同條件顯示無法預訂；3 連泊以上免費租車仍須 EARTHCAR 會員註冊與另行訂車。
- Villa Capri 3 Bedroom：官方 Tripla 於相同條件回覆無可售房型。

## 判讀界線

- `UNAVAILABLE_OR_NOT_RELEASED` 只表示目前官方引擎不能完成預訂，不推論成售罄。
- Villa Aparagi 與 Feliz 頁面雖標示税込，未明確區分 2027 宮古島／沖繩宿泊稅，因此 `tax_status` 保留 `UNKNOWN`。
- 付款時點未在公開查詢步驟可靠顯示；未進入需要姓名、聯絡資料或付款資料的頁面。
- 日圓方案的臺幣換算沿用 2026-08-14 臺銀 JPY 即期賣出匯率 0.2028；下次 full check 再刷新。

## 資料入口

- 正式現況：`docs/accommodation-watch/data/current.json`
- 逐次觀測：`docs/accommodation-watch/data/observations.json`
- 本次提醒：`docs/accommodation-watch/latest-report.txt`
- 公開頁來源：`docs/site/accommodation-watch.html`

## 下一個具體動作

下一次排程依日期選 quick／full；若 Villa Aparagi 或 Feliz 仍可訂，優先補查目標方案的付款時點、宿泊稅與長輩動線，避免只依顯示總價換房。
