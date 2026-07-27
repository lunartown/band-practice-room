import { CalendarPicker } from './CalendarPicker';
import { BottomSheet } from './BottomSheet';
import type { FilterState } from './FilterSheet';
import { defaultFilters } from './FilterSheet';
import { DURATION_OPTIONS } from './filterOptions';
import { TimeWindowPicker } from './TimeWindowPicker';

interface SearchConditionSheetProps {
  filters: FilterState;
  resultCount: number;
  onClose: () => void;
  onChange: (filters: FilterState) => void;
}

export function SearchConditionSheet({ filters, resultCount, onClose, onChange }: SearchConditionSheetProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  return (
    <BottomSheet
      ariaLabel="예약 조건"
      dimClassName="filter-dim"
      onClose={onClose}
      header={() => (
        <header>
          <h2>예약 조건</h2>
        </header>
      )}
      footer={({ requestClose }) => (
        <footer>
          <button
            className="secondary"
            onClick={() => set({
              dates: defaultFilters.dates,
              timeWindows: defaultFilters.timeWindows,
              minDuration: defaultFilters.minDuration,
            })}
          >
            초기화
          </button>
          <button className="primary" onClick={requestClose}>결과 {resultCount}곳 보기</button>
        </footer>
      )}
    >
      <div className="filter-group">
        <h3>날짜 <span className="filter-hint">여러 날 선택 가능 · 미선택 시 일주일 내</span></h3>
        <CalendarPicker selected={filters.dates} onChange={(dates) => set({ dates })} />
      </div>

      <div className="filter-group">
        <h3>시간대</h3>
        <TimeWindowPicker
          value={filters.timeWindows}
          onChange={(timeWindows) => set({ timeWindows })}
        />
      </div>

      <div className="filter-group">
        <h3>이용시간 <span className="filter-hint">연속 이용 기준</span></h3>
        <div className="filter-chips">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={filters.minDuration === option.value ? 'selected' : ''}
              onClick={() => set({ minDuration: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
