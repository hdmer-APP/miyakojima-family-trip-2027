'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..', '..');
const siteDir = path.join(projectRoot, 'docs', 'site');
const watchDir = path.join(projectRoot, 'docs', 'accommodation-watch');
const config = JSON.parse(fs.readFileSync(path.join(watchDir, 'config.json'), 'utf8'));
const observations = JSON.parse(fs.readFileSync(path.join(watchDir, 'data', 'observations.json'), 'utf8'));
const current = JSON.parse(fs.readFileSync(path.join(watchDir, 'data', 'current.json'), 'utf8'));
const watchHtml = fs.readFileSync(path.join(siteDir, 'accommodation-watch.html'), 'utf8');
const standalone = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

assert.equal(current.length, config.properties.length, '每個設定住宿都必須出現在 current comparison');
assert.equal(new Set(config.properties.map((property) => property.id)).size, config.properties.length, '住宿 id 必須唯一');
assert.equal(config.benchmark.original_total_twd, 32676, 'White Shisa original baseline 不得覆寫');
assert(observations.some((observation) => observation.property_id === 'white_shisa' && observation.final_total_twd === 32676), '原始 White Shisa 價格必須保留於歷史');
assert(observations.some((observation) => observation.property_id === 'white_shisa' && observation.final_total_twd === 32563), '最新 White Shisa 顯示價必須保留於歷史');

const feliz = current.find((row) => row.id === 'feliz_ueno_2br');
assert.equal(feliz.facilities.toilets, null, 'Feliz Toilet 未經正式來源確認前必須是 UNKNOWN');
assert.equal(feliz.facilities.bathrooms, null, 'Feliz Bathroom 未經正式來源確認前必須是 UNKNOWN');
assert.equal(feliz.priority, 'A', 'Feliz 衛浴未確認前不得自動升級 S');

for (const property of config.properties) {
  assert(watchHtml.includes(property.property_name), `監看頁缺少 ${property.property_name}`);
  assert(property.official_url.startsWith('https://'), `${property.id} official_url 必須是直接 HTTPS URL`);
  assert(property.booking_url.startsWith('https://'), `${property.id} booking_url 必須是直接 HTTPS URL`);
}

assert(!watchHtml.includes('undefined'));
assert(!watchHtml.includes('NaN'));
assert(standalone.includes('id="accommodation-watch"'), '單頁網站缺少 accommodation-watch section');
assert(standalone.includes('href="#accommodation-watch"'), '單頁網站缺少 accommodation-watch navigation');

const pageFiles = fs.readdirSync(siteDir).filter((name) => name.endsWith('.html'));
for (const pageFile of pageFiles) {
  const html = fs.readFileSync(path.join(siteDir, pageFile), 'utf8');
  for (const match of html.matchAll(/href="([^"#?]+\.html)(?:[?#][^"]*)?"/g)) {
    if (/^[a-z]+:\/\//i.test(match[1])) continue;
    assert(fs.existsSync(path.join(siteDir, match[1])), `${pageFile} 連到不存在的 ${match[1]}`);
  }
}

console.log('Accommodation watch site tests: PASS');
