// Tests for the pure returns math helpers
// Run with: npx tsx --test tests/returns.test.ts   (or jest if configured)

import { navOnDate, pctReturn, weekReturn, monthReturn, ytdReturn, categoryAverage } from '../src/lib/returns';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const points = [
  { date: '2024-10-11', nav: 110 },
  { date: '2024-10-04', nav: 105 },
  { date: '2024-09-11', nav: 100 },
  { date: '2024-01-02', nav:  90 },
];

describe('navOnDate', () => {
  it('finds exact date', () => assert.equal(navOnDate(points, '2024-10-11'), 110));
  it('finds closest earlier date', () => assert.equal(navOnDate(points, '2024-10-10'), 105));
  it('returns null before all dates', () => assert.equal(navOnDate(points, '2023-01-01'), null));
});

describe('pctReturn', () => {
  it('computes positive return', () => assert.ok(Math.abs(pctReturn(100, 110)! - 10) < 0.001));
  it('computes negative return', () => assert.ok(Math.abs(pctReturn(110, 100)! - (-9.0909)) < 0.01));
  it('returns null on null input', () => assert.equal(pctReturn(null, 110), null));
  it('returns null on zero start', () => assert.equal(pctReturn(0, 110), null));
});

describe('weekReturn', () => {
  it('computes 7-day return', () => {
    const r = weekReturn(points, '2024-10-11');
    assert.ok(r !== null && Math.abs(r - ((110 - 105) / 105 * 100)) < 0.01);
  });
});

describe('monthReturn', () => {
  it('computes 30-day return', () => {
    const r = monthReturn(points, '2024-10-11');
    assert.ok(r !== null && Math.abs(r - ((110 - 100) / 100 * 100)) < 0.01);
  });
});

describe('ytdReturn', () => {
  it('computes year-to-date return', () => {
    const r = ytdReturn(points, '2024-10-11');
    assert.ok(r !== null && Math.abs(r - ((110 - 90) / 90 * 100)) < 0.01);
  });
});

describe('categoryAverage', () => {
  it('averages valid values', () => assert.ok(Math.abs(categoryAverage([10, 20, 30])! - 20) < 0.001));
  it('ignores nulls', () => assert.ok(Math.abs(categoryAverage([10, null, 30])! - 20) < 0.001));
  it('returns null below minCount', () => assert.equal(categoryAverage([10, null], 3), null));
});
