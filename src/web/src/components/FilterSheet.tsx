import type { TimeWindow } from '../api/types';
import { CalendarPicker } from './CalendarPicker';
import { BottomSheet } from './BottomSheet';

export const DURATION_OPTIONS: { label: string; value: 1 | 2 | 3 | 4 }[] = [
  { label: '1시간', value: 1 },
  { label: '2시간', value: 2 },
  { label: '3시간', value: 3 },
  { label: '4시간', value: 4 },
];

export interface FilterState {
  areaIds: number[];
  studioIds: number[];
  dates: string[];
  timeWindows: TimeWindow[];
  minDuration: 1 | 2 | 3 | 4;
  people: number;
}

export const defaultFilters: FilterState = {
  areaIds: [],
  studioIds: [],
  dates: [],
  timeWindows: [],
  minDuration: 1,
  people: 2,
};

interface FilterSheetProps {
  filters: FilterState;
  resultCount: number;
  onClose: () => void;
  onChange: (f: FilterState) => void;
}

export function FilterSheet({ filters, resultCount, onClose, onChange }: FilterSheetProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  return (
    <BottomSheet
      ariaLabel="필터"
      dimClassName="filter-dim"
      onClose={onClose}
      header={() => (
        <header>
          <h2>필터</h2>
        </header>
      )}
      footer={({ requestClose }) => (
        <footer>
          <button
            className="secondary"
            onClick={() => onChange({ ...defaultFilters, studioIds: filters.studioIds, areaIds: filters.areaIds })}
          >
            초기화
          </button>
          <button className="primary" onClick={requestClose}>결과 {resultCount}곳 보기</button>
        </footer>
      )}
    >
      {/* 날짜 */}
      <div className="filter-group">
        <h3>날짜 <span className="filter-hint">여러 날 선택 가능 · 미선택 시 일주일 내</span></h3>
        <CalendarPicker
          selected={filters.dates}
          onChange={(dates) => set({ dates })}
        />
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
    </BottomSheet>
  );
}
