# Miyakojima Accommodation Watcher

## 0. 任務目的

請建立一個可持續執行的住宿價格與房況追蹤 Routine，用於：

**宮古島家庭旅行 2027**

現有旅行網站：

https://hdmer-app.github.io/miyakojima-family-trip-2027/

本 Routine 的目的不是重新規劃行程，而是持續追蹤適合本次旅行的 Villa／一棟貸住宿。

目前已有 **White Shisa** 作為住宿基準。只有當其他住宿在以下方面整體明顯優於 White Shisa 時，才建議更換：

- 衛浴配置
- 五位成人住宿舒適度
- 長輩友善
- 海邊生活
- 價格

---

# 1. 固定旅行條件

```yaml
trip:
  destination: Miyakojima, Okinawa, Japan
  check_in: 2027-05-13
  check_out: 2027-05-17
  nights: 4
  guests:
    adults: 5
  rental_car: true
```

住宿位於宮古島中央、西側、南側、東側或北側，**不得因區域本身加分或扣分**。宮古島不大，而且本次全程租車。

住宿位置只評估：

1. 回住宿是否合理
2. 是否步行可到海
3. 周邊環境是否適合度假
4. 是否方便採買
5. 是否讓住宿本身成為旅行體驗的一部分

---

# 2. 使用者住宿需求

## Hard / High Priority

- 可住 5 位成人
- 一棟貸／Villa
- 至少 2 Bedroom，最好 3 Bedroom
- 至少 2 Toilets
- 最好至少 2 Bathrooms／Showers
- 完整 Kitchen
- Washer；Dryer 優先
- 五位成人最好都有正式床位
- 長輩友善
- Single-story／平房優先
- 避免長輩必須每天上下樓
- 停車方便
- 四晚連住

## Strong Preference

- 步行可到真正可以玩水的 Beach
- Private pool
- BBQ
- Outdoor shower
- Ocean view
- 安靜
- 有生活感
- 超市／Convenience Store 不遠

## 使用者特別興趣

**Feliz Villa Suite Miyakojima Ueno 是使用者特別有興趣的重點候選。**原因不是單純地理位置，而是它靠近 **博愛わいわい Beach** 與海龜活動區，並具備步行玩海的生活情境。

特別重視的使用方式：

- 長輩可留在 Villa 休息
- 其他家人可從 Villa 步行去海邊玩水
- 玩海後可快速回 Villa 沖洗、游泳或休息
- 家人不必為了不同體力與活動偏好，全員同進同出

海龜活動是附近海域的特色，**不得寫成保證看得到海龜**；實際目擊仍受季節、天候、海況與自然活動影響。

---

# 3. 評分原則

不要把「中央位置」當成優點。排序優先程度：

```text
1. Toilets >= 2
2. Bathrooms / Showers >= 2
3. Elderly-friendly / Single-story
4. Five adults have comfortable real beds
5. Bedrooms >= 2, preferably >= 3
6. Full kitchen
7. Washer + Dryer
8. Walkable usable beach
9. Villa / vacation experience
10. Effective total cost
```

---

# 4. White Shisa Benchmark

White Shisa 是固定 Benchmark，不得每次重新選 Benchmark。

Official：

https://whiteshisa.com/

目前已知：

```yaml
white_shisa:
  role: BASELINE
  area_sqm: 70
  single_story: true
  barrier_free_or_low_step: true
  bedrooms: 2
  single_beds: 4
  sofa_bed:
    type: double
    count: 1
  toilets: 1
  indoor_bathrooms: 1
  outdoor_showers: 2
  kitchen: true
  washer: true
  dryer: true
  beach_drive_minutes: approximately 5
```

目前已取得的 2027/05/13–05/17 四晚住宿價格：

```text
WHITE_SHISA_BASELINE_TWD = 32676
```

如果未來 White Shisa 自身價格發生變化：

- 保留 original baseline
- 同時記錄 current price
- 不要覆寫歷史資料

---

# 5. Priority Properties

## S — PRIVATE INGYA

Official／Booking：

https://private-ingya.com/

```yaml
priority: S
bedrooms: 3
bed_configuration:
  - King
  - Double
  - Twin
toilets: 3
bathrooms: 3
kitchen: true
washer_dryer: true
private_pool: true
bbq: true
```

重點：3 Bedroom、3 Bathroom、3 Toilet，五位成人非常適合；一天一組住宿，Availability 非常重要。

