import { useRef, useState } from 'react';
import type { Area, TimeWindow } from '../api/types';
import { CalendarPicker } from './CalendarPicker';

const DISMISS_THRESHOLD = 110; // 이 거리 이상 아래로 끌면 닫는다

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

export const DURATION_OPTIONS: { label: string; value: 1 | 2 | 3 | 4 }[] = [
  { label: '1시간', value: 1 },
  { label: '2시간', value: 2 },
  { label: '3시간', value: 3 },
  { label: '4시간', value: 4 },
];

export interface FilterState {
  areaIds: number[];
  dates: string[];
  timeWindows: TimeWindow[];
  minDuration: 1 | 2 | 3 | 4;
  people: number;
}

export const defaultFilters: FilterState = {
  areaIds: [],
  dates: [],
  timeWindows: [],
  minDuration: 2,
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

  // 각 밴드는 독립된 시간 윈도우. 떨어진 밴드(오전+밤)도 각각 윈도우로 유지된다.
  function isBandActive(band: (typeof TIME_PRESETS)[number]) {
    return filters.timeWindows.some((w) => w.from === band.from && w.to === band.to);
  }

  function toggleBand(band: (typeof TIME_PRESETS)[number]) {
    const exists = isBandActive(band);
    const next = exists
      ? filters.timeWindows.filter((w) => !(w.from === band.from && w.to === band.to))
      : [...filters.timeWindows, { from: band.from, to: band.to }];
    set({ timeWindows: next });
  }

  // 수동 시간 선택: 윈도우가 정확히 하나일 때만 드롭다운에 반영하고, 바꾸면 단일 커스텀 윈도우로 대체한다.
  const single = filters.timeWindows.length === 1 ? filters.timeWindows[0] : null;
  const fromVal = single?.from ?? '';
  const toVal = single?.to ?? '';

  function setManual(part: 'from' | 'to', value: string) {
    const from = part === 'from' ? value : single?.from ?? '';
    const to = part === 'to' ? value : single?.to ?? '';
    if (!from && !to) {
      set({ timeWindows: [] });
      return;
    }
    if (from && to && from >= to) return; // 역전 방지 (UI에서도 차단)
    set({ timeWindows: [{ from: from || '00:00', to: to || '24:00' }] });
  }

  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  function onDragStart(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return; // 초기화 버튼 탭은 드래그로 보지 않음
    startY.current = e.clientY;
    setDragging(true);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }

  function onDragMove(e: React.PointerEvent) {
    if (!dragging) return;
    setDragY(Math.max(0, e.clientY - startY.current));
  }

  function onDragEnd() {
    if (!dragging) return;
    setDragging(false);
    if (dragY > DISMISS_THRESHOLD) onClose();
    else setDragY(0);
  }

  return (
    <div className="sheet-layer">
      <button className="sheet-dim" aria-label="필터 닫기" onClick={onClose} />
      <section
        className="filter-sheet"
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : 'transform 0.25s ease',
        }}
      >
        <div
          className="sheet-drag"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div className="sheet-handle" />
          <header>
            <h2>필터</h2>
          </header>
        </div>

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
            <h3>날짜 <span className="filter-hint">여러 날 선택 가능 · 미선택 시 일주일 내</span></h3>
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
                value={fromVal}
                onChange={(e) => setManual('from', e.target.value)}
              >
                <option value="">시작 시간</option>
                {TIME_OPTIONS.slice(0, -1).map((t) => (
                  <option key={t} value={t} disabled={!!toVal && t >= toVal}>{t}</option>
                ))}
              </select>
              <span className="time-sep">~</span>
              <select
                value={toVal}
                onChange={(e) => setManual('to', e.target.value)}
              >
                <option value="">종료 시간</option>
                {TIME_OPTIONS.slice(1).map((t) => (
                  <option key={t} value={t} disabled={!!fromVal && t <= fromVal}>{t}</option>
                ))}
              </select>
            </div>
            <div className="preset-chips">
              {TIME_PRESETS.map((p) => (
                <button
                  key={p.label}
                  className={isBandActive(p) ? 'selected' : ''}
                  onClick={() => toggleBand(p)}
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
          <button className="primary" onClick={onClose}>결과 {resultCount}곳 보기</button>
        </footer>
      </section>
    </div>
  );
}
