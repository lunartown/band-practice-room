import type { TimeWindow } from '../api/types';
import { BottomSheet } from './BottomSheet';
import { todayKst } from '../lib/date';

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
  dates: [todayKst()],
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
            onClick={() => set({ people: defaultFilters.people })}
          >
            초기화
          </button>
          <button className="primary" onClick={requestClose}>결과 {resultCount}곳 보기</button>
        </footer>
      )}
    >
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
