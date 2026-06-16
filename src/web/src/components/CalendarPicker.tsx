import { useState } from 'react';

interface CalendarPickerProps {
  selected: string[];
  onChange: (dates: string[]) => void;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateToYM(date: string) {
  const [y, m] = date.split('-').map(Number);
  return { year: y, month: m };
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export function CalendarPicker({ selected, onChange }: CalendarPickerProps) {
  const today = todayStr();
  const { year: ty, month: tm } = dateToYM(today);

  const [viewYear, setViewYear] = useState(ty);
  const [viewMonth, setViewMonth] = useState(tm);

  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  const maxDate = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 29);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  function cellDate(day: number) {
    return `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function toggle(dateStr: string) {
    if (dateStr < today || dateStr > maxDate) return;
    if (selected.includes(dateStr)) {
      onChange(selected.filter((d) => d !== dateStr));
    } else {
      onChange([...selected, dateStr].sort());
    }
  }

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  }

  const canGoPrev = !(viewYear === ty && viewMonth === tm);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="calendar">
      <div className="calendar-nav">
        <button onClick={prevMonth} disabled={!canGoPrev} aria-label="이전 달">‹</button>
        <span>{viewYear}년 {MONTH_NAMES[viewMonth - 1]}</span>
        <button onClick={nextMonth} aria-label="다음 달">›</button>
      </div>
      <div className="calendar-grid">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className={`cal-header ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const ds = cellDate(day);
          const isPast = ds < today;
          const isFuture = ds > maxDate;
          const disabled = isPast || isFuture;
          const isSelected = selected.includes(ds);
          const isToday = ds === today;
          const dow = (firstDay + day - 1) % 7;
          return (
            <button
              key={day}
              className={[
                'cal-day',
                isSelected ? 'selected' : '',
                isToday && !isSelected ? 'today' : '',
                disabled ? 'disabled' : '',
                dow === 0 ? 'sun' : dow === 6 ? 'sat' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => toggle(ds)}
              disabled={disabled}
            >
              {day}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="cal-chips">
          {selected.map((d) => {
            const dt = new Date(`${d}T00:00:00`);
            const label = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' }).format(dt);
            return (
              <span key={d} className="cal-chip">
                {label}
                <button onClick={() => onChange(selected.filter((x) => x !== d))} aria-label={`${label} 제거`}>×</button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

