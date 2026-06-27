import { useEffect, useMemo, useRef, useState } from 'react';
import { getAreas, getSlots, getStudios } from './api/client';
import type { Area, Slot, Studio } from './api/types';
import { SelectedStudioEmptyRow, StudioRow } from './components/StudioRow';
import { FilterSheet, defaultFilters } from './components/FilterSheet';
import type { FilterState } from './components/FilterSheet';
import { CalendarPicker } from './components/CalendarPicker';
import { TimeWindowPicker, timeWindowLabel } from './components/TimeWindowPicker';
import { Popover } from './components/Popover';
import { OpenScreen } from './components/OpenScreen';
import { MenuSheet } from './components/MenuSheet';
import { buildAvailability } from './lib/availability';
import { dateLabel } from './lib/date';
import { loadFilters, saveFilters, markEntered } from './lib/prefs';
import { loadRecentStudioIds, recordRecentStudioSelections } from './lib/recentStudios';
import { useFavorites } from './lib/useFavorites';

type PopoverKind = 'time' | 'date' | 'area';
const POP_WIDTH: Record<PopoverKind, number> = { time: 320, date: 340, area: 220 };
interface PopoverState {
  kind: PopoverKind;
  top: number;
  left: number;
  width: number;
}

interface SelectedStudioEmptyItem {
  studio: Studio;
  areaName: string;
}