需要持續確認：

- 2027/05/13–05/17 是否開放
- 四晚總價
- 長輩主要活動是否需樓梯
- Cancellation policy

## S — Villa Aparagi Miyakojima

Official：

https://www.villa-aparagi.com/

Booking：

https://villa-aparagi.booking.chillnn.com/ja/

```yaml
priority: S
bedrooms: 3
toilets: ">=3"
bathrooms_showers: ">=3"
kitchen: true
```

三間 Bedroom 各自具有 Shower、Washbasin、Toilet。

需要追蹤：

- 2027/05/13–05/17
- Early booking plan
- Consecutive-night discount
- Cancellation terms
- 長輩是否可完全避免不必要樓梯

## S — Villaze MAEHAMA BEACH

Official：

https://villaze.net/maehama/

```yaml
priority: S
single_story: true
bedrooms: 3
bathrooms: 2
kitchen: true
washer: true
toilets: UNKNOWN
```

官方曾提供三連泊以上住宿者租車相關優惠。每次查價必須同時確認：

```text
rental_car_included
rental_car_discount
rental_car_conditions
```

必須進一步確認總共有幾個獨立 Toilet。不要因為 2 Bathrooms 就自行推論為 2 Toilets。

## S/A — Villa Capri 3 Bedroom

Official：

https://www.palm-resorts.com/en/villacapri

Target：**3 Bedroom Type**

```yaml
priority: S/A
bedrooms: 3
single_beds: 6
toilets: 2
bathrooms: 2
washbasins: 2
kitchen: true
```

最大優點：5 位成人都可以有正式床位。

需要重新 verification：

- 3BR 實際樓層
- 長輩 Bedroom 在哪一層
- Bathroom／Toilet 動線
- 是否可以讓長輩不需每天上下樓

## A — Feliz Villa Suite Miyakojima Ueno（使用者高興趣）

Official：

https://nikken-hotelmgt.co.jp/ueno/

Target：**2 Bedroom Type**

```yaml
priority: A
user_interest: HIGH
feature_tags:
  - TURTLE_ACTIVITY_AREA_NEARBY
  - WALKABLE_USABLE_BEACH
  - SPLIT_GROUP_FRIENDLY
bedrooms: 2
tatami_room: true
kitchen: true
private_pool: true
beach_name: 博愛わいわい Beach
beach_walkable: true
turtle_activity_area_nearby: true
toilets: UNKNOWN
bathrooms: UNKNOWN
```

### 為什麼特別值得追蹤

Feliz 的最大價值不是地理中心性，而是：**住宿本身就是海邊度假體驗。** 它靠近博愛わいわい Beach 與海龜活動區，使用者對「步行去海邊玩水」與附近海龜活動特別有興趣。

它特別適合以下家庭情境：

- 長輩在 Villa 休息
- 其他家人步行去海邊玩水或觀察海洋生態
- 玩海後快速回 Villa 沖洗、使用私人泳池或休息
- 家人依體力與興趣分流，不需全員一起搭車移動

海龜活動區只代表附近海域具有海龜活動機會，**不得保證目擊或接觸海龜**。

### 必須持續查證，不得猜測

- Toilet count
- Bathroom／Shower count
- 2 Bedroom Type exact configuration
- 實際從目標棟別到博愛わいわい Beach 的步行時間與路線
- 玩海後可使用的沖洗設施與動線

即使其他房型或第三方頁面出現衛浴資料，也必須針對本次實際可訂的 **2 Bedroom Type／棟別**確認。不得把 Bathroom 數推論成 Toilet 數。

如果：

```text
toilets >= 2
AND
bathrooms/showers >= 2
```

自動升級為：

```text
Priority = S
```

## A — The Villa Miyako

Official：

https://the-villa-miyako.jp/

Airbnb：

https://www.airbnb.com/rooms/609551935804322533

```yaml
priority: A
area_sqm: approximately 100
single_story: true
bedrooms: 2
beds: 5
toilets: 2
bathrooms: 2
kitchen: true
washer: true
dryer: true
```

定位：**Elderly-friendly benchmark**。不要因為位於中央而加分；它的價值是平房、2 Toilet、2 Bathroom、5 Beds。

## A/B — Hotel ESTRELLAS

Official：

https://www.hotelestrellas.com/

Target units：Luna、Sol、其他適合 5 人的棟別。

