'use strict';

const fs = require('fs');
const path = require('path');

const STATUS_ORDER = {
  AVAILABLE: 0,
  MANUAL_CHECK_REQUIRED: 3,
  UNKNOWN: 3,
  UNAVAILABLE_OR_NOT_RELEASED: 4,
  UNAVAILABLE: 5,
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function roundTwd(value) {
  return Math.round(value);
}

function convertJpyToTwd(value, rate) {
  return isNumber(value) ? roundTwd(value * rate) : null;
}

function calculateAccommodationTax({ taxable_rate_per_person_per_night_jpy, guests, nights }, policy) {
  if (![taxable_rate_per_person_per_night_jpy, guests, nights].every(isNumber)) return null;
  const capped = Math.min(taxable_rate_per_person_per_night_jpy, policy.maximum_taxable_rate_per_person_per_night_jpy);
  const increment = policy.taxable_rate_round_down_increment_jpy;
  const roundedBase = Math.floor(capped / increment) * increment;
  return Math.round(roundedBase * policy.combined_rate) * guests * nights;
}

function validateConfig(config) {
  if (!config.trip || !Array.isArray(config.properties)) throw new Error('config 缺少 trip 或 properties');
  const ids = new Set();
  for (const property of config.properties) {
    if (!property.id || !property.property_name) throw new Error('每個住宿都需要 id 與 property_name');
    if (ids.has(property.id)) throw new Error(`重複的 property id: ${property.id}`);
    ids.add(property.id);
  }
  if (!ids.has(config.benchmark.property_id)) throw new Error('benchmark property 不存在');
  return ids;
}

function validateObservation(observation, propertyIds, trip) {
  if (!propertyIds.has(observation.property_id)) throw new Error(`未知住宿: ${observation.property_id}`);
  for (const key of ['check_in', 'check_out', 'guests', 'nights', 'availability_status', 'checked_at']) {
    if (observation[key] === undefined || observation[key] === null || observation[key] === '') {
      throw new Error(`${observation.property_id} 缺少 ${key}`);
    }
  }
  if (observation.check_in !== trip.check_in || observation.check_out !== trip.check_out || observation.guests !== trip.guests || observation.nights !== trip.nights) {
    throw new Error(`${observation.property_id} 的日期、人數或晚數不符合固定旅行條件`);
  }
  if (Number.isNaN(Date.parse(observation.checked_at))) throw new Error(`${observation.property_id} checked_at 無效`);
}

function observationKey(observation) {
  return [
    observation.property_id,
    observation.checked_at,
    observation.availability_status,
    observation.final_total_jpy ?? '',
    observation.final_total_twd ?? '',
    observation.room_or_villa_type ?? '',
  ].join('|');
}

function appendObservations(existing, incoming, propertyIds, trip) {
  const keys = new Set(existing.map(observationKey));
  const appended = [];
  for (const observation of incoming) {
    validateObservation(observation, propertyIds, trip);
    const key = observationKey(observation);
    if (keys.has(key)) continue;
    keys.add(key);
    existing.push(observation);
    appended.push(observation);
  }
  existing.sort((a, b) => Date.parse(a.checked_at) - Date.parse(b.checked_at));
  return appended;
}

function groupedObservations(observations) {
  const grouped = new Map();
  for (const observation of observations) {
    if (!grouped.has(observation.property_id)) grouped.set(observation.property_id, []);
    grouped.get(observation.property_id).push(observation);
  }
  for (const history of grouped.values()) history.sort((a, b) => Date.parse(a.checked_at) - Date.parse(b.checked_at));
  return grouped;
}

function resolveDisplayPriceTwd(observation, rate) {
  if (!observation) return null;
  if (isNumber(observation.final_total_twd)) return roundTwd(observation.final_total_twd);
  return convertJpyToTwd(observation.final_total_jpy, rate);
}

function resolveTax(observation, config) {
  if (!observation) return { status: 'UNKNOWN', amount_jpy: null, amount_twd: null, resolved: false };
  const status = observation.tax_status || 'UNKNOWN';
  if (status === 'INCLUDED') return { status, amount_jpy: 0, amount_twd: 0, resolved: true };
  if (status === 'EXCLUDED') {
    let amountJpy = isNumber(observation.accommodation_tax_jpy) ? observation.accommodation_tax_jpy : null;
    if (!isNumber(amountJpy)) amountJpy = calculateAccommodationTax(observation, config.accommodation_tax);
    const amountTwd = isNumber(observation.accommodation_tax_twd)
      ? roundTwd(observation.accommodation_tax_twd)
      : convertJpyToTwd(amountJpy, config.currency.jpy_to_twd);
    return { status, amount_jpy: amountJpy, amount_twd: amountTwd, resolved: isNumber(amountTwd) };
  }
  return { status, amount_jpy: null, amount_twd: null, resolved: false };
}

function resolveEffectiveCost(observation, config) {
  const displayPriceTwd = resolveDisplayPriceTwd(observation, config.currency.jpy_to_twd);
  const tax = resolveTax(observation, config);
  if (!observation || observation.availability_status !== 'AVAILABLE' || !isNumber(displayPriceTwd) || !tax.resolved) {
    return { display_price_twd: displayPriceTwd, tax, effective_cost_twd: null };
  }

  let effective = displayPriceTwd + tax.amount_twd;
  if (observation.rental_car_included === true) {
    const carValueTwd = isNumber(observation.rental_car_value_twd)
      ? observation.rental_car_value_twd
      : convertJpyToTwd(observation.rental_car_value_jpy, config.currency.jpy_to_twd);
    if (!isNumber(carValueTwd)) return { display_price_twd: displayPriceTwd, tax, effective_cost_twd: null };
    effective -= carValueTwd;
  }
  if (isNumber(observation.required_rental_car_cost_twd)) effective += observation.required_rental_car_cost_twd;
  return { display_price_twd: displayPriceTwd, tax, effective_cost_twd: roundTwd(effective) };
}

function scoreToilets(value) {
  if (!isNumber(value)) return 0;
  if (value >= 3) return 15;
  if (value === 2) return 12;
  return 0;
}

function scoreBathrooms(facilities) {
  const value = Math.max(isNumber(facilities.bathrooms) ? facilities.bathrooms : 0, isNumber(facilities.showers) ? facilities.showers : 0);
  if (value >= 3) return 15;
  if (value === 2) return 12;
  if (value === 1) return 3;
  return 0;
}

function scoreElderly(facilities) {
  if (facilities.stairs_required_for_elderly_guest === false && facilities.single_story === true) return 15;
  if (facilities.stairs_required_for_elderly_guest === false) return 10;
  if (facilities.stairs_required_for_elderly_guest === true) return 3;
  return 7;
}

function scoreSleeping(facilities) {
  if (facilities.comfortable_for_5_adults === true && facilities.real_bed_capacity >= 5) return 15;
  if (facilities.real_bed_capacity >= 4 && facilities.futons === 1) return 11;
  if (facilities.real_bed_capacity >= 4 && facilities.sofa_beds >= 1) return 7;
  if (facilities.comfortable_for_5_adults === false) return 3;
  return 0;
}

function scoreBedrooms(value) {
  if (!isNumber(value)) return 0;
  if (value >= 3) return 10;
  if (value === 2) return 7;
  return 0;
}

function scoreKitchenLaundry(facilities) {
  return (facilities.kitchen ? 4 : 0) + (facilities.washer ? 2 : 0) + (facilities.dryer ? 2 : 0) + (facilities.dishwasher ? 2 : 0);
}

function scoreBeach(facilities) {
  if (isNumber(facilities.beach_walk_minutes) && facilities.beach_walk_minutes <= 10) return 10;
  if (facilities.beach_name && facilities.beach_walk_minutes === null && facilities.beach_drive_minutes === null) return 6;
  if (isNumber(facilities.beach_drive_minutes) && facilities.beach_drive_minutes <= 5) return 5;
  return 0;
}

function scorePrice(effectiveCostTwd, benchmarkEffectiveTwd) {
  if (!isNumber(effectiveCostTwd) || !isNumber(benchmarkEffectiveTwd)) return 0;
  const difference = effectiveCostTwd - benchmarkEffectiveTwd;
  if (difference <= 0) return 10;
  if (difference <= 10000) return 8;
  if (difference <= 20000) return 6;
  if (difference <= 30000) return 3;
  return 1;
}

function scoreProperty(facilities, effectiveCostTwd, benchmarkEffectiveTwd) {
  const breakdown = {
    toilets: scoreToilets(facilities.toilets),
    bathrooms_showers: scoreBathrooms(facilities),
    elderly_friendliness: scoreElderly(facilities),
    sleeping_comfort: scoreSleeping(facilities),
    bedrooms: scoreBedrooms(facilities.bedrooms),
    kitchen_laundry: scoreKitchenLaundry(facilities),
    beach_experience: scoreBeach(facilities),
    effective_price: scorePrice(effectiveCostTwd, benchmarkEffectiveTwd),
  };
  return { total: Object.values(breakdown).reduce((sum, value) => sum + value, 0), breakdown };
}

function getCurrentRows(config, observations) {
  const grouped = groupedObservations(observations);
  const benchmarkHistory = grouped.get(config.benchmark.property_id) || [];
  const benchmarkLatest = benchmarkHistory.at(-1) || null;
  const benchmarkFinancial = resolveEffectiveCost(benchmarkLatest, config);
  const benchmarkEffectiveTwd = benchmarkFinancial.effective_cost_twd;
  const benchmarkDisplayTwd = benchmarkFinancial.display_price_twd ?? config.benchmark.original_total_twd;

  return config.properties.map((property) => {
    const history = grouped.get(property.id) || [];
    const observation = history.at(-1) || null;
    const facilities = { ...property.facilities, ...(observation?.facility_overrides || {}) };
    let priority = property.priority;
    if (property.id === 'feliz_ueno_2br' && facilities.toilets >= 2 && Math.max(facilities.bathrooms || 0, facilities.showers || 0) >= 2) priority = 'S';
    const financial = resolveEffectiveCost(observation, config);
    const score = scoreProperty(facilities, financial.effective_cost_twd, benchmarkEffectiveTwd);
    const displayDifferenceTwd = isNumber(financial.display_price_twd)
      ? financial.display_price_twd - benchmarkDisplayTwd
      : null;
    const upgradeCostTwd = isNumber(financial.effective_cost_twd) && isNumber(benchmarkEffectiveTwd)
      ? financial.effective_cost_twd - benchmarkEffectiveTwd
      : null;
    const bathroomsOrShowers = Math.max(facilities.bathrooms || 0, facilities.showers || 0) || null;
    const highPriority = observation?.availability_status === 'AVAILABLE'
      && facilities.toilets >= 2
      && bathroomsOrShowers >= 2
      && facilities.comfortable_for_5_adults === true
      && facilities.stairs_required_for_elderly_guest === false
      && isNumber(upgradeCostTwd)
      && upgradeCostTwd <= 20000;
    return {
      ...property,
      priority,
      facilities,
      observation,
      history_count: history.length,
      availability_status: observation?.availability_status || 'UNKNOWN',
      display_price_twd: financial.display_price_twd,
      accommodation_tax_status: financial.tax.status,
      accommodation_tax_twd: financial.tax.amount_twd,
      effective_cost_twd: financial.effective_cost_twd,
      price_per_person_twd: isNumber(financial.display_price_twd) ? roundTwd(financial.display_price_twd / config.trip.guests) : null,
      effective_price_per_person_twd: isNumber(financial.effective_cost_twd) ? roundTwd(financial.effective_cost_twd / config.trip.guests) : null,
      upgrade_cost_vs_white_shisa_twd: upgradeCostTwd,
      displayed_price_difference_twd: displayDifferenceTwd,
      score: score.total,
      score_breakdown: score.breakdown,
      score_is_provisional: !isNumber(financial.effective_cost_twd)
        || !isNumber(facilities.toilets)
        || !isNumber(bathroomsOrShowers)
        || facilities.stairs_required_for_elderly_guest === null,
      high_priority: highPriority,
    };
  });
}

function detectEvents(config, observations, rows, nowIso) {
  const grouped = groupedObservations(observations);
  const events = [];
  for (const row of rows) {
    const history = grouped.get(row.id) || [];
    const current = history.at(-1);
    const previous = history.length > 1 ? history.at(-2) : null;
    if (!current) continue;

    if (current.availability_status === 'AVAILABLE') {
      if (!previous) events.push({ property_id: row.id, type: 'FIRST_AVAILABLE', detail: current.checked_at });
      else if (previous.availability_status !== 'AVAILABLE') events.push({ property_id: row.id, type: 'AVAILABLE_AGAIN', detail: current.checked_at });

      const currentPrice = resolveDisplayPriceTwd(current, config.currency.jpy_to_twd);
      const previousPrice = resolveDisplayPriceTwd(previous, config.currency.jpy_to_twd);
      if (isNumber(currentPrice) && isNumber(previousPrice) && previousPrice > 0) {
        const drop = (previousPrice - currentPrice) / previousPrice;
        if (drop >= 0.05) events.push({ property_id: row.id, type: 'PRICE_DROP_5_PERCENT', detail: `${previousPrice}->${currentPrice}` });
      }

      if ((row.priority === 'S' || row.priority === 'S/A') && (!previous || previous.availability_status !== 'AVAILABLE')) {
        events.push({ property_id: row.id, type: 'S_CLASS_AVAILABLE', detail: current.checked_at });
      }
      if (row.high_priority) events.push({ property_id: row.id, type: 'HIGH_PRIORITY', detail: `${current.checked_at}:${row.upgrade_cost_vs_white_shisa_twd}` });
    }

    if (current.free_cancellation_deadline) {
      const days = Math.ceil((Date.parse(current.free_cancellation_deadline) - Date.parse(nowIso)) / 86400000);
      if (days >= 0 && days <= 14) events.push({ property_id: row.id, type: 'CANCELLATION_DEADLINE_14_DAYS', detail: current.free_cancellation_deadline });
    }

    if (previous?.facility_overrides || current.facility_overrides) {
      for (const field of ['toilets', 'bathrooms', 'showers', 'stairs_required_for_elderly_guest']) {
        const before = previous?.facility_overrides?.[field];
        const after = current.facility_overrides?.[field];
        if ((before === null || before === undefined) && after !== null && after !== undefined) {
          events.push({ property_id: row.id, type: 'FACILITY_CONFIRMED', detail: `${field}:${after}` });
        }
      }
    }
  }
  return events;
}

function eventKey(event) {
  return `${event.property_id}:${event.type}:${event.detail}`;
}

function filterNewEvents(events, notificationState) {
  const known = new Set(notificationState.notified_event_keys || []);
  return events.filter((event) => !known.has(eventKey(event)));
}

function markEventsNotified(events, notificationState) {
  const known = new Set(notificationState.notified_event_keys || []);
  for (const event of events) known.add(eventKey(event));
  return { notified_event_keys: [...known].sort() };
}

function formatTwd(value) {
  return isNumber(value) ? `NT$${Math.round(value).toLocaleString('zh-TW')}` : '待確認';
}

function formatCount(value, suffix = '') {
  return isNumber(value) ? `${value}${suffix}` : '待確認';
}

function formatBoolean(value, yes = '是', no = '否') {
  if (value === true) return yes;
  if (value === false) return no;
  return '待確認';
}

function statusLabel(status) {
  return {
    AVAILABLE: '🟢 可訂',
    MANUAL_CHECK_REQUIRED: '🟠 需人工查核',
    UNKNOWN: '🟠 待查核',
    UNAVAILABLE_OR_NOT_RELEASED: '⚪ 未釋房或無房',
    UNAVAILABLE: '⚪ 不可訂',
  }[status] || status;
}

function taxStatusLabel(status) {
  return {
    INCLUDED: '已含稅',
    EXCLUDED: '未含稅（已精算）',
    EXCLUDED_AMOUNT_UNKNOWN: '未含稅，金額待確認',
    UNKNOWN: '是否含稅待確認',
  }[status] || status;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    if (a.high_priority !== b.high_priority) return a.high_priority ? -1 : 1;
    const status = (STATUS_ORDER[a.availability_status] ?? 9) - (STATUS_ORDER[b.availability_status] ?? 9);
    if (status !== 0) return status;
    if (a.score !== b.score) return b.score - a.score;
    const upgradeA = isNumber(a.upgrade_cost_vs_white_shisa_twd) ? a.upgrade_cost_vs_white_shisa_twd : Number.POSITIVE_INFINITY;
    const upgradeB = isNumber(b.upgrade_cost_vs_white_shisa_twd) ? b.upgrade_cost_vs_white_shisa_twd : Number.POSITIVE_INFINITY;
    return upgradeA - upgradeB;
  });
}

