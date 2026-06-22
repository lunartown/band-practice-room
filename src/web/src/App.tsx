import { useEffect, useMemo, useRef, useState } from 'react';
import { getAreas, getSlots } from './api/client';
import type { Area, Slot } from './api/types';
import { StudioRow } from './components/StudioRow';
import { FilterSheet, defaultFilters } from './components/FilterSheet';
import type { FilterState } from './components/FilterSheet';
import { CalendarPicker } from './components/CalendarPicker';
import { TimeWindowPicker, timeWindowLabel } from './components/TimeWindowPicker';
import { Popover } from './components/Popover';
import { OpenScreen } from './components/OpenScreen';
import { buildAvailability } from './lib/availability';
import { dateLabel } from './lib/date';
import { loadFilters, saveFilters } from './lib/prefs';

type PopoverKind = 'time' | 'date' | 'area';
const POP_WIDTH: Record<PopoverKind, number> = { time: 320, date: 340, area: 220 };
interface PopoverState {
  kind: PopoverKind;
  top: number;
  left: number;
  width: number;
}

export function App() {
  const savedFilters = useMemo(() => loadFilters(), []);
  const [areas, setAreas] = useState<Area[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [responseDates, setResponseDates] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(savedFilters ?? defaultFilters);
  // 저장된 조건이 있으면 오픈 화면을 건너뛰고 바로 결과로 진입한다.
  const [entered, setEntered] = useState(savedFilters !== null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [areasError, setAreasError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const phoneRef = useRef<HTMLElement>(null);

  function openPopover(kind: PopoverKind, e: React.MouseEvent<HTMLButtonElement>) {
    const phone = phoneRef.current;
    if (!phone) return;
    const a = e.currentTarget.getBoundingClientRect();
    const p = phone.getBoundingClientRect();
    const width = POP_WIDTH[kind];
    const left = Math.max(12, Math.min(a.left - p.left, p.width - width - 12));
    setPopover({ kind, top: a.bottom - p.top + 6, left, width });
  }

  function loadAreas() {
    setAreasError(false);
    getAreas()
      .then((r) => setAreas(r.areas))
      .catch(() => setAreasError(true));
  }

  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    if (!entered) return;
    saveFilters(filters);
    setError(null);
    setLoading(true);
    getSlots({
      dates: filters.dates,
      areaIds: filters.areaIds.length ? filters.areaIds : undefined,
      timeWindows: filters.timeWindows.length ? filters.timeWindows : undefined,
      minDuration: filters.minDuration > 1 ? filters.minDuration : undefined,
      minCapacity: filters.people > 1 ? filters.people : undefined,
    })
      .then((r) => {
        setSlots(r.slots);
        setResponseDates(r.dates);
        setUpdatedAt(new Date());
      })
      .catch(() => setError('예약 가능 시간을 불러오지 못했습니다'))
      .finally(() => setLoading(false));
  }, [filters, entered]);

  function enterWithAreas(areaIds: number[]) {
    setFilters((f) => ({ ...f, areaIds }));
    setEntered(true);
  }

  const dateGroups = useMemo(
    () => buildAvailability(slots, responseDates, filters.minDuration),
    [slots, responseDates, filters.minDuration],
  );

  const totalStudios = dateGroups.reduce((sum, g) => sum + g.studios.length, 0);

  const areaChipLabel = buildAreaChipLabel(areas, filters.areaIds);

  // 기본값에서 바꾼(지정한) 경우만 활성으로 표시한다.
  const timeActive = filters.timeWindows.length > 0;
  const dateActive = filters.dates.length > 0;
  const areaActive = filters.areaIds.length > 0;
  const sheetActive =
    filters.minDuration !== defaultFilters.minDuration || filters.people !== defaultFilters.people;

  const syncLabel = updatedAt ? formatUpdatedAt(updatedAt) : '–';

  if (!entered) {
    return (
      <main className="app-shell">
        <section className="phone-app" aria-label="합주실닷컴">
          <OpenScreen areas={areas} error={areasError} onRetry={loadAreas} onPick={enterWithAreas} />
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="phone-app" aria-label="예약 가능 시간 검색" ref={phoneRef}>
        <header className="top-bar">
          <div className="top-bar-inner">
            <h1>예약 가능 시간</h1>
            <div className="sync-status">
              <span className="fresh-dot" />
              <span className="sync-label">{syncLabel}</span>
            </div>
          </div>
        </header>

        <div className="chip-row">
          <button className={`chip${timeActive ? ' active' : ''}${popover?.kind === 'time' ? ' open' : ''}`} aria-pressed={timeActive} onClick={(e) => openPopover('time', e)}><span>{timeWindowLabel(filters.timeWindows)}</span><ChevronIcon /></button>
          <button className={`chip${dateActive ? ' active' : ''}${popover?.kind === 'date' ? ' open' : ''}`} aria-pressed={dateActive} onClick={(e) => openPopover('date', e)}><span>{buildDateChipLabel(filters.dates)}</span><ChevronIcon /></button>
          <button className={`chip${areaActive ? ' active' : ''}${popover?.kind === 'area' ? ' open' : ''}`} aria-pressed={areaActive} onClick={(e) => openPopover('area', e)}><span>{areaChipLabel}</span><ChevronIcon /></button>
          <button className={`filter-button${sheetActive ? ' active' : ''}`} aria-pressed={sheetActive} aria-label="필터" onClick={() => setIsFilterOpen(true)}>
            <FilterIcon />
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {loading && <div className="loading-bar" aria-hidden />}

        <div className={`result-list${loading && totalStudios > 0 ? ' is-refreshing' : ''}`}>
          {loading && totalStudios === 0 ? (
            <SkeletonList />
          ) : totalStudios === 0 ? (
            <EmptyState filters={filters} setFilters={setFilters} />
          ) : (
            dateGroups.map((group) => (
              <section className="date-section" key={group.date}>
                <div className="date-heading">
                  <span>{dateLabel(group.date)}</span>
                  {group.studios.length > 0 ? (
                    <span className="count-pill">{group.studios.length}곳</span>
                  ) : (
                    <span className="count-pill empty">없음</span>
                  )}
                </div>
                {group.studios.length > 0 ? (
                  group.studios.map((studio) => (
                    <StudioRow key={studio.studio.id} studio={studio} />
                  ))
                ) : (
                  <EmptyDay minDuration={filters.minDuration} setFilters={setFilters} />
                )}
              </section>
            ))
          )}
        </div>

        {popover && (
          <Popover
            top={popover.top}
            left={popover.left}
            width={popover.width}
            className={popover.kind === 'date' || popover.kind === 'time' ? 'padded' : undefined}
            onClose={() => setPopover(null)}
          >
            {popover.kind === 'time' && (
              <TimeWindowPicker
                value={filters.timeWindows}
                onChange={(timeWindows) => setFilters((f) => ({ ...f, timeWindows }))}
              />
            )}

            {popover.kind === 'area' && (
              <>
                <button
                  role="menuitemradio"
                  aria-checked={filters.areaIds.length === 0}
                  className={`popover-option${filters.areaIds.length === 0 ? ' selected' : ''}`}
                  onClick={() => setFilters((f) => ({ ...f, areaIds: [] }))}
                >
                  <span>전체 지역</span>
                  {filters.areaIds.length === 0 && <span className="pop-check">✓</span>}
                </button>
                {areas.map((area) => {
                  const on = filters.areaIds.includes(area.id);
                  return (
                    <button
                      key={area.id}
                      role="menuitemcheckbox"
                      aria-checked={on}
                      className={`popover-option${on ? ' selected' : ''}`}
                      onClick={() =>
                        setFilters((f) => ({
                          ...f,
                          areaIds: on ? f.areaIds.filter((x) => x !== area.id) : [...f.areaIds, area.id],
                        }))
                      }
                    >
                      <span>{area.name}</span>
                      {on && <span className="pop-check">✓</span>}
                    </button>
                  );
                })}
              </>
            )}

            {popover.kind === 'date' && (
              <CalendarPicker
                selected={filters.dates}
                onChange={(dates) => setFilters((f) => ({ ...f, dates }))}
              />
            )}
          </Popover>
        )}

        {isFilterOpen && (
          <FilterSheet
            areas={areas}
            filters={filters}
            resultCount={totalStudios}
            onClose={() => setIsFilterOpen(false)}
            onChange={setFilters}
          />
        )}
      </section>
    </main>
  );
}

function SkeletonList() {
  return (
    <div aria-busy="true" aria-label="불러오는 중">
      {[0, 1].map((g) => (
        <div key={g}>
          <div className="date-heading">
            <span className="skeleton sk-heading" />
          </div>
          {[0, 1, 2].map((r) => (
            <div className="studio-row" key={r}>
              <div className="studio-head">
                <span className="skeleton sk-avatar" />
                <div className="studio-name-area">
                  <span className="skeleton sk-title" />
                  <span className="skeleton sk-sub" />
                </div>
                <span className="skeleton sk-price" />
              </div>
              <div className="studio-chips">
                <span className="skeleton sk-chip" />
                <span className="skeleton sk-chip" />
                <span className="skeleton sk-chip" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyDay({
  minDuration,
  setFilters,
}: {
  minDuration: number;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}) {
  return (
    <div className="empty-day">
      <span>이 날은 연속 {minDuration}시간이 안 돼요</span>
      {minDuration > 1 && (
        <button onClick={() => setFilters((f) => ({ ...f, minDuration: (minDuration - 1) as FilterState['minDuration'] }))}>
          {minDuration - 1}시간으로 보기
        </button>
      )}
    </div>
  );
}

function EmptyState({ filters, setFilters }: { filters: FilterState; setFilters: React.Dispatch<React.SetStateAction<FilterState>> }) {
  const suggestions: { label: string; apply: () => void }[] = [
    { label: '날짜 초기화', apply: () => setFilters((f) => ({ ...f, dates: [] })) },
    {
      label: `인원 ${filters.people} → ${Math.max(1, filters.people - 1)}명`,
      apply: () => setFilters((f) => ({ ...f, people: Math.max(1, f.people - 1) })),
    },
    { label: '시간 제한 해제', apply: () => setFilters((f) => ({ ...f, timeWindows: [] })) },
  ].filter((s) => {
    if (s.label === '날짜 초기화' && filters.dates.length === 0) return false;
    if (s.label.startsWith('인원') && filters.people <= 1) return false;
    if (s.label === '시간 제한 해제' && filters.timeWindows.length === 0) return false;
    return true;
  });

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="#adb5bd" strokeWidth="2" />
          <path d="M20 20l-3.8-3.8" stroke="#adb5bd" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h2>조건에 맞는 빈 시간이 없어요</h2>
      <p>날짜·인원·시간 조건을 조금만 넓히면<br />예약 가능한 시간이 나올 수 있어요</p>
      {suggestions.length > 0 && (
        <div className="empty-actions">
          {suggestions.map((s) => (
            <button key={s.label} onClick={s.apply}>{s.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <path d="M3 6h18M6 12h12M10 18h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="chip-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function buildDateChipLabel(dates: string[]) {
  if (dates.length === 0) return '일주일 내';
  return `${dates.length}일 선택`;
}

// 선택한 지역을 모두 이어 붙이면 칩이 길어져 옆의 필터 버튼을 밀어낸다.
// 1곳은 이름 그대로, 2곳부터는 "첫 지역 외 N" 으로 묶어 칩 길이를 고정한다.
function buildAreaChipLabel(areas: Area[], areaIds: number[]) {
  if (areaIds.length === 0) return '전체 지역';
  const selected = areas.filter((a) => areaIds.includes(a.id));
  if (selected.length <= 1) return selected[0]?.name ?? '전체 지역';
  return `${selected[0].name} 외 ${selected.length - 1}`;
}

function formatUpdatedAt(date: Date) {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m} 업데이트`;
}
