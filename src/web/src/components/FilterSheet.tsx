import { useEffect, useState, type CSSProperties } from 'react';
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
  minHourlyPrice: number | null;
  maxHourlyPrice: number | null;
}

export const PRICE_FILTER_MIN = 0;
export const PRICE_FILTER_MAX = 50000;
export const PRICE_FILTER_STEP = 1000;
const PRICE_SNAP_STEP = 10000;
const PRICE_SNAP_THRESHOLD = 1500;

export const defaultFilters: FilterState = {
  areaIds: [],
  studioIds: [],
  dates: [todayKst()],
  timeWindows: [],
  minDuration: 1,
  people: 2,
  minHourlyPrice: null,
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
  const minSliderValue = filters.minHourlyPrice ?? PRICE_FILTER_MIN;
  const maxSliderValue = filters.maxHourlyPrice ?? PRICE_FILTER_MAX;
  const [minInput, setMinInput] = useState(String(minSliderValue));
  const [maxInput, setMaxInput] = useState(String(maxSliderValue));

  useEffect(() => setMinInput(String(minSliderValue)), [minSliderValue]);
  useEffect(() => setMaxInput(String(maxSliderValue)), [maxSliderValue]);

  const setRange = (min: number, max: number) => set({
    minHourlyPrice: min <= PRICE_FILTER_MIN ? null : min,
    maxHourlyPrice: max >= PRICE_FILTER_MAX ? null : max,
  });

  const commitInput = (kind: 'min' | 'max') => {
    const input = kind === 'min' ? minInput : maxInput;
    const fallback = kind === 'min' ? PRICE_FILTER_MIN : PRICE_FILTER_MAX;
    const parsed = input.trim() === '' ? fallback : Number(input.replace(/,/g, ''));
    const clamped = Number.isFinite(parsed)
      ? Math.min(PRICE_FILTER_MAX, Math.max(PRICE_FILTER_MIN, Math.round(parsed)))
      : fallback;
    if (kind === 'min') {
      const next = Math.min(clamped, maxSliderValue);
      setMinInput(String(next));
      setRange(next, maxSliderValue);
    } else {
      const next = Math.max(clamped, minSliderValue);
      setMaxInput(String(next));
      setRange(minSliderValue, next);
    }
  };

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
              minHourlyPrice: defaultFilters.minHourlyPrice,
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
          <span>가격</span>
          <small>1시간당 기준</small>
        </div>

        <div
          className="price-range-slider"
          style={{
            '--price-start': pricePosition(minSliderValue),
            '--price-end': pricePosition(maxSliderValue),
          } as CSSProperties}
        >
          <input
            className="price-range-min"
            type="range"
            min={PRICE_FILTER_MIN}
            max={PRICE_FILTER_MAX}
            step={PRICE_FILTER_STEP}
            value={minSliderValue}
            aria-label="시간당 최저 가격"
            aria-valuetext={`${minSliderValue.toLocaleString('ko-KR')}원`}
            onChange={(event) => {
              const value = Math.min(snapPrice(Number(event.target.value)), maxSliderValue);
              setRange(value, maxSliderValue);
            }}
          />
          <input
            className="price-range-max"
            type="range"
            min={PRICE_FILTER_MIN}
            max={PRICE_FILTER_MAX}
            step={PRICE_FILTER_STEP}
            value={maxSliderValue}
            aria-label="시간당 최고 가격"
            aria-valuetext={`${maxSliderValue.toLocaleString('ko-KR')}원`}
            onChange={(event) => {
              const value = Math.max(snapPrice(Number(event.target.value)), minSliderValue);
              setRange(minSliderValue, value);
            }}
          />
        </div>
        <div className="price-control-scale" aria-hidden>
          <span>0</span>
          <span>1만</span>
          <span>2만</span>
          <span>3만</span>
          <span>4만</span>
          <span>5만+</span>
        </div>

        <div className="price-range-inputs">
          <label>
            <div>
              <input
                type="text"
                inputMode="numeric"
                value={minInput}
                aria-label="최저 가격 직접 입력"
                onChange={(event) => setMinInput(event.target.value.replace(/[^0-9,]/g, ''))}
                onBlur={() => commitInput('min')}
                onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
              />
              <b>원</b>
            </div>
          </label>
          <i aria-hidden>–</i>
          <label>
            <div>
              <input
                type="text"
                inputMode="numeric"
                value={maxInput}
                aria-label="최고 가격 직접 입력"
                onChange={(event) => setMaxInput(event.target.value.replace(/[^0-9,]/g, ''))}
                onBlur={() => commitInput('max')}
                onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
              />
              <b>원</b>
            </div>
          </label>
        </div>
      </div>
    </BottomSheet>
  );
}

function snapPrice(value: number) {
  const mark = Math.round(value / PRICE_SNAP_STEP) * PRICE_SNAP_STEP;
  return Math.abs(value - mark) <= PRICE_SNAP_THRESHOLD ? mark : value;
}

function pricePosition(value: number) {
  const ratio = value / PRICE_FILTER_MAX;
  const percent = ratio * 100;
  const thumbOffset = 13 - 26 * ratio;
  return `calc(${percent}% + ${thumbOffset}px)`;
}
