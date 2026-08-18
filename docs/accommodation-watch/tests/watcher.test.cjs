'use strict';

const assert = require('assert/strict');
const {
  appendObservations,
  calculateAccommodationTax,
  detectEvents,
  getCurrentRows,
  resolveEffectiveCost,
  scoreProperty,
  validateObservation,
} = require('../watcher.cjs');

const taxPolicy = {
  combined_rate: 0.02,
  maximum_taxable_rate_per_person_per_night_jpy: 100000,
  taxable_rate_round_down_increment_jpy: 1000,
};

assert.equal(calculateAccommodationTax({
  taxable_rate_per_person_per_night_jpy: 7600,
  guests: 5,
  nights: 4,
}, taxPolicy), 2800, '宿泊稅必須以每人每晚千圓以下捨去後計算');

const config = {
  trip: { check_in: '2027-05-13', check_out: '2027-05-17', guests: 5, nights: 4 },
  budget: { maximum_total_twd: 50000, basis: 'displayed_accommodation_total_twd', hard_limit: true },
  currency: { jpy_to_twd: 0.2 },
  accommodation_tax: taxPolicy,
  benchmark: { property_id: 'baseline', original_total_twd: 30000 },
  properties: [
    {
      id: 'baseline', property_name: 'Baseline', priority: 'BASELINE',
      facilities: { bedrooms: 2, toilets: 1, bathrooms: 1, showers: 1, single_story: true, stairs_required_for_elderly_guest: false, real_bed_capacity: 4, sofa_beds: 1, comfortable_for_5_adults: false, kitchen: true, washer: true, dryer: true },
    },
    {
      id: 'candidate', property_name: 'Candidate', priority: 'A',
      facilities: { bedrooms: 3, toilets: 2, bathrooms: 2, showers: 2, single_story: true, stairs_required_for_elderly_guest: false, real_bed_capacity: 5, comfortable_for_5_adults: true, kitchen: true, washer: true, dryer: true },
    },
    {
      id: 'over_budget', property_name: 'Over Budget', priority: 'S',
      facilities: { bedrooms: 3, toilets: 3, bathrooms: 3, showers: 3, single_story: true, stairs_required_for_elderly_guest: false, real_bed_capacity: 5, comfortable_for_5_adults: true, kitchen: true, washer: true, dryer: true },
    },
  ],
};

const baseObservation = {
  property_id: 'baseline', property_name: 'Baseline', check_in: '2027-05-13', check_out: '2027-05-17', guests: 5, nights: 4,
  availability_status: 'AVAILABLE', final_total_twd: 30000, tax_status: 'INCLUDED', checked_at: '2026-08-12T00:00:00+08:00',
};
const candidateObservation = {
  property_id: 'candidate', property_name: 'Candidate', check_in: '2027-05-13', check_out: '2027-05-17', guests: 5, nights: 4,
  availability_status: 'AVAILABLE', final_total_jpy: 180000, tax_status: 'EXCLUDED', taxable_rate_per_person_per_night_jpy: 9000, checked_at: '2026-08-14T00:00:00+08:00',
};
const overBudgetObservation = {
  property_id: 'over_budget', property_name: 'Over Budget', check_in: '2027-05-13', check_out: '2027-05-17', guests: 5, nights: 4,
  availability_status: 'AVAILABLE', final_total_twd: 60000, tax_status: 'INCLUDED', checked_at: '2026-08-14T00:00:00+08:00',
};

assert.equal(resolveEffectiveCost(candidateObservation, config).effective_cost_twd, 36720, 'Effective Cost 應加入已精算宿泊稅');
assert.equal(resolveEffectiveCost({ ...candidateObservation, tax_status: 'UNKNOWN' }, config).effective_cost_twd, null, '含稅狀態未知時不得捏造 Effective Cost');

const rows = getCurrentRows(config, [baseObservation, candidateObservation, overBudgetObservation]);
const candidate = rows.find((row) => row.id === 'candidate');
const overBudget = rows.find((row) => row.id === 'over_budget');
assert.equal(candidate.upgrade_cost_vs_white_shisa_twd, 6720);
assert.equal(candidate.within_budget, true);
assert.equal(candidate.high_priority, true, '符合衛浴、床位、長輩與價差門檻時應標示 HIGH PRIORITY');
assert.equal(overBudget.within_budget, false);
assert.equal(overBudget.high_priority, false, '超過硬性預算不得標示 HIGH PRIORITY');

const score = scoreProperty(config.properties[1].facilities, 36720, 30000);
assert.equal(score.breakdown.toilets, 12);
assert.equal(score.breakdown.bathrooms_showers, 12);
assert.equal(score.breakdown.elderly_friendliness, 15);
assert.equal(score.breakdown.sleeping_comfort, 15);

const events = detectEvents(config, [baseObservation, candidateObservation, overBudgetObservation], rows, '2026-08-14T00:00:00+08:00');
assert(events.some((event) => event.property_id === 'candidate' && event.type === 'FIRST_AVAILABLE'));
assert(events.some((event) => event.property_id === 'candidate' && event.type === 'HIGH_PRIORITY'));
assert(!events.some((event) => event.property_id === 'over_budget'), '超過硬性預算不得產生通知');

const existing = [baseObservation];
const ids = new Set(['baseline', 'candidate']);
assert.equal(appendObservations(existing, [baseObservation], ids, config.trip).length, 0, '相同 observation 不得重複追加');
assert.throws(() => validateObservation({ ...candidateObservation, check_out: '2027-05-18' }, ids, config.trip), /固定旅行條件/);

console.log('Accommodation watcher tests: PASS');
