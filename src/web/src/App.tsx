import { useEffect, useMemo, useState } from 'react';
import { getAreas, getSlots } from './api/client';
import type { Area, Slot } from './api/types';
import { SlotRow } from './components/SlotRow';
import { FilterSheet, defaultFilters } from './components/FilterSheet';
import type { FilterState } from './components/FilterSheet';
import { computeFreshness, dateLabel } from './lib/date';

export function App() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    getAreas()
      .then((r) => setAreas(r.areas))
      .catch(() => setError('지역 목록을 불러오지 못했습니다'));
  }, []);

  useEffect(() => {
    setError(null);
    getSlots({
      dates: filters.dates,
      areaIds: filters.areaIds.length ? filters.areaIds : undefined,
      timeFrom: filters.timeFrom ?? undefined,
      timeTo: filters.timeTo ?? undefined,
      minDuration: filters.minDuration > 1 ? filters.minDuration : undefined,
      minCapacity: filters.people > 1 ? filters.people : undefined,
      includeStale: filters.includeStale || undefined,
    })
      .then((r) => {
        setSlots(r.slots.map((s) => ({ ...s, freshness: s.freshness ?? computeFreshness(s.scrapedAt) })));
        setUpdatedAt(new Date());
      })
      .catch(() => setError('예약 가능 시간을 불러오지 못했습니다'));
  }, [filters]);

  const visibleSlots = useMemo(() => {
    return slots
      .filter((s) => filters.includeStale || s.freshness !== 'stale')
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }, [slots, filters.includeStale]);

  const availableSlots = visibleSlots.filter((s) => s.status === 'AVAILABLE');
  const staleCount = visibleSlots.filter((s) => s.freshness === 'stale').length;
  const groupedByDate = groupByDate(visibleSlots);

  const areaChipLabel = filters.areaIds.length
    ? areas.filter((a) => filters.areaIds.includes(a.id)).map((a) => a.name).join('·')
    : '전체 지역';

  const dateChipLabel = buildDateChipLabel(filters.dates);

  const freshnessClass = staleCount > 0 ? 'aging' : 'fresh';
  const syncLabel = updatedAt ? formatUpdatedAt(updatedAt) : '–';

  return (
    <main className="app-shell">
      <section className="phone-app" aria-label="예약 가능 시간 검색">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1>빈 합주실</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className={`fresh-dot ${freshnessClass}`} />
              <span style={{ fontSize: 11.5, color: '#8b95a1', fontWeight: 500 }}>{syncLabel}</span>
            </div>
          </div>
        </header>

        <div className="chip-row">
          <button className="chip strong" onClick={() => setIsFilterOpen(true)}>{areaChipLabel} ▾</button>
          <button className="chip" onClick={() => setIsFilterOpen(true)}>{dateChipLabel} ▾</button>
          <button className="chip" onClick={() => setIsFilterOpen(true)}>{filters.people}명 ▾</button>
          <button className="filter-button" onClick={() => setIsFilterOpen(true)}>
            <FilterIcon /> 필터
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {staleCount > 0 && !error && (
          <div className="stale-banner">
            <span className="fresh-dot stale-warning" />
            <div>
              <strong>일부 정보가 오래됐어요</strong>
              <span>stale {staleCount}건 포함</span>
            </div>
            <button onClick={() => setFilters((f) => ({ ...f }))}>새로고침</button>
          </div>
        )}

        <div className="summary-bar">
          <span>빈 시간 <strong>{availableSlots.length}건</strong></span>
          <span style={{ color: '#adb5bd', fontSize: 11 }}>빠른 시간순 ▾</span>
        </div>

        <div className="result-list">
          {availableSlots.length === 0 ? (
            <EmptyState filters={filters} setFilters={setFilters} />
          ) : (
            groupedByDate.map(([date, items]) => (
              <section className="date-section" key={date}>
                <div className="date-heading">
                  <span>{dateLabel(date)}</span>
                  <span>{items.filter((s) => s.status === 'AVAILABLE').length}개 시간</span>
                </div>
                {items.map((slot, i) => <SlotRow key={slot.id ?? `${date}-${i}`} slot={slot} />)}
              </section>
            ))
          )}
        </div>

        {isFilterOpen && (
          <FilterSheet
            areas={areas}
            filters={filters}
            resultCount={availableSlots.length}
            onClose={() => setIsFilterOpen(false)}
            onChange={setFilters}
          />
        )}
      </section>
    </main>
  );
}

function EmptyState({ filters, setFilters }: { filters: FilterState; setFilters: React.Dispatch<React.SetStateAction<FilterState>> }) {
  const suggestions: { label: string; apply: () => void }[] = [
    { label: '날짜 초기화', apply: () => setFilters((f) => ({ ...f, dates: [] })) },
    {
      label: `인원 ${filters.people} → ${Math.max(1, filters.people - 1)}명`,
      apply: () => setFilters((f) => ({ ...f, people: Math.max(1, f.people - 1) })),
    },
    { label: '시간 제한 해제', apply: () => setFilters((f) => ({ ...f, timeFrom: null, timeTo: null })) },
    { label: '오래된 정보 포함', apply: () => setFilters((f) => ({ ...f, includeStale: true })) },
  ].filter((s) => {
    if (s.label === '날짜 초기화' && filters.dates.length === 0) return false;
    if (s.label.startsWith('인원') && filters.people <= 1) return false;
    if (s.label === '시간 제한 해제' && !filters.timeFrom && !filters.timeTo) return false;
    if (s.label === '오래된 정보 포함' && filters.includeStale) return false;
    return true;
  });

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="#adb5bd" strokeWidth="2" />
          <path d="M20 20l-3.8-3.8" stroke="#adb5bd" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h2>조건에 맞는 빈 시간이 없어요</h2>
      <p>날짜·인원·시간 조건을 조금만 넓히면<br />예약 가능한 시간이 나올 수 있어요</p>
      {suggestions.length > 0 && (
        <div className="empty-actions">
          {suggestions.map((s) => (
            <button key={s.label} onClick={s.apply}>{s.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
      <path d="M3 6h18M6 12h12M10 18h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function groupByDate(slots: Slot[]) {
  const map = new Map<string, Slot[]>();
  for (const s of slots) {
    const list = map.get(s.date) ?? [];
    list.push(s);
    map.set(s.date, list);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function buildDateChipLabel(dates: string[]) {
  if (dates.length === 0) return '오늘~7일';
  if (dates.length === 1) {
    const d = new Date(`${dates[0]}T00:00:00`);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  const first = new Date(`${dates[0]}T00:00:00`);
  return `${first.getMonth() + 1}/${first.getDate()} 외 ${dates.length - 1}일`;
}

function formatUpdatedAt(date: Date) {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m} 업데이트`;
}
