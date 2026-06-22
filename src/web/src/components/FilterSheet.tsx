import { useRef, useState } from 'react';
import type { Area, TimeWindow } from '../api/types';
import { CalendarPicker } from './CalendarPicker';

const DISMISS_THRESHOLD = 110; // 이 거리 이상 아래로 끌면 닫는다

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