export function App() {
  const savedPrefs = useMemo(() => loadFilters(), []);
  const [areas, setAreas] = useState<Area[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [responseDates, setResponseDates] = useState<string[]>([]);
  const [searchSlots, setSearchSlots] = useState<Slot[]>([]);
  const [searchResponseDates, setSearchResponseDates] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(savedPrefs?.filters ?? defaultFilters);
  // 최근(TTL 이내) 방문이면 오픈 화면을 건너뛰고 바로 결과로 진입한다.
  // 오랜만의 방문이면 조건은 복원하되 오픈 화면을 다시 보여준다.
  const [entered, setEntered] = useState(savedPrefs?.fresh ?? false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isStudioSearchOpen, setIsStudioSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [favOnly, setFavOnly] = useState(false);
  const [studioSearchQuery, setStudioSearchQuery] = useState('');
  const [recentStudioIds, setRecentStudioIds] = useState<number[]>(() => loadRecentStudioIds());
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const favorites = useFavorites();
  const [error, setError] = useState<string | null>(null);
  const [areasError, setAreasError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
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

  function loadStudios() {
    getStudios()
      .then((r) => setStudios(r.studios))
      .catch(() => setStudios([]));
  }

  useEffect(() => {
    loadAreas();
    loadStudios();
  }, []);

  useEffect(() => {
    if (!entered) return;
    // 이번 실행에서 진입했음을 기록한다. 같은 세션 안에서의 새로고침은
    // 오픈 화면을 다시 띄우지 않지만, 콜드스타트(앱 재실행/새 탭)면 다시 뜬다.
    markEntered();
    saveFilters(filters);
    setError(null);
    setLoading(true);
    getSlots({
      dates: filters.dates,
      areaIds: filters.areaIds.length ? filters.areaIds : undefined,
      studioId: filters.studioIds.length === 1 ? filters.studioIds[0] : undefined,
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

  useEffect(() => {
    if (!entered || !isStudioSearchOpen) return;
    let canceled = false;
    setSearchLoading(true);
    getSlots({
      dates: filters.dates,
      areaIds: filters.areaIds.length ? filters.areaIds : undefined,
      timeWindows: filters.timeWindows.length ? filters.timeWindows : undefined,
      minDuration: filters.minDuration > 1 ? filters.minDuration : undefined,
      minCapacity: filters.people > 1 ? filters.people : undefined,
    })
      .then((r) => {
        if (canceled) return;
        setSearchSlots(r.slots);
        setSearchResponseDates(r.dates);
      })
      .catch(() => {
        if (canceled) return;
        setSearchSlots([]);
        setSearchResponseDates([]);
      })
      .finally(() => {
        if (!canceled) setSearchLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [
    entered,
    isStudioSearchOpen,
    filters.areaIds,
    filters.dates,
    filters.minDuration,
    filters.people,
    filters.timeWindows,
  ]);

  useEffect(() => {
    if (!entered || isStudioSearchOpen || filters.studioIds.length === 0) return;
    const hasUnrecordedSelection = filters.studioIds.some((studioId) => !recentStudioIds.includes(studioId));
    if (hasUnrecordedSelection) {
      setRecentStudioIds(recordRecentStudioSelections(filters.studioIds));
    }
  }, [entered, filters.studioIds, isStudioSearchOpen, recentStudioIds]);

  function enterWithAreas(areaIds: number[]) {
    setFilters((f) => ({ ...f, areaIds }));
    setEntered(true);
  }

  function openStudioSearch() {
    setPopover(null);
    setIsFilterOpen(false);
    setIsMenuOpen(false);
    setStudioSearchQuery('');
    setRecentStudioIds(loadRecentStudioIds());
    setIsStudioSearchOpen(true);
  }

  function closeStudioSearch() {
    if (filters.studioIds.length > 0) {
      setRecentStudioIds(recordRecentStudioSelections(filters.studioIds));
    }
    setIsStudioSearchOpen(false);
    setStudioSearchQuery('');
  }

  function toggleStudioSelection(studioId: number) {
    setFavOnly(false);
    setFilters((f) => {
      const selected = f.studioIds.includes(studioId);
      return {
        ...f,
        studioIds: selected
          ? f.studioIds.filter((id) => id !== studioId)
          : [...f.studioIds, studioId],
      };
    });
  }

  function removeStudioSelection(studioId: number) {
    setFilters((f) => ({
      ...f,
      studioIds: f.studioIds.filter((id) => id !== studioId),
    }));
  }

  function showAllStudios() {
    setFavOnly(false);
    setFilters((f) => (f.studioIds.length > 0 ? { ...f, studioIds: [] } : f));
    closeStudioSearch();
  }

  function toggleFavoritesFilter() {
    if (favOnly) {
      setFavOnly(false);
      return;
    }
    setFilters((f) => (f.studioIds.length > 0 ? { ...f, studioIds: [] } : f));
    setFavOnly(true);
  }

  const dateGroups = useMemo(
    () => buildAvailability(slots, responseDates, filters.minDuration),
    [slots, responseDates, filters.minDuration],
  );
  const searchDateGroups = useMemo(
    () => buildAvailability(searchSlots, searchResponseDates, filters.minDuration),
    [searchSlots, searchResponseDates, filters.minDuration],
  );

  // 즐겨찾기만 보기: 즐겨찾은 합주실만 남긴다(빈 날도 헤더는 유지해 흐름을 보존).
  const visibleGroups = useMemo(() => {
    if (filters.studioIds.length > 0) {
      const selected = new Set(filters.studioIds);
      return dateGroups.map((g) => ({
        ...g,
        studios: g.studios.filter((s) => selected.has(s.studio.id)),
      }));
    }
    if (!favOnly) return dateGroups;
    return dateGroups.map((g) => ({
      ...g,
      studios: g.studios.filter((s) => favorites.has(s.studio.id)),
    }));
  }, [dateGroups, favOnly, favorites, filters.studioIds]);

  const totalStudios = visibleGroups.reduce((sum, g) => sum + g.studios.length, 0);
  const hasFavorites = favorites.size > 0;

  const areaChipLabel = buildAreaChipLabel(areas, filters.areaIds);
  const areaNameById = useMemo(
    () => new Map(areas.map((area) => [area.id, area.name])),
    [areas],
  );
  const searchableStudios = useMemo(
    () => studios.filter((studio) => studioMatchesAreas(studio, filters.areaIds)),
    [filters.areaIds, studios],
  );
  const selectedStudios = useMemo(
    () =>
      filters.studioIds
        .map((id) => findStudioById(id, studios, slots))
        .filter((studio): studio is Studio => Boolean(studio)),
    [filters.studioIds, slots, studios],
  );
  const visibleStudioIds = useMemo(() => {
    const ids = new Set<number>();
    for (const group of visibleGroups) {
      for (const studio of group.studios) ids.add(studio.studio.id);
    }
    return ids;
  }, [visibleGroups]);
  const selectedStudioEmptyItems = useMemo(
    () =>
      selectedStudios
        .filter((studio) => !visibleStudioIds.has(studio.id))
        .map((studio) => ({
          studio,
          areaName: buildStudioAreaLabel(studio, areaNameById, filters.areaIds),
        })),
    [areaNameById, filters.areaIds, selectedStudios, visibleStudioIds],
  );
  const selectedStudioChips = useMemo(
    () =>
      filters.studioIds.map((id) => {
        const studio = findStudioById(id, studios, slots);
        return { id, label: studio?.name ?? `합주실 ${id}` };
      }),
    [filters.studioIds, slots, studios],
  );
  const selectedStudioSet = useMemo(() => new Set(filters.studioIds), [filters.studioIds]);
  const studioSearchStats = useMemo(() => buildStudioSearchStats(searchDateGroups), [searchDateGroups]);
  const studioSearchSections = useMemo(
    () =>
      buildStudioSearchSections({
        studios: searchableStudios,
        areaNameById,
        areaLabel: filters.areaIds.length > 0 ? areaChipLabel : null,
        favorites,
        query: studioSearchQuery,
        recentStudioIds,
      }),
    [
      areaChipLabel,
      areaNameById,
      favorites,
      filters.areaIds.length,
      recentStudioIds,
      searchableStudios,
      studioSearchQuery,
    ],
  );

  // 기본값에서 바꾼(지정한) 경우만 활성으로 표시한다.
  const timeActive = filters.timeWindows.length > 0;
  const dateActive = filters.dates.length > 0;
  const areaActive = filters.areaIds.length > 0;
  const studioActive = filters.studioIds.length > 0;
  const sheetActive =
    filters.minDuration !== defaultFilters.minDuration || filters.people !== defaultFilters.people;
  const favFilterActive = favOnly;

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
        {isStudioSearchOpen ? (
          <div className="studio-search-screen">
            <header className="studio-search-top">
              <button className="search-back" aria-label="합주실 검색 닫기" onClick={closeStudioSearch}>
                <BackIcon />
              </button>
              <label className="search-field">
                <SearchIcon />
                <input
                  value={studioSearchQuery}
                  onChange={(e) => setStudioSearchQuery(e.target.value)}
                  placeholder="합주실 이름으로 찾기"
                  autoFocus
                />
                {studioSearchQuery && (
                  <button className="search-clear" aria-label="검색어 지우기" onClick={() => setStudioSearchQuery('')}>
                    ×
                  </button>
                )}
              </label>
              <button className="search-cancel" onClick={closeStudioSearch}>완료</button>
            </header>

            {searchLoading && <div className="loading-bar" aria-hidden />}

            <div className="studio-search-results">
              {studioSearchSections.length === 0 ? (
                <div className="studio-search-empty-state">
                  <h2>등록된 합주실을 찾지 못했어요</h2>
                  <p>이름이나 지역을 조금 다르게 입력해보세요</p>
                </div>
              ) : (
                studioSearchSections.map((section) => (
                  <section className="studio-search-section" key={section.title}>
                    <h2>{section.title}</h2>
                    {section.items.map((studio) => (
                      <button
                        key={studio.id}
                        className={`studio-search-row${selectedStudioSet.has(studio.id) ? ' selected' : ''}`}
                        aria-pressed={selectedStudioSet.has(studio.id)}
                        onClick={() => toggleStudioSelection(studio.id)}
                      >
                        <span className="studio-search-row-main">
                          <span className="studio-search-row-name">{studio.name}</span>
                          <span className="studio-search-row-meta">
                            {buildStudioSearchMeta(
                              studio,
                              studioSearchStats.get(studio.id),
                              searchLoading,
                              areaNameById,
                              filters.areaIds,
                            )}
                          </span>
                        </span>
                        {selectedStudioSet.has(studio.id) && <span className="studio-search-selected">✓</span>}
                      </button>
                    ))}
                  </section>
                ))
              )}
            </div>

            <footer className="studio-search-actions">
              <button
                className="studio-search-reset"
                disabled={filters.studioIds.length === 0 && !favOnly}
                onClick={showAllStudios}
              >
                선택 해제
              </button>
              <button
                className="studio-search-apply"
                onClick={filters.studioIds.length > 0 ? closeStudioSearch : showAllStudios}
              >
                {filters.studioIds.length > 0 ? `${filters.studioIds.length}곳 보기` : '전체 합주실 보기'}
              </button>
            </footer>
          </div>
        ) : (
          <>
            <header className="top-bar">
              <div className="top-bar-inner">
                <div className="top-bar-left">
                  <button
                    className="menu-toggle"
                    aria-label="메뉴"
                    aria-haspopup="dialog"
                    onClick={() => setIsMenuOpen(true)}
                  >
                    <MenuIcon />
                  </button>
                  <h1>예약 가능 시간</h1>
                </div>
                <div className="top-bar-right">
                  <div className="sync-status">
                    <span className="fresh-dot" />
                    <span className="sync-label">{syncLabel}</span>
                  </div>
                  <button
                    className={`search-toggle${studioActive ? ' active' : ''}`}
                    aria-pressed={studioActive}
                    aria-label="합주실 찾기"
                    onClick={openStudioSearch}
                  >
                    <SearchIcon />
                  </button>
                  <button
                    className={`fav-toggle${favFilterActive ? ' active' : ''}`}
                    aria-pressed={favFilterActive}
                    aria-label="즐겨찾기만 보기"
                    onClick={toggleFavoritesFilter}
                  >
                    <HeartChipIcon filled={favFilterActive} />
                  </button>
                </div>
              </div>
            </header>

            <div className={`chip-row${studioActive ? ' has-studio-chip' : ''}`}>
              <button className={`chip${timeActive ? ' active' : ''}${popover?.kind === 'time' ? ' open' : ''}`} aria-pressed={timeActive} onClick={(e) => openPopover('time', e)}><span>{timeWindowLabel(filters.timeWindows)}</span><ChevronIcon /></button>
              <button className={`chip${dateActive ? ' active' : ''}${popover?.kind === 'date' ? ' open' : ''}`} aria-pressed={dateActive} onClick={(e) => openPopover('date', e)}><span>{buildDateChipLabel(filters.dates)}</span><ChevronIcon /></button>
              <button className={`chip${areaActive ? ' active' : ''}${popover?.kind === 'area' ? ' open' : ''}`} aria-pressed={areaActive} onClick={(e) => openPopover('area', e)}><span>{areaChipLabel}</span><ChevronIcon /></button>
              <button className={`filter-button${sheetActive ? ' active' : ''}`} aria-pressed={sheetActive} aria-label="필터" onClick={() => setIsFilterOpen(true)}>
                <FilterIcon />
              </button>
            </div>
            {studioActive && (
              <div className="studio-chip-row">
                {selectedStudioChips.map((studio) => (
                  <button
                    key={studio.id}
                    className="chip studio-chip active"
                    aria-label={`${studio.label} 필터 해제`}
                    onClick={() => removeStudioSelection(studio.id)}
                  >
                    <span>{studio.label}</span>
                    <RemoveChipIcon />
                  </button>
                ))}
              </div>
            )}

            {error && <div className="error-banner">{error}</div>}
            {loading && <div className="loading-bar" aria-hidden />}

            <div className={`result-list${loading && (totalStudios > 0 || selectedStudioEmptyItems.length > 0) ? ' is-refreshing' : ''}`}>
              {loading && totalStudios === 0 && selectedStudioEmptyItems.length === 0 ? (
                <SkeletonList />
              ) : favFilterActive && totalStudios === 0 ? (
                <FavoritesEmpty hasFavorites={hasFavorites} onShowAll={() => setFavOnly(false)} />
              ) : (
                <>
                  {selectedStudioEmptyItems.length > 0 && (
                    <SelectedStudioEmptySection items={selectedStudioEmptyItems} onRemove={removeStudioSelection} />
                  )}
                  {totalStudios === 0 && selectedStudioEmptyItems.length === 0 ? (
                    <EmptyState filters={filters} selectedStudios={selectedStudios} setFilters={setFilters} />
                  ) : (
                    totalStudios > 0 &&
                    visibleGroups.map((group) => (
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
                        ) : favFilterActive ? (
                          <div className="empty-day">
                            <span>이 날은 즐겨찾기한 곳이 비어 있어요</span>
                          </div>
                        ) : (
                          <EmptyDay minDuration={filters.minDuration} setFilters={setFilters} />
                        )}
                      </section>
                    ))
                  )}
                </>
              )}
            </div>
          </>
        )}

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

        {!isStudioSearchOpen && isMenuOpen && <MenuSheet onClose={() => setIsMenuOpen(false)} />}
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

function SelectedStudioEmptySection({
  items,
  onRemove,
}: {
  items: SelectedStudioEmptyItem[];
  onRemove: (studioId: number) => void;
}) {
  return (
    <section className="selected-studio-empty-section" aria-label="선택한 합주실 상태">
      <div className="selected-studio-empty-heading">
        <span>선택한 합주실</span>
        <span className="count-pill empty">{items.length}곳 빈 시간 없음</span>
      </div>
      {items.map((item) => (
        <SelectedStudioEmptyRow
          key={item.studio.id}
          studio={item.studio}
          areaName={item.areaName}
          onRemove={onRemove}
        />
      ))}
    </section>
  );
}

function EmptyState({
  filters,
  selectedStudios,
  setFilters,
}: {
  filters: FilterState;
  selectedStudios: Studio[];
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}) {
  const suggestions: { label: string; apply: () => void }[] = [
    { label: '합주실 해제', apply: () => setFilters((f) => ({ ...f, studioIds: [] })) },
    { label: '날짜 초기화', apply: () => setFilters((f) => ({ ...f, dates: [] })) },
    { label: '지역 초기화', apply: () => setFilters((f) => ({ ...f, areaIds: [] })) },
    {
      label: `인원 ${filters.people} → ${Math.max(1, filters.people - 1)}명`,
      apply: () => setFilters((f) => ({ ...f, people: Math.max(1, f.people - 1) })),
    },
    { label: '시간 제한 해제', apply: () => setFilters((f) => ({ ...f, timeWindows: [] })) },
  ].filter((s) => {
    if (s.label === '합주실 해제' && filters.studioIds.length === 0) return false;
    if (s.label === '날짜 초기화' && filters.dates.length === 0) return false;
    if (s.label === '지역 초기화' && filters.areaIds.length === 0) return false;
    if (s.label.startsWith('인원') && filters.people <= 1) return false;
    if (s.label === '시간 제한 해제' && filters.timeWindows.length === 0) return false;
    return true;
  });
  const studioLabel = buildSelectedStudioLabel(selectedStudios, filters.studioIds.length);

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="#adb5bd" strokeWidth="2" />
          <path d="M20 20l-3.8-3.8" stroke="#adb5bd" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h2>{studioLabel ? `${studioLabel}에 빈 시간이 없어요` : '조건에 맞는 빈 시간이 없어요'}</h2>
      <p>
        {studioLabel ? (
          <>카탈로그에는 있지만 지금 조건에 맞는<br />예약 가능 시간이 없어요</>
        ) : (
          <>날짜·인원·시간 조건을 조금만 넓히면<br />예약 가능한 시간이 나올 수 있어요</>
        )}
      </p>
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

function HeartChipIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} style={{ display: 'block' }} aria-hidden>
      <path
        d="M12 20.5l-1.45-1.32C5.4 14.5 2 11.42 2 7.65 2 4.6 4.42 2.2 7.5 2.2c1.74 0 3.41.81 4.5 2.1 1.09-1.29 2.76-2.1 4.5-2.1 3.08 0 5.5 2.4 5.5 5.45 0 3.77-3.4 6.85-8.55 11.53L12 20.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FavoritesEmpty({ hasFavorites, onShowAll }: { hasFavorites: boolean; onShowAll: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 20.5l-1.45-1.32C5.4 14.5 2 11.42 2 7.65 2 4.6 4.42 2.2 7.5 2.2c1.74 0 3.41.81 4.5 2.1 1.09-1.29 2.76-2.1 4.5-2.1 3.08 0 5.5 2.4 5.5 5.45 0 3.77-3.4 6.85-8.55 11.53L12 20.5z"
            stroke="#adb5bd"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2>{hasFavorites ? '즐겨찾기한 곳이 지금은 비어 있어요' : '아직 즐겨찾기한 합주실이 없어요'}</h2>
      <p>
        {hasFavorites ? (
          <>즐겨찾은 합주실 중 이 조건에 맞는 빈 시간이<br />없어요. 날짜·시간을 넓혀보세요</>
        ) : (
          <>합주실 카드의 하트를 누르면 여기에 모여요.<br />자주 가는 곳을 저장해두고 빠르게 확인하세요</>
        )}
      </p>
      <div className="empty-actions">
        <button onClick={onShowAll}>전체 합주실 보기</button>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }} aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <path d="M3 6h18M6 12h12M10 18h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }} aria-hidden>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }} aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.8-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

function RemoveChipIcon() {
  return (
    <svg className="chip-remove" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
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

function findStudioById(studioId: number, studios: Studio[], slots: Slot[]) {
  return studios.find((studio) => studio.id === studioId) ??
    slots.find((slot) => slot.studio.id === studioId)?.studio ??
    null;
}

function buildSelectedStudioLabel(studios: Studio[], selectedCount: number) {
  if (selectedCount === 0) return null;
  if (selectedCount === 1) return studios[0]?.name ?? '지정한 합주실';
  return studios[0]?.name ? `${studios[0].name} 외 ${selectedCount - 1}곳` : `${selectedCount}곳`;
}

function studioMatchesAreas(studio: Studio, areaIds: number[]) {
  if (areaIds.length === 0) return true;
  const studioAreaIds = getStudioAreaIds(studio);
  return areaIds.some((areaId) => studioAreaIds.includes(areaId));
}

function getStudioAreaIds(studio: Studio) {
  if (studio.areaIds?.length) return studio.areaIds;
  return studio.primaryAreaId == null ? [] : [studio.primaryAreaId];
}

function buildStudioAreaNames(studio: Studio, areaNameById: ReadonlyMap<number, string>) {
  const names: string[] = [];
  const seen = new Set<string>();
  const add = (name: string | null | undefined) => {
    const trimmed = name?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    names.push(trimmed);
    seen.add(trimmed);
  };

  add(studio.primaryAreaName);
  if (studio.primaryAreaId != null) add(areaNameById.get(studio.primaryAreaId));
  getStudioAreaIds(studio).forEach((areaId) => add(areaNameById.get(areaId)));

  return names;
}

function buildStudioAreaLabel(
  studio: Studio,
  areaNameById: ReadonlyMap<number, string>,
  preferredAreaIds: number[],
) {
  const studioAreaIds = getStudioAreaIds(studio);
  const studioAreaSet = new Set(studioAreaIds);
  const preferredNames = preferredAreaIds
    .filter((areaId) => studioAreaSet.has(areaId))
    .map((areaId) => areaNameById.get(areaId))
    .filter((name): name is string => Boolean(name));

  if (preferredNames.length > 0) return compactAreaNames(preferredNames);

  const names = buildStudioAreaNames(studio, areaNameById);
  if (names.length > 0) return compactAreaNames(names);

  return studioAreaIds.length > 0 || studio.primaryAreaId != null ? '지역 확인 중' : '지역 미확인';
}

function compactAreaNames(names: string[]) {
  const uniqueNames = [...new Set(names)];
  if (uniqueNames.length === 0) return '지역 미확인';
  if (uniqueNames.length <= 1) return uniqueNames[0];
  return `${uniqueNames[0]} 외 ${uniqueNames.length - 1}`;
}

interface StudioSearchStats {
  slotCount: number;
  dayCount: number;
}

interface StudioSearchSection {
  title: string;
  items: Studio[];
}

function buildStudioSearchStats(groups: ReturnType<typeof buildAvailability>): Map<number, StudioSearchStats> {
  const stats = new Map<number, StudioSearchStats>();
  for (const group of groups) {
    const seenInDate = new Set<number>();
    for (const item of group.studios) {
      const studioId = item.studio.id;
      const current = stats.get(studioId) ?? { slotCount: 0, dayCount: 0 };
      current.slotCount += item.chips.length;
      if (!seenInDate.has(studioId)) {
        current.dayCount += 1;
        seenInDate.add(studioId);
      }
      stats.set(studioId, current);
    }
  }
  return stats;
}

function buildStudioSearchSections({
  studios,
  areaNameById,
  areaLabel,
  favorites,
  query,
  recentStudioIds,
}: {
  studios: Studio[];
  areaNameById: ReadonlyMap<number, string>;
  areaLabel: string | null;
  favorites: ReadonlySet<number>;
  query: string;
  recentStudioIds: number[];
}): StudioSearchSection[] {
  const normalizedQuery = query.trim().toLowerCase();
  const matches = studios
    .filter((studio) => {
      if (!normalizedQuery) return true;
      return studioSearchText(studio, areaNameById).includes(normalizedQuery);
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  if (normalizedQuery) {
    return matches.length ? [{ title: '검색 결과', items: matches }] : [];
  }

  const sections: StudioSearchSection[] = [];
  const matchById = new Map(matches.map((studio) => [studio.id, studio]));
  const recentItems = recentStudioIds
    .map((studioId) => matchById.get(studioId))
    .filter((studio): studio is Studio => Boolean(studio));
  if (recentItems.length > 0) {
    sections.push({ title: '최근 선택', items: recentItems });
  }

  const favoriteItems = matches.filter((studio) => favorites.has(studio.id));
  if (favoriteItems.length > 0) {
    sections.push({ title: '즐겨찾기', items: favoriteItems });
  }

  const otherItems = matches.filter((studio) => !favorites.has(studio.id));
  if (otherItems.length > 0) {
    sections.push({
      title: areaLabel ? `${areaLabel} 합주실` : '전체 합주실',
      items: otherItems,
    });
  }

  return sections;
}

function studioSearchText(studio: Studio, areaNameById: ReadonlyMap<number, string>) {
  return [
    studio.name,
    ...buildStudioAreaNames(studio, areaNameById),
    studio.address,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function buildStudioSearchMeta(
  studio: Studio,
  stats: StudioSearchStats | undefined,
  loading: boolean,
  areaNameById: ReadonlyMap<number, string>,
  preferredAreaIds: number[],
) {
  const area = buildStudioAreaLabel(studio, areaNameById, preferredAreaIds);
  if (loading) return `${area} · 확인 중`;
  if (!stats || stats.slotCount === 0) return `${area} · 현재 조건 빈 시간 없음`;
  const dayLabel = stats.dayCount > 1 ? `${stats.dayCount}일` : '1일';
  return `${area} · 현재 조건 ${dayLabel} ${stats.slotCount}개 구간 가능`;
}

function formatUpdatedAt(date: Date) {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m} 업데이트`;
}