```yaml
priority: A/B
max_guests: 6-8 depending on villa
kitchen: true
dishwasher: true
washer: true
gas_dryer: true
rental_car_included: true
rental_car_capacity: 7
```

這間不可單純比較住宿費，必須計算：

```text
Accommodation
+ Tax
+ Mandatory fees
- Value of included rental car
```

需要確認：

- Toilet count by villa
- Bathroom count by villa
- 2027 price
- Rental car insurance
- Rental car coverage
- Additional rental fees
- Airport pickup／return conditions

## B — Villa OLOO

Official：

https://villaoloo.com/guest-room/

```yaml
priority: B
toilets: 2
washbasins: 2
indoor_showers: 1
outdoor_bath: 1
private_sauna: true
kitchen: true
washer: true
```

主要缺點：只有一個主要 Indoor Shower。除非價格非常有競爭力，否則排序低於 2 Bathroom 候選。

---

# 6. 可擴充搜尋

Routine 不得永遠只看上述住宿。每次完整掃描時，可以搜尋新的宮古島住宿。

住宿顯示總價硬上限：`NT$50,000`（2027/05/13–05/17、5 位成人、4 晚）。超過上限的結果可保留歷史，但不得列入推薦或通知；宿泊稅與強制費用未明示時仍需標記 `UNKNOWN`。

新住宿只有符合以下條件才加入 Watch List：

```text
Guests >= 5 adults
AND Bedrooms >= 2
AND Toilets >= 2
AND Kitchen = true
AND Villa / entire home / whole-house rental
```

Strong bonus：

```text
Bathrooms >= 2
Bedrooms >= 3
Real beds >= 5
Single story = true
Beach walk <= 10 minutes
Washer + Dryer
```

如果發現符合條件的新 Villa，加入 `NEW_DISCOVERY` 並通知一次。

---

# 7. 每次 Routine 必須收集的 Schema

每個 Property 建立：

```json
{
  "property_name": "",
  "priority": "",
  "official_url": "",
  "booking_url": "",
  "check_in": "2027-05-13",
  "check_out": "2027-05-17",
  "guests": 5,
  "nights": 4,

  "availability_status": "",
  "room_or_villa_type": "",

  "currency": "JPY",
  "base_price": null,
  "discount": null,
  "accommodation_tax": null,
  "mandatory_fees": null,
  "final_total_jpy": null,

  "final_total_twd": null,
  "price_per_person_twd": null,

  "cancellation_policy": "",
  "free_cancellation": null,
  "free_cancellation_deadline": "",
  "payment_timing": "",

  "bedrooms": null,
  "real_beds": null,
  "sofa_beds": null,
  "futons": null,

  "toilets": null,
  "bathrooms": null,
  "showers": null,
  "washbasins": null,

  "single_story": null,
  "stairs_required_for_elderly_guest": null,

  "kitchen": null,
  "washer": null,
  "dryer": null,
  "dishwasher": null,

  "private_pool": null,
  "bbq": null,

  "beach_name": "",
  "beach_walk_minutes": null,
  "beach_drive_minutes": null,

  "rental_car_included": null,
  "rental_car_value_jpy": null,

  "effective_cost_jpy": null,
  "effective_cost_twd": null,

  "upgrade_cost_vs_white_shisa_twd": null,

  "source_urls": [],
  "checked_at": "",
  "confidence": "",
  "notes": ""
}
```

Feliz 的海龜活動區、步行玩海與家人分流使用情境，應放入 `notes`；若實作允許，也可另加 `feature_tags`，但不得刪除或改名上述既有欄位。

---

# 8. 不得猜測資料

如果官方資料沒有說 Toilet 數：

```text
toilets = UNKNOWN
```

不能以 `2 bathrooms => 2 toilets` 推論。

同樣，`Maximum guests = 6` 不代表 `6 real beds`。必須分開記錄：Real beds、Sofa beds、Futons。

Feliz 的 `toilets` 與 `bathrooms` 在正式來源確認以前，都必須維持 `UNKNOWN`。

---

# 9. Source Priority

```text
1. Official property website
2. Official booking engine
3. Booking.com
4. Rakuten Travel
5. Jalan
6. Airbnb
7. Agoda
8. Google / travel blogs
```

Toilets、Bathrooms、Floor plan、Beds 等硬體資料優先使用 Official source。價格允許比較不同 Booking channels。

---

# 10. 2027 Okinawa Accommodation Tax

