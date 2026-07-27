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
  maxHourlyPrice: number | null;
}

export const PRICE_FILTER_MIN = 8000;
export const PRICE_FILTER_MAX = 50000;
export const PRICE_FILTER_STEP = 1000;

export const defaultFilters: FilterState = {
  areaIds: [],
  studioIds: [],
  dates: [todayKst()],
  timeWindows: [],
  minDuration: 1,
  people: 2,
  maxHourlyPrice: null,
};

interface FilterSheetProps {
  filters: FilterState;
  resultCount: number;
  onClose: () => void;
  onChange: (f: FilterState) => void;
}

export function FilterSheet({ filters, resultCount, onClose, onChange }: FilterSheetProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });
  const sliderValue = filters.maxHourlyPrice ?? PRICE_FILTER_MAX;
  const priceLabel = filters.maxHourlyPrice == null
    ? '제한 없음'
    : `${filters.maxHourlyPrice.toLocaleString('ko-KR')}원 이하`;

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
            onClick={() => set({
              people: defaultFilters.people,
              maxHourlyPrice: defaultFilters.maxHourlyPrice,
            })}
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

      <div className="price-control">
        <div className="price-control-heading">
          <span>시간당 최대 가격</span>
          <strong>{priceLabel}</strong>
        </div>
        <input
          type="range"
          min={PRICE_FILTER_MIN}
          max={PRICE_FILTER_MAX}
          step={PRICE_FILTER_STEP}
          value={sliderValue}
          aria-label="시간당 최대 가격"
          aria-valuetext={priceLabel}
          style={{ '--price-progress': `${((sliderValue - PRICE_FILTER_MIN) / (PRICE_FILTER_MAX - PRICE_FILTER_MIN)) * 100}%` } as React.CSSProperties}
          onChange={(event) => {
            const value = Number(event.target.value);
            set({ maxHourlyPrice: value === PRICE_FILTER_MAX ? null : value });
          }}
        />
        <div className="price-control-range" aria-hidden>
          <span>{PRICE_FILTER_MIN.toLocaleString('ko-KR')}원</span>
          <span>제한 없음</span>
        </div>
      </div>
    </BottomSheet>
  );
}