function buildRecommendation(row) {
  if (row.id === 'white_shisa') return '目前基準；保留原始價，付款前確認取消與完整無階差動線。';
  if (row.availability_status !== 'AVAILABLE') return '先保留追蹤；目前不能據此判定售罄。';
  if (row.high_priority) return '🔥 值得優先保留可免費取消方案。';
  if (!isNumber(row.effective_cost_twd)) return '已可訂；先確認宿泊稅、取消條款與付款時點，再決定是否換房。';
  if (row.upgrade_cost_vs_white_shisa_twd <= 20000 && row.facilities.toilets >= 2 && Math.max(row.facilities.bathrooms || 0, row.facilities.showers || 0) >= 2) {
    return '舒適度提升明顯，價差在門檻內；確認長輩動線後值得升級。';
  }
  return '先比較實際增加的衛浴、床位與有效成本，不因豪華感單獨升級。';
}

function renderFelizTags(row) {
  if (row.id !== 'feliz_ueno_2br') return '';
  return '<div class="watch-tags"><span>🐢 海龜活動區附近（不保證目擊）</span><span>🏖️ 博愛わいわい Beach 步行生活</span><span>👵 家人可分流活動</span><span>⭐ 使用者高興趣</span></div>';
}

function renderCard(row) {
  const f = row.facilities;
  const bath = Math.max(f.bathrooms || 0, f.showers || 0) || null;
  const difference = isNumber(row.upgrade_cost_vs_white_shisa_twd)
    ? formatTwd(row.upgrade_cost_vs_white_shisa_twd)
    : isNumber(row.displayed_price_difference_twd)
      ? `${row.displayed_price_difference_twd >= 0 ? '+' : '−'}${formatTwd(Math.abs(row.displayed_price_difference_twd))}（顯示價差）`
      : '待確認';
  const beach = f.beach_name
    ? `${escapeHtml(f.beach_name)}${isNumber(f.beach_walk_minutes) ? `（步行約 ${f.beach_walk_minutes} 分）` : f.beach_drive_minutes ? `（車程約 ${f.beach_drive_minutes} 分）` : '（動線待確認）'}`
    : '待確認';
  const stairs = f.stairs_required_for_elderly_guest === false ? '不需' : f.stairs_required_for_elderly_guest === true ? '需要' : '待確認';
  const lastChecked = row.observation?.checked_at ? row.observation.checked_at.slice(0, 10) : '尚未查核';
  return `<article class="watch-card${row.high_priority ? ' high-priority' : ''}" data-status="${escapeHtml(row.availability_status)}" data-score="${row.score}">
    <div class="watch-card-head"><div><span class="stay-rank">${escapeHtml(row.priority)}</span><h3>${escapeHtml(row.property_name)}</h3></div><strong class="watch-status">${statusLabel(row.availability_status)}</strong></div>
${renderFelizTags(row)}
    <div class="watch-price"><strong>${formatTwd(row.display_price_twd)}</strong><span>5 人／4 晚顯示價</span></div>
    <dl class="watch-facts">
      <div><dt>Effective</dt><dd>${formatTwd(row.effective_cost_twd)}</dd></div>
      <div><dt>比 White Shisa</dt><dd>${difference}</dd></div>
      <div><dt>Bedroom</dt><dd>${formatCount(f.bedrooms)}</dd></div>
      <div><dt>正式床位容量</dt><dd>${formatCount(f.real_bed_capacity, ' 人')}</dd></div>
      <div><dt>Toilet</dt><dd>${formatCount(f.toilets)}</dd></div>
      <div><dt>Bathroom／Shower</dt><dd>${formatCount(bath)}</dd></div>
      <div><dt>平房</dt><dd>${formatBoolean(f.single_story)}</dd></div>
      <div><dt>長輩必爬樓梯</dt><dd>${stairs}</dd></div>
      <div><dt>海灘</dt><dd>${beach}</dd></div>
      <div><dt>取消</dt><dd>${escapeHtml(row.observation?.cancellation_policy || '待確認')}</dd></div>
      <div><dt>宿泊稅</dt><dd>${escapeHtml(taxStatusLabel(row.accommodation_tax_status))}</dd></div>
      <div><dt>分數</dt><dd>${row.score}/100${row.score_is_provisional ? '（暫定）' : ''}</dd></div>
    </dl>
    <p class="watch-note">${escapeHtml(buildRecommendation(row))}</p>
    <p class="watch-source-note">最後查核 ${lastChecked} · ${escapeHtml(row.observation?.notes || row.notes || '')}</p>
    <div class="stay-actions"><a class="map-button" target="_blank" rel="noreferrer" href="${escapeHtml(row.booking_url)}">查房／訂房</a><a target="_blank" rel="noreferrer" href="${escapeHtml(row.official_url)}">Official</a></div>
  </article>`;
}

