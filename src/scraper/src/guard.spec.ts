import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isSuspiciousEmptyResult } from './guard.js';

test('직전 성공 이력이 있는데 이번에 0건이면 의심한다', () => {
  assert.equal(isSuspiciousEmptyResult(0, 120), true);
});

test('이번에 슬롯이 있으면 정상이다', () => {
  assert.equal(isSuspiciousEmptyResult(50, 120), false);
  assert.equal(isSuspiciousEmptyResult(50, null), false);
});

test('처음부터 0건(직전 이력 없음/0)이면 막지 않는다', () => {
  assert.equal(isSuspiciousEmptyResult(0, null), false);
  assert.equal(isSuspiciousEmptyResult(0, 0), false);
});
