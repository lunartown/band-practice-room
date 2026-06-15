import { useEffect, useMemo, useState } from 'react';
import { getAreas, getSlots, getStudios } from './api/client';
import type { Area, Slot, Studio } from './api/types';
import { SlotRow } from './components/SlotRow';
import { dateLabel } from './lib/date';

interface Filters {
  dateFrom: string;
  dateTo: string;
  areaId?: number;
  studioId?: number;
  timePreset: 'all' | 'afternoon' | 'evening' | 'night';
  includeStale: boolean;
  people: number;
}

const defaultFilters: Filters = {
  dateFrom: '2026-06-15',
  dateTo: '2026-07-14',
  timePreset: 'all',
  includeStale: true,
  people: 2,
};

export function App() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [filters, setFilters] = useState<Filters>(() => readFiltersFromUrl());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAreas().then((response) => setAreas(response.areas)).catch(() => setError('지역 목록을 불러오지 못했습니다'));
  }, []);

  useEffect(() => {
    getStudios(filters.areaId).then((response) => setStudios(response.studios)).catch(() => setError('합주실 목록을 불러오지 못했습니다'));
  }, [filters.areaId]);

  useEffect(() => {
    const query = {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      areaId: filters.areaId,
      studioId: filters.studioId,
    };
    writeFiltersToUrl(filters);
    getSlots(query).then((response) => setSlots(response.slots)).catch(() => setError('예약 가능 시간을 불러오지 못했습니다'));
  }, [filters]);

  const visibleSlots = useMemo(() => {
    return slots
      .filter((slot) => filters.includeStale || slot.freshness !== 'stale')
      .filter((slot) => matchTimePreset(slot, filters.timePreset))
      .filter((slot) => !slot.room.capacityMax || slot.room.capacityMax >= filters.people)
      .sort((a, b) => `${a.date} ${a.startTime} ${a.studio.name}`.localeCompare(`${b.date} ${b.startTime} ${b.studio.name}`));
  }, [filters, slots]);

  const availableSlots = visibleSlots.filter((slot) => slot.status === 'AVAILABLE');
  const staleCount = visibleSlots.filter((slot) => slot.freshness === 'stale').length;
  const groupedSlots = groupByDate(visibleSlots);
  const selectedAreaNames = filters.areaId ? areas.filter((area) => area.id === filters.areaId).map((area) => area.name).join('·') : '홍대·합정·신촌';

  return (
    <main className="app-shell">
      <section className="phone-app" aria-label="예약 가능 시간 검색">
        <header className="top-bar">
          <div>
            <h1>예약 가능 시간</h1>
            <p><span className="fresh-dot fresh" /> 9:24 업데이트</p>
          </div>
        </header>

        <div className="chip-row">
          <button className="chip strong" onClick={() => setIsFilterOpen(true)}>{selectedAreaNames}</button>
          <button className="chip" onClick={() => setIsFilterOpen(true)}>오늘~30일</button>
          <button className="chip" onClick={() => setIsFilterOpen(true)}>{filters.people}명</button>
          <button className="filter-button" onClick={() => setIsFilterOpen(true)}>필터</button>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {staleCount > 0 && (
          <div className="stale-banner">
            <span className="fresh-dot stale-warning" />
            <div>
              <strong>일부 정보가 오래됐어요</strong>
              <span>stale {staleCount}건 포함 · 마지막 동기화 6시간 전</span>
            </div>
            <button onClick={() => setFilters((value) => ({ ...value }))}>새로고침</button>
          </div>
        )}

        <div className="summary-bar">
          <span>빈 시간 <strong>{availableSlots.length}건</strong></span>
          <span>빠른 시간순</span>
        </div>

        <div className="result-list">
          {availableSlots.length === 0 ? (
            <EmptyState setFilters={setFilters} />
          ) : (
            groupedSlots.map(([date, items]) => (
              <section className="date-section" key={date}>
                <div className="date-heading">
                  <span>{dateLabel(date)}</span>
                  <span>{items.filter((slot) => slot.status === 'AVAILABLE').length}개 시간</span>
                </div>
                {items.map((slot) => <SlotRow key={slot.id} slot={slot} />)}
              </section>
            ))
          )}
        </div>

        {isFilterOpen && (
          <FilterSheet
            areas={areas}
            studios={studios}
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

function EmptyState({ setFilters }: { setFilters: React.Dispatch<React.SetStateAction<Filters>> }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">⌕</div>
      <h2>조건에 맞는 빈 시간이 없습니다</h2>
      <p>시간대를 넓히거나 생활권을 추가해보세요</p>
      <div className="empty-actions">
        <button onClick={() => setFilters((value) => ({ ...value, timePreset: 'all' }))}>시간 전체로 보기</button>
        <button onClick={() => setFilters((value) => ({ ...value, areaId: undefined }))}>생활권 전체로 보기</button>
        <button onClick={() => setFilters((value) => ({ ...value, includeStale: true }))}>오래된 정보 포함</button>
      </div>
    </div>
  );
}

function FilterSheet({
  areas,
  studios,
  filters,
  resultCount,
  onClose,
  onChange,
}: {
  areas: Area[];
  studios: Studio[];
  filters: Filters;
  resultCount: number;
  onClose: () => void;
  onChange: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  return (
    <div className="sheet-layer">
      <button className="sheet-dim" aria-label="필터 닫기" onClick={onClose} />
      <section className="filter-sheet">
        <div className="sheet-handle" />
        <header>
          <h2>필터</h2>
          <button onClick={() => onChange(defaultFilters)}>초기화</button>
        </header>
        <div className="sheet-body">
          <FilterGroup title="지역 생활권">
            <button className={!filters.areaId ? 'selected' : ''} onClick={() => onChange((value) => ({ ...value, areaId: undefined, studioId: undefined }))}>전체</button>
            {areas.map((area) => (
              <button key={area.id} className={filters.areaId === area.id ? 'selected' : ''} onClick={() => onChange((value) => ({ ...value, areaId: area.id, studioId: undefined }))}>{area.name}</button>
            ))}
          </FilterGroup>
          <FilterGroup title="날짜 범위">
            <button className="selected">30일</button>
            <button onClick={() => onChange((value) => ({ ...value, dateTo: value.dateFrom }))}>오늘</button>
            <button onClick={() => onChange((value) => ({ ...value, dateTo: '2026-06-21' }))}>7일</button>
          </FilterGroup>
          <FilterGroup title="시간대">
            {[
              ['all', '전체'],
              ['afternoon', '오후'],
              ['evening', '저녁'],
              ['night', '밤'],
            ].map(([value, label]) => (
              <button key={value} className={filters.timePreset === value ? 'selected' : ''} onClick={() => onChange((current) => ({ ...current, timePreset: value as Filters['timePreset'] }))}>{label}</button>
            ))}
          </FilterGroup>
          <FilterGroup title="합주실">
            <button className={!filters.studioId ? 'selected' : ''} onClick={() => onChange((value) => ({ ...value, studioId: undefined }))}>전체</button>
            {studios.map((studio) => (
              <button key={studio.id} className={filters.studioId === studio.id ? 'selected' : ''} onClick={() => onChange((value) => ({ ...value, studioId: studio.id }))}>{studio.name}</button>
            ))}
          </FilterGroup>
          <div className="people-control">
            <span>인원</span>
            <button onClick={() => onChange((value) => ({ ...value, people: Math.max(1, value.people - 1) }))}>-</button>
            <strong>{filters.people}명</strong>
            <button onClick={() => onChange((value) => ({ ...value, people: Math.min(10, value.people + 1) }))}>+</button>
          </div>
          <label className="toggle-row">
            <span>
              <strong>오래된 정보(stale) 포함</strong>
              <small>갱신 6시간 초과 슬롯도 함께 보기</small>
            </span>
            <input type="checkbox" checked={filters.includeStale} onChange={(event) => onChange((value) => ({ ...value, includeStale: event.target.checked }))} />
          </label>
        </div>
        <footer>
          <button className="secondary" onClick={() => onChange(defaultFilters)}>초기화</button>
          <button className="primary" onClick={onClose}>결과 {resultCount}건 보기</button>
        </footer>
      </section>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="filter-group">
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function groupByDate(slots: Slot[]) {
  const map = new Map<string, Slot[]>();
  slots.forEach((slot) => {
    map.set(slot.date, [...(map.get(slot.date) ?? []), slot]);
  });
  return [...map.entries()];
}

function matchTimePreset(slot: Slot, preset: Filters['timePreset']) {
  const hour = Number(slot.startTime.slice(0, 2));
  if (preset === 'afternoon') return hour >= 12 && hour < 18;
  if (preset === 'evening') return hour >= 18 && hour < 22;
  if (preset === 'night') return hour >= 22 || hour < 6;
  return true;
}

function readFiltersFromUrl(): Filters {
  const params = new URLSearchParams(window.location.search);
  return {
    ...defaultFilters,
    dateFrom: params.get('dateFrom') ?? params.get('from') ?? defaultFilters.dateFrom,
    dateTo: params.get('dateTo') ?? params.get('to') ?? defaultFilters.dateTo,
    areaId: numberParam(params.get('areaId')),
    studioId: numberParam(params.get('studioId')),
    timePreset: (params.get('time') as Filters['timePreset']) ?? defaultFilters.timePreset,
    includeStale: params.get('stale') !== 'false',
    people: numberParam(params.get('people')) ?? defaultFilters.people,
  };
}

function writeFiltersToUrl(filters: Filters) {
  const params = new URLSearchParams({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    time: filters.timePreset,
    stale: String(filters.includeStale),
    people: String(filters.people),
  });
  if (filters.areaId) params.set('areaId', String(filters.areaId));
  if (filters.studioId) params.set('studioId', String(filters.studioId));
  window.history.replaceState(null, '', `?${params.toString()}`);
}

function numberParam(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
