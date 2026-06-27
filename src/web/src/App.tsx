import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAreas, getSlots, getStudios } from './api/client';
import type { Area, Slot, SlotsQuery, Studio } from './api/types';
import { SelectedStudioEmptyRow, StudioRow } from './components/StudioRow';
import { FilterSheet, defaultFilters } from './components/FilterSheet';
import type { FilterState } from './components/FilterSheet';
import { CalendarPicker } from './components/CalendarPicker';
import { TimeWindowPicker, timeWindowLabel } from './components/TimeWindowPicker';
import { Popover } from './components/Popover';
import { OpenScreen } from './components/OpenScreen';
import { MenuSheet } from './components/MenuSheet';
import { AlertConfirmSheet } from './components/AlertConfirmSheet';
import { AlertsScreen } from './components/AlertsScreen';
import {
  createAlertFromDraft,
  deleteAlert,
  loadAlerts,
  updateAlert,
  upsertAlert,
} from './lib/alerts';
import type { AlertDraft, SavedAlert } from './lib/alerts';
import { buildAvailability, sortDateAvailabilityGroups } from './lib/availability';
import type { StudioSortOption } from './lib/availability';
import { dateLabel } from './lib/date';
import { loadFilters, saveFilters, markEntered } from './lib/prefs';
import { loadRecentStudioIds, recordRecentStudioSelections } from './lib/recentStudios';
import {
  buildAreaChipLabel,
  buildSelectedStudioChips,
  buildSelectedStudioEmptyItems,
  buildSelectedStudioLabel,
  buildSelectedStudios,
  buildStudioSearchMeta,
  buildStudioSearchSections,
  buildStudioSearchStats,
  buildVisibleGroups,
  filterStudiosByAreas,
} from './lib/studioSearch';
import { useFavorites } from './lib/useFavorites';

