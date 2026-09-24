import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readEntrySearch } from '../src/lib/entrySearch.js';

const today = '2026-09-24';

test('검색 조건이 없는 URL은 기존 복원 흐름을 유지한다', () => {
  for (const search of ['', '?utm_source=band&internal=1', '?people=&date=bad']) {
    assert.equal(readEntrySearch(search, today), null);
  }
});

test('링크의 전체 조건을 적용하고 중복 ID를 제거한다', () => {
  assert.deepEqual(readEntrySearch(
    '?date=2026-10-03&from=18&to=22&people=5&duration=2'
    + '&areaIds=1,2&areaIds=2&studioIds=3,4&minPrice=10000&maxPrice=30000', today,
  ), {
    dates: ['2026-10-03'], timeWindows: [{ from: '18:00', to: '22:00' }],
    people: 5, minDuration: 2, areaIds: [1, 2], studioIds: [3, 4],
    minHourlyPrice: 10000, maxHourlyPrice: 30000,
  });
});

test('일부 조건만 지정한 링크는 나머지를 기본값으로 시작한다', () => {
  assert.deepEqual(readEntrySearch('?people=5', today), {
    dates: [today], timeWindows: [], people: 5, minDuration: 1,
    areaIds: [], studioIds: [], minHourlyPrice: null, maxHourlyPrice: null,
  });
});

test('한국 날짜 기준 오늘부터 29일 뒤까지 실제로 존재하는 날짜만 허용한다', () => {
  assert.deepEqual(readEntrySearch('?date=2026-10-23', today)?.dates, ['2026-10-23']);
  assert.deepEqual(readEntrySearch(`?date=${today}`, today)?.dates, [today]);
  for (const date of ['2026-09-23', '2026-10-24', '2026-09-31', '2026-9-25']) {
    assert.equal(readEntrySearch(`?date=${date}`, today), null);
  }
  assert.equal(readEntrySearch('?date=2027-02-29', '2027-02-10'), null);
  assert.deepEqual(readEntrySearch('?date=2028-02-29', '2028-02-10')?.dates, ['2028-02-29']);
});

test('정시 범위와 종료 24시를 허용하고 불완전하거나 역전된 범위는 무시한다', () => {
  assert.deepEqual(readEntrySearch('?from=00:00&to=24:00', today)?.timeWindows,
    [{ from: '00:00', to: '24:00' }]);
  for (const search of ['?from=18', '?to=22', '?from=24&to=24', '?from=22&to=18',
    '?from=18&to=18', '?from=18:30&to=22', '?from=-1&to=22']) {
    assert.equal(readEntrySearch(search, today), null);
  }
});

test('유효한 조건은 남기고 잘못된 수치와 날짜는 무시한다', () => {
  const result = readEntrySearch('?people=5&duration=9&date=bad&areaIds=-1,abc,2,2147483648'
    + '&studioIds=1.5&minPrice=Infinity&maxPrice=50001', today);
  assert.equal(result?.people, 5);
  assert.equal(result?.minDuration, 1);
  assert.deepEqual(result?.dates, [today]);
  assert.deepEqual(result?.areaIds, [2]);
  assert.deepEqual(result?.studioIds, []);
  assert.equal(result?.minHourlyPrice, null);
  assert.equal(result?.maxHourlyPrice, null);
  for (const search of ['?people=0', '?people=11', '?people=1.5', '?people=1e1', '?duration=0']) {
    assert.equal(readEntrySearch(search, today), null);
  }
});

test('가격 범위 역전은 무시하고 양끝의 제한 없음 값을 처리한다', () => {
  assert.equal(readEntrySearch('?minPrice=30000&maxPrice=10000', today), null);
  const result = readEntrySearch('?minPrice=0&maxPrice=50000', today);
  assert.equal(result?.minHourlyPrice, null);
  assert.equal(result?.maxHourlyPrice, null);
  assert.equal(readEntrySearch('?maxPrice=20000', today)?.maxHourlyPrice, 20000);
});
