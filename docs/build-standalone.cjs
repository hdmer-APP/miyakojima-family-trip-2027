'use strict';

const fs = require('fs');
const path = require('path');

const docsDir = __dirname;
const siteDir = path.join(docsDir, 'site');
const rootDir = path.dirname(docsDir);
const siteConfig = JSON.parse(fs.readFileSync(path.join(docsDir, 'docsite.config.json'), 'utf8'));

function read(name) {
  return fs.readFileSync(path.join(siteDir, name), 'utf8');
}

function mainOf(html) {
  const match = html.match(/<main>([\s\S]*?)<\/main>/i);
  if (!match) throw new Error('找不到 <main>');
  return match[1].trim();
}

const pages = [
  ['overview', 'index.html'],
  ['itinerary', 'roadmap.html'],
  ['maps', 'maps.html'],
  ['rental', 'rental.html'],
  ['stay', 'stay.html'],
  ['accommodation-watch', 'accommodation-watch.html'],
  ['food', 'food.html'],
  ['souvenirs', 'souvenirs.html'],
  ['research', 'research.html'],
];

const labels = {
  overview: '旅程總覽', itinerary: '每日行程', maps: '路線地圖',
  rental: '租車規劃', stay: '住宿比較', food: '餐飲安排',
  'accommodation-watch': '住宿監看',
  souvenirs: '特色商店・紀念品', research: '規劃比較',
};

const hrefMap = {
  'index.html': '#overview', 'roadmap.html': '#itinerary', 'maps.html': '#maps',
  'rental.html': '#rental', 'stay.html': '#stay', 'food.html': '#food',
  'accommodation-watch.html': '#accommodation-watch',
  'souvenirs.html': '#souvenirs', 'research.html': '#research',
};

let sections = pages.map(([id, file]) => {
  let body = mainOf(read(file));
  for (const [from, to] of Object.entries(hrefMap)) {
    body = body.replaceAll(`href="${from}"`, `href="${to}"`);
  }
  return `<div id="${id}" class="section-anchor" aria-label="${labels[id]}">${body}</div>`;
}).join('\n');

sections = sections
  .replaceAll('高優先未決議（移植正確性風險）', '出發前必須確認')
  .replaceAll('設計偏差（已拍板，不再重議）', '已確定的規劃原則')
  .replaceAll('Open decisions', 'Before booking')
  .replaceAll('Decided deviations', 'Planning principles');

const baseCss = fs.readFileSync(path.join(siteDir, 'assets', 'styles.css'), 'utf8');
const travelCss = fs.readFileSync(path.join(siteDir, 'assets', 'travel.css'), 'utf8');
const heroBase64 = fs.readFileSync(path.join(siteDir, 'assets', 'miyako-hero.jpg')).toString('base64');
sections = sections.replaceAll('assets/miyako-hero.jpg', `data:image/jpeg;base64,${heroBase64}`);

const nav = pages.map(([id]) => `<a href="#${id}">${labels[id]}</a>`).join('');
const output = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="2027 年 5 月宮古島五天四夜家庭自駕旅行規劃：星宇航班、平房包棟住宿、租車保險、透明獨木舟、燒肉午餐、特色商店與紀念品。">
  <title>2027 宮古島家庭旅行｜5 天 4 夜</title>
  <style>${baseCss}\n${travelCss}</style>
</head>
<body>
  <header class="topbar single-site-nav"><div class="shell topbar-inner">
    <a class="brand" href="#overview"><span class="brand-mark">MMY</span><span>宮古島家庭旅行<br><span class="brand-sub">2027.05.13 — 05.17 · 5 位大人</span></span></a>
    <nav class="nav" aria-label="單頁網站導航">${nav}</nav>
  </div></header>
  <div class="flight-alert"><strong>先別訂不可退方案：</strong>星宇官網尚無 2027 年 5 月適用票價；5/13（四）去、5/17（一）回符合現行基準班次，但仍須等 2027 班表與票價確認。</div>
  <main>${sections}</main>
  <footer class="footer"><div class="shell">宮古島家庭旅行 · 最後查核 ${siteConfig.updated}<br><span class="photo-credit">首頁照片：<a href="https://commons.wikimedia.org/wiki/File:Miyako%27s_best_beach_(51924567535).jpg" target="_blank" rel="noreferrer">Raita Futo／Wikimedia Commons</a>，CC BY 2.0（裁切顯示）</span></div></footer>
  <script>
    const links = [...document.querySelectorAll('.single-site-nav .nav a')];
    const targets = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach(link => link.toggleAttribute('aria-current', link.getAttribute('href') === '#' + visible.target.id));
    }, { rootMargin: '-25% 0px -65% 0px', threshold: [0, .1, .5] });
    targets.forEach(target => observer.observe(target));
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(rootDir, 'index.html'), output);
console.log(`[standalone] 完成 → ${path.join(rootDir, 'index.html')}`);
