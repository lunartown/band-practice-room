import { useEffect, useMemo, useState } from 'react';
import { getAreas, getSlots } from './api/client';
import type { Area, Slot } from './api/types';
import { StudioRow } from './components/StudioRow';
import { FilterSheet, defaultFilters } from './components/FilterSheet';
import type { FilterState } from './components/FilterSheet';
import { buildAvailability } from './lib/availability';
import { dateLabel } from './lib/date';

export function App() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [responseDates, setResponseDates] = useState<string[]>([]);
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
    })
      .then((r) => {
        setSlots(r.slots);
        setResponseDates(r.dates);
        setUpdatedAt(new Date());
      })
      .catch(() => setError('예약 가능 시간을 불러오지 못했습니다'));
  }, [filters]);

  const dateGroups = useMemo(
    () => buildAvailability(slots, responseDates, filters.minDuration),
    [slots, responseDates, filters.minDuration],
  );

  const totalStudios = dateGroups.reduce((sum, g) => sum + g.studios.length, 0);

  const areaChipLabel = filters.areaIds.length
    ? areas.filter((a) => filters.areaIds.includes(a.id)).map((a) => a.name).join('·')
    : '전체 지역';

  const syncLabel = updatedAt ? formatUpdatedAt(updatedAt) : '–';

  return (
    <main className="app-shell">
      <section className="phone-app" aria-label="예약 가능 시간 검색">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1>예약 가능 시간</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="fresh-dot" />
              <span style={{ fontSize: 11.5, color: '#8b95a1', fontWeight: 500 }}>{syncLabel}</span>
            </div>
          </div>
        </header>

        <div className="chip-row">
          <button className="chip strong" onClick={() => setIsFilterOpen(true)}>연속 {filters.minDuration}시간 ▾</button>
          <button className="chip" onClick={() => setIsFilterOpen(true)}>{buildDateChipLabel(filters.dates)} ▾</button>
          <button className="chip" onClick={() => setIsFilterOpen(true)}>{areaChipLabel} ▾</button>
          <button className="filter-button" aria-label="필터" onClick={() => setIsFilterOpen(true)}>
            <FilterIcon />
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="result-list">
          {totalStudios === 0 ? (
            <EmptyState filters={filters} setFilters={setFilters} />
          ) : (
            dateGroups.map((group) => (
              <section className="date-section" key={group.date}>
                <div className="date-heading">
                  <span>{dateLabel(group.date)}</span>
                  {group.studios.length > 0 ? (
                    <span className="count-pill">{group.studios.length}곳</span>
                  ) : (
                    <span className="count-pill empty">없음</span>
                  )}
                </div>
                {group.studios.length > 0 ? (
                  group.studios.map((studio) => (
                    <StudioRow key={studio.studio.id} studio={studio} />
                  ))
                ) : (
                  <EmptyDay minDuration={filters.minDuration} setFilters={setFilters} />
                )}
              </section>
            ))
          )}
        </div>

        {isFilterOpen && (
          <FilterSheet
            areas={areas}
            filters={filters}
            resultCount={totalStudios}
            onClose={() => setIsFilterOpen(false)}
            onChange={setFilters}
          />
        )}
      </section>
    </main>
  );
}

function EmptyDay({
  minDuration,
  setFilters,
}: {
  minDuration: number;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}) {
  return (
    <div className="empty-day">
      <span>이 날은 연속 {minDuration}시간이 안 돼요</span>
      {minDuration > 1 && (
        <button onClick={() => setFilters((f) => ({ ...f, minDuration: (minDuration - 1) as FilterState['minDuration'] }))}>
          {minDuration - 1}시간으로 보기
        </button>
      )}
    </div>
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
  ].filter((s) => {
    if (s.label === '날짜 초기화' && filters.dates.length === 0) return false;
    if (s.label.startsWith('인원') && filters.people <= 1) return false;
    if (s.label === '시간 제한 해제' && !filters.timeFrom && !filters.timeTo) return false;
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <path d="M3 6h18M6 12h12M10 18h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function buildDateChipLabel(dates: string[]) {
  if (dates.length === 0) return '오늘~7일';
  return `${dates.length}일 선택`;
}

function formatUpdatedAt(date: Date) {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m} 업데이트`;
}