function renderHtml(config, rows, events, runRecord) {
  const sorted = sortRows(rows);
  const benchmark = rows.find((row) => row.id === config.benchmark.property_id);
  const alertRows = events.map((event) => rows.find((row) => row.id === event.property_id)).filter(Boolean);
  const uniqueAlerts = [...new Map(alertRows.map((row) => [row.id, row])).values()];
  const alertHtml = uniqueAlerts.length
    ? `<div class="callout watch-alert"><strong>本次有重要變化：</strong>${uniqueAlerts.map((row) => `${escapeHtml(row.property_name)} ${statusLabel(row.availability_status)} ${formatTwd(row.display_price_twd)}`).join('；')}</div>`
    : '<div class="callout"><strong>本次狀態：</strong>NO ACTIONABLE CHANGE；資料仍持續保留與比較。</div>';
  const checkedAt = runRecord.checked_at.slice(0, 10);
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="宮古島 2027 家庭旅行住宿價格、房況、衛浴、床位與長輩友善比較。">
  <title>Accommodation Watch｜宮古島家庭旅行</title>
  <link rel="stylesheet" href="assets/styles.css"><link rel="stylesheet" href="assets/travel.css">
</head>
<body>
  <header class="topbar"><div class="shell topbar-inner">
    <a class="brand" href="index.html"><span class="brand-mark">MMY</span><span>宮古島家庭旅行<br><span class="brand-sub">2027.05.13 — 05.17 · 5 位大人</span></span></a>
    <nav class="nav" aria-label="網站導航"><a href="index.html">旅程總覽</a><a href="roadmap.html">每日行程</a><a href="maps.html">路線地圖</a><a href="rental.html">租車規劃</a><a href="stay.html">住宿比較</a><a href="accommodation-watch.html" aria-current="page">住宿監看</a><a href="food.html">餐飲安排</a><a href="souvenirs.html">特色商店・紀念品</a><a href="research.html">規劃比較</a></nav>
  </div></header>
  <main>
    <section class="shell hero document-hero watch-hero">
      <div><span class="eyebrow">ACCOMMODATION WATCH</span><h1>不是找最豪華，<br>是找最值得換房。</h1><p class="lead">每天快查優先候選、每週一與週四完整掃描。只有房況、價格、取消方案或重要設施真正改變才通知。</p><div class="status-row"><span class="pill current">每日 08:30 快查</span><span class="pill">週一／週四完整掃描</span><span class="pill">5 位成人 · 4 晚</span></div></div>
      <div class="card stay-highlight"><span class="eyebrow">CURRENT BOOKING</span><h3>White Shisa</h3><strong class="price-big">${formatTwd(benchmark?.display_price_twd)}</strong><small>原始 Benchmark ${formatTwd(config.benchmark.original_total_twd)} 永久保留；最新顯示價與宿泊稅狀態分開追蹤。</small></div>
    </section>
    <section class="shell section watch-summary">${alertHtml}
      <div class="callout warning"><p><strong>2027 宿泊稅：</strong>宮古島市＋沖繩縣自 2027/2/1 起合計 2%。訂房頁未明示含稅，或缺少可精算的每人每晚純住宿費時，Effective Cost 一律顯示「待確認」，不拿估值假裝精確。</p></div>
    </section>
    <section class="shell section"><div class="section-header"><span class="eyebrow">LIVE COMPARISON · ${checkedAt}</span><h2>住宿候選比較</h2><p>預設依「可訂＋高優先、分數、有效價差、未知、不可訂」排序。暫定分數表示仍有衛浴、長輩動線或完整成本未知。</p></div><div class="watch-grid">${sorted.map(renderCard).join('\n')}</div></section>
    <section class="shell section"><div class="section-header"><span class="eyebrow">HOW TO READ</span><h2>未知就是待確認，不是零</h2></div><div class="grid grid-3"><article class="card"><h3>房況</h3><p>「未釋房或無房」只代表目前沒有可售結果，不能斷言售罄。</p></article><article class="card"><h3>衛浴</h3><p>Bathroom 不推論成 Toilet；戶外沖沙 Shower 不計為完整 Bathroom。</p></article><article class="card"><h3>價格</h3><p>顯示價與 Effective Cost 分開；稅金、強制費用或租車價值不完整時不計換房價差。</p></article></div></section>
  </main>
  <footer class="footer"><div class="shell">宮古島家庭旅行 · Accommodation Watch · 最後執行 ${checkedAt}</div></footer>
</body></html>`;
}

function buildTextReport(config, rows, events, checkedAt) {
  if (events.length === 0) return 'NO ACTIONABLE CHANGE\n';
  const sections = [];
  const byProperty = new Map();
  for (const event of events) {
    if (!byProperty.has(event.property_id)) byProperty.set(event.property_id, []);
    byProperty.get(event.property_id).push(event);
  }
  const benchmark = rows.find((row) => row.id === config.benchmark.property_id);
  for (const [propertyId, propertyEvents] of byProperty) {
    const row = rows.find((candidate) => candidate.id === propertyId);
    const difference = isNumber(row.upgrade_cost_vs_white_shisa_twd)
      ? formatTwd(row.upgrade_cost_vs_white_shisa_twd)
      : isNumber(row.displayed_price_difference_twd)
        ? `${row.displayed_price_difference_twd >= 0 ? '+' : '−'}${formatTwd(Math.abs(row.displayed_price_difference_twd))}（顯示價差）`
        : '待確認';
    sections.push([
      '🏝️ Miyakojima Accommodation Alert',
      '',
      `Date checked: ${checkedAt.slice(0, 10)}`,
      'Trip: 2027/05/13 → 05/17 · 5 adults / 4 nights',
      '',
      `PROPERTY: ${row.property_name}`,
      `STATUS: ${statusLabel(row.availability_status)}`,
      `PRICE: ${formatTwd(row.display_price_twd)}`,
      `EFFECTIVE: ${formatTwd(row.effective_cost_twd)}`,
      `WHITE SHISA CURRENT: ${formatTwd(benchmark?.display_price_twd)}`,
      `WHITE SHISA ORIGINAL BASELINE: ${formatTwd(config.benchmark.original_total_twd)}`,
      `DIFFERENCE: ${difference}`,
      `EVENTS: ${propertyEvents.map((event) => event.type).join(', ')}`,
      `CANCELLATION: ${row.observation?.cancellation_policy || '待確認'}`,
      `BOOK: ${row.booking_url}`,
      `RECOMMENDATION: ${buildRecommendation(row)}`,
    ].join('\n'));
  }
  return `${sections.join('\n\n---\n\n')}\n`;
}

function runWatcher({ watchDir, mode = 'quick', inputPath = null, now = new Date().toISOString(), consumeNotifications = true }) {
  const configPath = path.join(watchDir, 'config.json');
  const dataDir = path.join(watchDir, 'data');
  const config = readJson(configPath);
  const propertyIds = validateConfig(config);
  const observationsPath = path.join(dataDir, 'observations.json');
  const observations = readJson(observationsPath);
  for (const observation of observations) validateObservation(observation, propertyIds, config.trip);
  let appended = [];
  if (inputPath) {
    const incoming = readJson(inputPath);
    if (!Array.isArray(incoming)) throw new Error('輸入必須是 observation array');
    appended = appendObservations(observations, incoming, propertyIds, config.trip);
    if (appended.length) writeJson(observationsPath, observations);
  }

  const rows = getCurrentRows(config, observations);
  const notificationPath = path.join(dataDir, 'notification-state.json');
  const notificationState = fs.existsSync(notificationPath) ? readJson(notificationPath) : { notified_event_keys: [] };
  const detected = detectEvents(config, observations, rows, now);
  const events = filterNewEvents(detected, notificationState);
  if (consumeNotifications) writeJson(notificationPath, markEventsNotified(events, notificationState));

  const targetIds = config.properties.filter((property) => mode === 'full' || property.quick_watch).map((property) => property.id);
  const runRecord = {
    checked_at: now,
    mode,
    target_property_ids: targetIds,
    observations_appended: appended.length,
    actionable_event_count: events.length,
    result: events.length ? 'ACTIONABLE_CHANGE' : 'NO_ACTIONABLE_CHANGE',
    manual_check_required: rows.filter((row) => targetIds.includes(row.id) && row.availability_status === 'MANUAL_CHECK_REQUIRED').map((row) => row.id),
  };
  writeJson(path.join(dataDir, 'current.json'), rows);
  writeJson(path.join(dataDir, 'price-history.json'), observations.filter((observation) => isNumber(observation.final_total_jpy) || isNumber(observation.final_total_twd)));
  writeJson(path.join(dataDir, 'last-run.json'), runRecord);
  fs.writeFileSync(path.join(watchDir, 'latest-report.txt'), buildTextReport(config, rows, events, now), 'utf8');
  const siteFile = path.join(watchDir, '..', 'site', 'accommodation-watch.html');
  fs.writeFileSync(siteFile, renderHtml(config, rows, events, runRecord), 'utf8');
  return { config, rows, events, runRecord, siteFile };
}

module.exports = {
  appendObservations,
  buildTextReport,
  calculateAccommodationTax,
  detectEvents,
  eventKey,
  getCurrentRows,
  renderHtml,
  resolveEffectiveCost,
  runWatcher,
  scoreProperty,
  sortRows,
  validateConfig,
  validateObservation,
};
