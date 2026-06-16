import type { Area } from '../api/types';
import { CalendarPicker } from './CalendarPicker';

const TIME_OPTIONS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00',
];

const TIME_PRESETS = [
  { label: '오전', from: '09:00', to: '12:00' },
  { label: '오후', from: '12:00', to: '18:00' },
  { label: '저녁', from: '18:00', to: '22:00' },
  { label: '밤', from: '22:00', to: '24:00' },
];

const DURATION_OPTIONS: { label: string; value: 1 | 2 | 3 | 4 }[] = [
  { label: '1시간', value: 1 },
  { label: '2시간', value: 2 },
  { label: '3시간', value: 3 },
  { label: '4시간', value: 4 },
];

export interface FilterState {
  areaIds: number[];
  dates: string[];
  timeFrom: string | null;
  timeTo: string | null;
  minDuration: 1 | 2 | 3 | 4;
  people: number;
}

export const defaultFilters: FilterState = {
  areaIds: [],
  dates: [],
  timeFrom: null,
  timeTo: null,
  minDuration: 1,
  people: 2,
};

interface FilterSheetProps {
  areas: Area[];
  filters: FilterState;
  resultCount: number;
  onClose: () => void;
  onChange: (f: FilterState) => void;
}

export function FilterSheet({ areas, filters, resultCount, onClose, onChange }: FilterSheetProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  function toggleArea(id: number) {
    const next = filters.areaIds.includes(id)
      ? filters.areaIds.filter((a) => a !== id)
      : [...filters.areaIds, id];
    set({ areaIds: next });
  }

  function applyTimePreset(from: string, to: string) {
    if (filters.timeFrom === from && filters.timeTo === to) {
      set({ timeFrom: null, timeTo: null });
    } else {
      set({ timeFrom: from, timeTo: to });
    }
  }

  const activePreset = TIME_PRESETS.find(
    (p) => p.from === filters.timeFrom && p.to === filters.timeTo,
  );

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
          {/* 지역 */}
          <div className="filter-group">
            <h3>지역</h3>
            <div className="filter-chips">
              {areas.map((area) => (
                <button
                  key={area.id}
                  className={filters.areaIds.includes(area.id) ? 'selected' : ''}
                  onClick={() => toggleArea(area.id)}
                >
                  {filters.areaIds.includes(area.id) && <span className="check-icon">✓ </span>}
                  {area.name}
                </button>
              ))}
            </div>
          </div>

          {/* 날짜 */}
          <div className="filter-group">
            <h3>날짜 <span className="filter-hint">여러 날 선택 가능 · 미선택 시 7일</span></h3>
            <CalendarPicker
              selected={filters.dates}
              onChange={(dates) => set({ dates })}
            />
          </div>

          {/* 선호 시간대 */}
          <div className="filter-group">
            <h3>선호 시간대</h3>
            <div className="time-range-row">
              <select
                value={filters.timeFrom ?? ''}
                onChange={(e) => set({ timeFrom: e.target.value || null })}
              >
                <option value="">시작 시간</option>
                {TIME_OPTIONS.slice(0, -1).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <span className="time-sep">~</span>
              <select
                value={filters.timeTo ?? ''}
                onChange={(e) => set({ timeTo: e.target.value || null })}
              >
                <option value="">종료 시간</option>
                {TIME_OPTIONS.slice(1).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="preset-chips">
              {TIME_PRESETS.map((p) => (
                <button
                  key={p.label}
                  className={activePreset?.label === p.label ? 'selected' : ''}
                  onClick={() => applyTimePreset(p.from, p.to)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 합주 시간 */}
          <div className="filter-group">
            <h3>합주 시간 <span className="filter-hint">연속</span></h3>
            <div className="filter-chips">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={filters.minDuration === opt.value ? 'selected' : ''}
                  onClick={() => set({ minDuration: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 인원 */}
          <div className="people-control">
            <span>인원</span>
            <button onClick={() => set({ people: Math.max(1, filters.people - 1) })}>−</button>
            <strong>{filters.people}명</strong>
            <button onClick={() => set({ people: Math.min(10, filters.people + 1) })}>+</button>
          </div>

        </div>

        <footer>
          <button className="secondary" onClick={() => onChange(defaultFilters)}>초기화</button>
          <button className="primary" onClick={onClose}>결과 {resultCount}건 보기</button>
        </footer>
      </section>
    </div>
  );
}