type PopoverKind = 'time' | 'date' | 'area' | 'sort';
const POP_WIDTH: Record<PopoverKind, number> = { time: 320, date: 340, area: 220, sort: 180 };
const SORT_OPTIONS: { value: StudioSortOption; label: string }[] = [
  { value: 'popular', label: '인기순' },
  { value: 'name_asc', label: '이름순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
];
interface PopoverState {
  kind: PopoverKind;
  top: number;
  left: number;
  width: number;
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
  // 같은 실행 세션에서 최근(TTL 이내) 방문한 경우에만 조건을 복원하고 결과로 바로 진입한다.
  // 콜드스타트나 오랜만의 방문은 오픈 화면 + 기본 필터로 다시 시작한다.
  const [entered, setEntered] = useState(savedPrefs?.fresh ?? false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isStudioSearchOpen, setIsStudioSearchOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [alertDraft, setAlertDraft] = useState<AlertDraft | null>(null);
  const [alerts, setAlerts] = useState<SavedAlert[]>(() => loadAlerts());
  const [favOnly, setFavOnly] = useState(false);
  const [sortOption, setSortOption] = useState<StudioSortOption>('popular');
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(() => new Set());
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

  const rememberRecentStudioSelections = useCallback((studioIds: number[]) => {
    if (studioIds.length > 0) {
      setRecentStudioIds(recordRecentStudioSelections(studioIds));
    }
  }, []);

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
    let canceled = false;
    // 이번 실행에서 진입했음을 기록한다. 같은 세션 안에서의 새로고침은
    // 조건을 복원하지만, 콜드스타트(앱 재실행/새 탭)면 기본 필터로 다시 시작한다.
    markEntered();
    saveFilters(filters);
    setError(null);
    setLoading(true);
    getSlots(buildSlotsQuery(filters, { includeSelectedStudio: true }))
      .then((r) => {
        if (canceled) return;
        setSlots(r.slots);
        setResponseDates(r.dates);
        setUpdatedAt(new Date());
      })
      .catch(() => {
        if (!canceled) setError('예약 가능 시간을 불러오지 못했습니다');
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [filters, entered]);

  useEffect(() => {
    if (!entered || !isStudioSearchOpen) return;
    let canceled = false;
    setSearchLoading(true);
    getSlots(buildSlotsQuery(filters, { includeSelectedStudio: false }))
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
      rememberRecentStudioSelections(filters.studioIds);
    }
  }, [entered, filters.studioIds, isStudioSearchOpen, recentStudioIds, rememberRecentStudioSelections]);

  function enterWithAreas(areaIds: number[]) {
    setFilters((f) => ({ ...f, areaIds }));
    setEntered(true);
  }

  function openStudioSearch() {
    setPopover(null);
    setIsFilterOpen(false);
    setIsMenuOpen(false);
    setIsAlertsOpen(false);
    setStudioSearchQuery('');
    setRecentStudioIds(loadRecentStudioIds());
    setIsStudioSearchOpen(true);
  }

  function openAlertsScreen() {
    setPopover(null);
    setIsFilterOpen(false);
    setIsMenuOpen(false);
    setIsStudioSearchOpen(false);
    setAlertDraft(null);
    setIsAlertsOpen(true);
  }

  function confirmAlertDraft() {
    if (!alertDraft) return;
    const alert = createAlertFromDraft(alertDraft, filters);
    setAlerts((current) => upsertAlert(current, alert));
    setAlertDraft(null);
  }

  function updateSavedAlert(alert: SavedAlert) {
    setAlerts((current) => updateAlert(current, alert));
  }

  function deleteSavedAlert(alertId: string) {
    setAlerts((current) => deleteAlert(current, alertId));
  }

  function closeStudioSearch({ rememberSelection = true }: { rememberSelection?: boolean } = {}) {
    if (rememberSelection) rememberRecentStudioSelections(filters.studioIds);
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
    closeStudioSearch({ rememberSelection: false });
  }

  function toggleFavoritesFilter() {
    if (favOnly) {
      setFavOnly(false);
      return;
    }
    setFilters((f) => (f.studioIds.length > 0 ? { ...f, studioIds: [] } : f));
    setFavOnly(true);
  }

  function toggleDateSection(date: string) {
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  function openAlertDraft(draft: AlertDraft) {
    setPopover(null);
    setIsFilterOpen(false);
    setIsMenuOpen(false);
    setAlertDraft(draft);
  }

  function openStudioAlert(studio: Studio, date: string) {
    openAlertDraft({ scope: 'studios', studios: [studio], dates: [date] });
  }

  function openCurrentConditionAlert(date: string) {
    if (filters.studioIds.length > 0 && selectedStudios.length > 0) {
      openAlertDraft({ scope: 'studios', studios: selectedStudios, dates: [date] });
      return;
    }
    openAlertDraft({ scope: 'search', dates: [date] });
  }

  const dateGroups = useMemo(
    () => buildAvailability(slots, responseDates, filters.minDuration),
    [slots, responseDates, filters.minDuration],
  );
  const searchDateGroups = useMemo(
    () => buildAvailability(searchSlots, searchResponseDates, filters.minDuration),
    [searchSlots, searchResponseDates, filters.minDuration],
  );

  const visibleGroups = useMemo(
    () => sortDateAvailabilityGroups(
      buildVisibleGroups(dateGroups, filters.studioIds, favOnly, favorites),
      sortOption,
    ),
    [dateGroups, favOnly, favorites, filters.studioIds, sortOption],
  );

  const totalStudios = visibleGroups.reduce((sum, g) => sum + g.studios.length, 0);
  const hasFavorites = favorites.size > 0;

  const areaChipLabel = buildAreaChipLabel(areas, filters.areaIds);
  const areaNameById = useMemo(
    () => new Map(areas.map((area) => [area.id, area.name])),
    [areas],
  );
  // 빈자리 검색의 합주실 선택 목록엔 온라인 예약 가능한 곳만 노출한다.
  // 전화예약 등 슬롯이 영영 안 잡히는 곳은 추후 별도 카탈로그 검색에서 다룬다.
  const bookableStudios = useMemo(
    () => studios.filter((s) => s.hasOnlineBooking !== false),
    [studios],
  );
  const searchableStudios = useMemo(
    () => filterStudiosByAreas(bookableStudios, filters.areaIds),
    [filters.areaIds, bookableStudios],
  );
  const selectedStudios = useMemo(
    () => buildSelectedStudios(filters.studioIds, studios, slots),
    [filters.studioIds, slots, studios],
  );
  const selectedStudioChips = useMemo(
    () => buildSelectedStudioChips(filters.studioIds, studios, slots),
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
  const sortActive = sortOption !== 'popular';
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
        {isAlertsOpen ? (
          <AlertsScreen
            alerts={alerts}
            areas={areas}
            studios={bookableStudios}
            onBack={() => setIsAlertsOpen(false)}
            onUpdate={updateSavedAlert}
            onDelete={deleteSavedAlert}
          />
        ) : isStudioSearchOpen ? (
          <div className="studio-search-screen">
            <header className="studio-search-top">
              <button className="search-back" aria-label="합주실 검색 닫기" onClick={() => closeStudioSearch()}>
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
              <button className="search-cancel" onClick={() => closeStudioSearch()}>닫기</button>
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
                onClick={filters.studioIds.length > 0 ? () => closeStudioSearch() : showAllStudios}
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
                  <div className="top-bar-actions">
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
              </div>
            </header>

            <div className={`chip-row${studioActive ? ' has-studio-chip' : ''}`}>
              <button className={`chip${timeActive ? ' active' : ''}${popover?.kind === 'time' ? ' open' : ''}`} aria-pressed={timeActive} onClick={(e) => openPopover('time', e)}><span>{timeWindowLabel(filters.timeWindows)}</span><ChevronIcon /></button>
              <button className={`chip${dateActive ? ' active' : ''}${popover?.kind === 'date' ? ' open' : ''}`} aria-pressed={dateActive} onClick={(e) => openPopover('date', e)}><span>{buildDateChipLabel(filters.dates)}</span><ChevronIcon /></button>
              <button className={`chip${areaActive ? ' active' : ''}${popover?.kind === 'area' ? ' open' : ''}`} aria-pressed={areaActive} onClick={(e) => openPopover('area', e)}><span>{areaChipLabel}</span><ChevronIcon /></button>
              <button className={`chip${sortActive ? ' active' : ''}${popover?.kind === 'sort' ? ' open' : ''}`} aria-pressed={sortActive} onClick={(e) => openPopover('sort', e)}><span>{sortOptionLabel(sortOption)}</span><ChevronIcon /></button>
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

            <div className={`result-list${loading && (totalStudios > 0 || visibleGroups.length > 0) ? ' is-refreshing' : ''}`}>
              {loading && totalStudios === 0 && visibleGroups.length === 0 ? (
                <SkeletonList />
              ) : favFilterActive && totalStudios === 0 ? (
                <FavoritesEmpty hasFavorites={hasFavorites} onShowAll={() => setFavOnly(false)} />
              ) : (
                <>
                  {visibleGroups.length === 0 ? (
                    <EmptyState
                      filters={filters}
                      selectedStudios={selectedStudios}
                      setFilters={setFilters}
                    />
                  ) : (
                    visibleGroups.map((group) => {
                      const isCollapsed = collapsedDates.has(group.date);
                      const bodyId = `date-section-${group.date}`;
                      const selectedEmptyItems = studioActive
                        ? buildSelectedStudioEmptyItems({
                            selectedStudios,
                            visibleGroups: [group],
                            areaNameById,
                            preferredAreaIds: filters.areaIds,
                          })
                        : [];
                      const hasBodyRows = group.studios.length > 0 || selectedEmptyItems.length > 0;

                      return (
                        <section className="date-section" key={group.date}>
                          <button
                            type="button"
                            className={`date-heading${isCollapsed ? ' collapsed' : ''}`}
                            aria-expanded={!isCollapsed}
                            aria-controls={bodyId}
                            onClick={() => toggleDateSection(group.date)}
                          >
                            <span className="date-heading-label">{dateLabel(group.date)}</span>
                            <span className="date-heading-side">
                              {group.studios.length > 0 ? (
                                <span className="count-pill">{group.studios.length}곳</span>
                              ) : (
                                <span className="count-pill empty">없음</span>
                              )}
                              <DateToggleIcon />
                            </span>
                          </button>
                          <div id={bodyId} className="date-section-body" hidden={isCollapsed}>
                            {group.studios.map((studio) => (
                              <StudioRow key={studio.studio.id} studio={studio} />
                            ))}
                            {selectedEmptyItems.map((item) => (
                              <SelectedStudioEmptyRow
                                key={item.studio.id}
                                studio={item.studio}
                                areaName={item.areaName}
                                onCreateAlert={(studio) => openStudioAlert(studio, group.date)}
                                onRemove={removeStudioSelection}
                              />
                            ))}
                            {!hasBodyRows && favFilterActive ? (
                              <EmptyDay
                                message="이 날은 즐겨찾기한 곳이 비어 있어요"
                                minDuration={filters.minDuration}
                                setFilters={setFilters}
                                onCreateAlert={() => openCurrentConditionAlert(group.date)}
                              />
                            ) : !hasBodyRows ? (
                              <EmptyDay
                                minDuration={filters.minDuration}
                                setFilters={setFilters}
                                onCreateAlert={() => openCurrentConditionAlert(group.date)}
                              />
                            ) : null}
                          </div>
                        </section>
                      );
                    })
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

            {popover.kind === 'sort' && (
              <>
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    role="menuitemradio"
                    aria-checked={sortOption === option.value}
                    className={`popover-option${sortOption === option.value ? ' selected' : ''}`}
                    onClick={() => {
                      setSortOption(option.value);
                      setPopover(null);
                    }}
                  >
                    <span>{option.label}</span>
                    {sortOption === option.value && <span className="pop-check">✓</span>}
                  </button>
                ))}
              </>
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

        {!isStudioSearchOpen && !isAlertsOpen && isMenuOpen && (
          <MenuSheet
            alertCount={alerts.length}
            onClose={() => setIsMenuOpen(false)}
            onOpenAlerts={openAlertsScreen}
          />
        )}
        {alertDraft && (
          <AlertConfirmSheet
            draft={alertDraft}
            filters={filters}
            areas={areas}
            onClose={() => setAlertDraft(null)}
            onConfirm={confirmAlertDraft}
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
  message,
  minDuration,
  setFilters,
  onCreateAlert,
}: {
  message?: string;
  minDuration: number;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onCreateAlert: () => void;
}) {
  return (
    <div className="empty-day">
      <span>{message ?? `이 날은 연속 ${minDuration}시간이 안 돼요`}</span>
      <div className="empty-day-actions">
        {minDuration > 1 && (
          <button
            className="empty-day-secondary"
            onClick={() => setFilters((f) => ({ ...f, minDuration: (minDuration - 1) as FilterState['minDuration'] }))}
          >
            {minDuration - 1}시간으로 보기
          </button>
        )}
        <button className="inline-alert-button" aria-label="빈 자리 알림 받기" onClick={onCreateAlert}>
          <BellIcon />
          <span>알림</span>
        </button>
      </div>
    </div>
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

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }} aria-hidden>
      <path
        d="M18 15.5c-1-1.2-1.5-2.7-1.5-4.7V9.7a4.5 4.5 0 0 0-9 0v1.1c0 2-.5 3.5-1.5 4.7L5 17h14l-1-1.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 20a2.2 2.2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19.2 5.2v3M17.7 6.7h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
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

function DateToggleIcon() {
  return (
    <svg className="date-toggle-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function sortOptionLabel(value: StudioSortOption) {
  return SORT_OPTIONS.find((option) => option.value === value)?.label ?? '인기순';
}

function buildSlotsQuery(
  filters: FilterState,
  { includeSelectedStudio }: { includeSelectedStudio: boolean },
): SlotsQuery {
  return {
    dates: filters.dates,
    areaIds: filters.areaIds.length ? filters.areaIds : undefined,
    studioId: includeSelectedStudio && filters.studioIds.length === 1 ? filters.studioIds[0] : undefined,
    timeWindows: filters.timeWindows.length ? filters.timeWindows : undefined,
    minDuration: filters.minDuration > 1 ? filters.minDuration : undefined,
    minCapacity: filters.people > 1 ? filters.people : undefined,
  };
}

function formatUpdatedAt(date: Date) {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m} 업데이트`;
}