旅行日期已經在 2027 年，必須考慮 Okinawa accommodation tax。

如果 Booking channel 顯示 `tax included`，不可重複加；如果顯示 `tax excluded`，必須加入 Effective Cost。

```text
tax_status:
  INCLUDED
  EXCLUDED
  UNKNOWN
```

若規則或稅率有更新，以執行當日官方最新資料為準。

---

# 11. Currency Conversion

所有住宿最後都同時顯示 JPY 與 TWD。每次 Routine 使用當日 JPY/TWD rate，並記錄：

```text
exchange_rate
exchange_rate_source
exchange_rate_checked_at
```

不要覆寫歷史價格。

---

# 12. Effective Cost

不要只比較 Booking Price。

```text
Effective Cost
= Accommodation
+ Accommodation Tax
+ Mandatory Fees
+ Required Rental Car Cost
- Included Rental Car Value
- Other Quantifiable Included Benefits
```

如果 included benefit 無法合理估值，不要亂估；寫 `Benefit value = UNKNOWN`，並在報告另外說明。

---

# 13. White Shisa Upgrade Cost

```text
Upgrade Cost
= Candidate Effective Cost TWD
- White Shisa Comparable Effective Cost TWD
```

目前初始住宿 baseline：

```text
NT$32,676 / 4 nights
```

如果 Candidate 包含租車，White Shisa 也必須加入相同期間合理租車成本後再比較，確保 apples-to-apples。

---

# 14. Recommendation Score

建立 100 分制：

```text
Toilets                  15
Bathrooms / Showers      15
Elderly friendliness     15
Real sleeping comfort    15
Bedrooms                 10
Kitchen / Laundry        10
Beach experience         10
Effective price          10
----------------------------
Total                   100
```

## Toilets

```text
1 = 0
2 = 12
3+ = 15
```

## Bathrooms／Showers

```text
1 = 3
2 = 12
3+ = 15
```

戶外沖沙 Shower 不等於完整 Bathroom。

## Elderly Friendliness

```text
single story / no required stairs = 15
minor optional stairs             = 10
bedroom requires stairs           = 3
unknown                           = 7
```

## Sleeping Comfort

```text
5 adults all real beds = 15
one person futon        = 11
one person sofa bed     = 7
two+ compromised beds   = 3
```

Feliz 的步行玩海與家人分流情境可在 `Beach experience` 與文字 recommendation 中凸顯，但不得用它抵銷尚未確認的 Toilet／Bathroom 硬條件。

---

# 15. Notification Rules

Routine 可以每日執行，但**不要每天通知相同結果**。只有符合以下條件才通知：

```text
1. Property 首次開放 2027/05/13–05/17
2. unavailable -> available
3. Price drop >= 5%
4. New early-booking discount
5. New consecutive-night discount
6. New free-cancellation plan
7. Cancellation deadline <= 14 days
8. Effective cost <= White Shisa comparable cost + NT$20,000
9. New property discovered satisfying:
   toilets >= 2
   bedrooms >= 2
   bathrooms/showers >= 2
   kitchen = true
10. Important facility information becomes confirmed
    e.g. UNKNOWN toilet count -> 2 toilets
11. All alerts above require displayed accommodation total <= NT$50,000
    If price is UNKNOWN or over budget, keep tracking silently
```

### Feliz 專屬通知註記

Feliz 的 Alert、Comparison Card 與 Recommendation 應附上：

```text
🐢 Near turtle activity area
🏖️ Walkable to 博愛わいわい Beach
👵 Split-group friendly: elderly guest can rest at Villa while others walk to the beach
```

若 Feliz 的 `toilets` 或 `bathrooms/showers` 從 `UNKNOWN` 變成官方確認數值，視為重要資訊變更並通知一次。若兩者都確認為至少 2，除通知外還要自動升級為 S。

---

# 16. High Priority Alert

立即標記 `🔥 HIGH PRIORITY`，如果：

```text
availability = AVAILABLE
AND toilets >= 2
AND bathrooms/showers >= 2
AND comfortable_for_5_adults = true
AND elderly_stairs_problem = false
AND upgrade_cost <= NT$20,000
```

---

# 17. S-Class Availability Alert

以下住宿只要顯示總價仍在 `NT$50,000` 硬上限內，即使 `upgrade_cost > NT$20,000`，第一次出現 `AVAILABLE` 仍通知一次：

```text
PRIVATE INGYA
Villa Aparagi
Villaze MAEHAMA BEACH
Villa Capri 3BR
```

原因：高品質整棟 Villa 數量有限，Availability 本身具有價值。

Feliz 目前維持 A；只有衛浴硬體確認符合升級條件後，才加入 S-Class 行為，不可因海龜特色直接升級。

---

# 18. Output Format

Routine 正常執行但沒有重要變化：

```text
NO ACTIONABLE CHANGE
```

不要產生長報告。

有重要變化時：

```text
🏝️ Miyakojima Accommodation Alert

Date checked:
2026-XX-XX

Trip:
2027/05/13 → 05/17
5 adults / 4 nights

PROPERTY:
PRIVATE INGYA

STATUS:
🟢 AVAILABLE

PRICE:
¥XXX,XXX
≈ NT$XX,XXX

WHITE SHISA:
NT$32,676

UPGRADE:
+NT$XX,XXX total
+NT$X,XXX/person

FACILITIES:
3 Bedrooms
3 Toilets
3 Bathrooms
Full Kitchen
Washer/Dryer
Private Pool

WHY THIS MATTERS:
Compared with White Shisa:
+1 bedroom
+2 toilets
+2 bathrooms
better sleeping configuration

CANCELLATION:
Free cancellation until XXXX

BOOK:
<booking URL>

RECOMMENDATION:
⭐⭐⭐⭐⭐

ACTION:
Strong candidate to replace White Shisa.
```

Feliz 的 Alert 需在 `WHY THIS MATTERS` 補充博愛わいわい Beach、海龜活動區與家人分流情境；未知衛浴仍顯示 `待確認`，不可省略。

---

# 19. Comparison Table

維護一份 persistent comparison table：

| Property | Available | 4-night TWD | Effective TWD | Upgrade | BR | Toilet | Bath | Real Beds | Single Story | Beach | Cancel | Score |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|---:|

每次 Routine：

- 更新價格
- 更新 availability
- 保留 previous price
- 記錄 change
- 不刪歷史紀錄

Feliz 的 `Beach` 欄應清楚標示 `博愛わいわい Beach（步行／海龜活動區附近）`，並在備註或 Card 上顯示 `使用者高興趣`。

---

# 20. Price History

每次成功取得價格，追加：

```json
{
  "property": "",
  "checked_at": "",
  "available": true,
  "price_jpy": null,
  "price_twd": null,
  "plan": "",
  "booking_channel": "",
  "cancellation": ""
}
```

未來可產生：Price trend、Lowest observed price、Highest observed price、First available date、Days since first availability。

---

# 21. Booking Link Requirement

Comparison Table 中每一間住宿都必須有 `Official`、`Booking` 至少一個可直接查房價／訂房的 URL。

如果 Official website 只有介紹頁，另外尋找 Official booking engine、Booking.com、Rakuten、Jalan、Airbnb。不可只存 Google Search URL。

---

# 22. Existing URLs

```text
PRIVATE INGYA
https://private-ingya.com/

Villa Aparagi
https://www.villa-aparagi.com/
https://villa-aparagi.booking.chillnn.com/ja/

Villaze MAEHAMA BEACH
https://villaze.net/maehama/

Villa Capri
https://www.palm-resorts.com/en/villacapri

Feliz Villa Suite Miyakojima Ueno
https://nikken-hotelmgt.co.jp/ueno/

The Villa Miyako
https://the-villa-miyako.jp/
https://www.airbnb.com/rooms/609551935804322533

Hotel ESTRELLAS
https://www.hotelestrellas.com/

Villa OLOO
https://villaoloo.com/guest-room/

White Shisa
https://whiteshisa.com/
```

---

# 23. Update Existing Trip Website

Existing project：

https://hdmer-app.github.io/miyakojima-family-trip-2027/

在原網站增加 `Accommodation Watch` 頁面或 Section。

顯示：

- Current Booking：White Shisa
- Upgrade Candidates：所有 Watch List

每間 Card 顯示：

```text
Availability
4-night price
Upgrade cost
Bedrooms
Beds
Toilets
Bathrooms
Single story
Beach
Cancellation
Score
Last checked
Booking button
```

UNKNOWN 必須明確顯示 `待確認`，不能隱藏。

Feliz Card 額外顯示：

```text
🐢 海龜活動區附近
🏖️ 博愛わいわい Beach 步行玩海
👵 長輩可在 Villa 休息，其他家人步行去海邊
⭐ 使用者高興趣
```

---

# 24. Website Ranking

網站預設排序：

```text
1. Available + High Priority
2. Score
3. Upgrade Cost
4. Availability unknown
5. Unavailable
```

允許切換：

```text
Best Overall
Lowest Price
Most Bathrooms
Best for Elderly
Best Beach
Best Sleeping
```

`Best Beach` 應能凸顯 Feliz 的步行玩海與海龜活動區特色，但整體推薦仍需遵守衛浴與長輩動線的硬條件。

---

# 25. Recommendation Logic

不要因為住宿比較豪華就推薦。推薦必須回答：

> 比 White Shisa 多花多少錢，實際換到什麼？

例如：

```text
PRIVATE INGYA

+ NT$15,500 / 4 nights
+ NT$3,100 / person

Gets:
+1 bedroom
+2 toilets
+2 bathrooms
private pool
better bed configuration

Verdict:
Worth upgrading.
```

或者：

```text
Villa X

+ NT$42,000

Gets:
+1 bathroom
private pool

Verdict:
Not enough improvement for the price.
Keep White Shisa.
```

Feliz 的 `Gets` 可加入「步行至博愛わいわい Beach」「海龜活動區附近」「家人可分流」，但 Toilet／Bathroom 未確認時必須列為風險，不能用生活情境取代硬體查證。

---

# 26. Important Philosophy

這不是找最便宜，也不是找最豪華。目標是：

**找到最值得讓五位家人舒服住四晚，而且值得放棄 White Shisa 的住宿。**

宮古島不大，因此不要過度最佳化地理中心位置。更重視：

```text
Comfort
Bathrooms
Toilets
Beds
Elderly friendliness
Beach lifestyle
Value for money
```

---

# 27. Final Goal

Routine 最終應該能在某一天主動得到：

```text
🔥 BOOKING OPPORTUNITY

Villa Capri 3BR
2027/05/13–05/17

AVAILABLE

5 adults / 4 nights

Effective total:
NT$47,800

White Shisa:
NT$32,676

Difference:
+NT$15,124
= +NT$3,025/person

Upgrade:
2 → 3 bedrooms
1 → 2 toilets
1 → 2 bathrooms
4 real beds → 6 real beds

Free cancellation until:
2027/04/XX

Recommendation:
BOOK / HOLD WITH FREE CANCELLATION

Reason:
The comfort upgrade is substantial relative to the additional cost.
```

這才是整個 Accommodation Watcher 的成功條件。

---

# 28. Implementation Requirement

請不要只回覆設計建議。直接在現有 Miyakojima Family Trip 2027 project 中實作：

1. Accommodation property configuration
2. Price／availability history storage
3. Routine／check workflow
4. Comparison calculation
5. White Shisa benchmark
6. Notification logic
7. Accommodation Watch UI
8. Booking links
9. Last checked timestamp
10. README／maintenance documentation

如果目前無法可靠自動取得某住宿價格，不要 fabricate；標記：

```text
MANUAL_CHECK_REQUIRED
```

並保留官方 Booking URL。Routine 下一次仍繼續嘗試。

如果網站有 CAPTCHA、anti-bot、dynamic booking engine、login requirement，不要嘗試繞過。改用其他合法公開 Booking channel，或標記 manual check。

---

# 29. Acceptance Criteria

完成後必須可以清楚回答：

```text
今天有哪些 Villa 已經開放 2027/05/13–17？

五人四晚各多少錢？

含稅後多少？

是否免費取消？

有幾房？

有幾張正式床？

有幾個 Toilet？

有幾個 Bathroom / Shower？

媽媽是否必須爬樓梯？

海灘是否步行可達？

比 White Shisa 多多少錢？

每人多多少？

多花這筆錢換到什麼？

現在值得換嗎？

訂房連結在哪？
```

對 Feliz 還必須一眼回答：

```text
是否確認靠近博愛わいわい Beach，且步行動線合理？

海龜活動區特色是否已清楚標註，但未被寫成保證目擊？

是否適合「長輩在 Villa 休息，其他家人步行去海邊」？

Toilet 與 Bathroom / Shower 數是否仍標示為待官方確認，或已有可追溯的正式來源？
```

如果這些問題可以在 Accommodation Watch 頁面一眼回答，這個功能才算完成。
