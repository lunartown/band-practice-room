import { useState } from 'react';
import type { Area, Studio, TimeWindow } from '../api/types';
import type { AlertStudio, SavedAlert } from '../lib/alerts';
import { dateLabel } from '../lib/date';
import { CalendarPicker } from './CalendarPicker';
import { DURATION_OPTIONS } from './FilterSheet';
import { TimeWindowPicker, timeWindowLabel } from './TimeWindowPicker';

interface AlertsScreenProps {
  alerts: SavedAlert[];
  areas: Area[];
  studios: Studio[];
  onBack: () => void;
  onUpdate: (alert: SavedAlert) => void;
  onDelete: (alertId: string) => void;
}

export function AlertsScreen({ alerts, areas, studios, onBack, onUpdate, onDelete }: AlertsScreenProps) {
  const [editing, setEditing] = useState<SavedAlert | null>(null);

  function requestDelete(alert: SavedAlert) {
    const ok = window.confirm('이 알림을 삭제할까요?');
    if (ok) onDelete(alert.id);
  }

  return (
    <div className="alerts-screen">
      <header className="alerts-top">
        <button className="search-back" aria-label="내 알림 닫기" onClick={onBack}>
          <BackIcon />
        </button>
        <div className="alerts-title">
          <h1>내 알림</h1>
          <span>{alerts.length}개</span>
        </div>
      </header>

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="alerts-empty">
            <BellIcon />
            <h2>아직 등록한 알림이 없어요</h2>
            <p>빈 시간이 없는 날짜에서 알림을 눌러 조건을 저장하세요</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <article className="alert-card" key={alert.id}>
              <div className="alert-card-head">
                <span className="alert-card-icon">
                  <BellIcon />
                </span>
                <div className="alert-card-title">
                  <strong>{buildStudioNamesLabel(alert.studios)}</strong>
                  <span>{buildDatesLabel(alert.dates)}</span>
                </div>
              </div>

              <div className="alert-card-chips">
                {buildConditionChips(alert, areas).map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>

              <div className="alert-card-actions">
                <button type="button" onClick={() => setEditing(alert)}>수정</button>
                <button type="button" className="danger" onClick={() => requestDelete(alert)}>삭제</button>
              </div>
            </article>
          ))
        )}
      </div>

      {editing && (
        <AlertEditSheet
          key={editing.id}
          alert={editing}
          areas={areas}
          studios={studios}
          onClose={() => setEditing(null)}
          onSave={(alert) => {
            onUpdate(alert);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

interface AlertEditSheetProps {
  alert: SavedAlert;
  areas: Area[];
  studios: Studio[];
  onClose: () => void;
  onSave: (alert: SavedAlert) => void;
}

function AlertEditSheet({ alert, areas, studios, onClose, onSave }: AlertEditSheetProps) {
  const [selectedStudios, setSelectedStudios] = useState<AlertStudio[]>(alert.studios);
  const [isStudioSearchOpen, setIsStudioSearchOpen] = useState(false);
  const [studioQuery, setStudioQuery] = useState('');
  const [areaIds, setAreaIds] = useState(alert.areaIds);
  const [dates, setDates] = useState(alert.dates);
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>(alert.timeWindows);
  const [minDuration, setMinDuration] = useState(alert.minDuration);
  const [people, setPeople] = useState(alert.people);
  const canSave = dates.length > 0;
  const studioOptions = buildStudioOptions(studios, areaIds, studioQuery);
  const selectedStudioIds = new Set(selectedStudios.map((studio) => studio.id));

  function toggleArea(id: number) {
    setAreaIds((current) => (current.includes(id) ? current.filter((areaId) => areaId !== id) : [...current, id]));
  }

  function toggleStudio(studio: Pick<Studio, 'id' | 'name'>) {
    setSelectedStudios((current) => {
      if (current.some((item) => item.id === studio.id)) return current.filter((item) => item.id !== studio.id);
      return [...current, { id: studio.id, name: studio.name }];
    });
  }

  function save() {
    if (!canSave) return;
    const nextStudios = selectedStudios.map(({ id, name }) => ({ id, name }));
    onSave({
      ...alert,
      scope: nextStudios.length > 0 ? 'studios' : 'search',
      studios: nextStudios,
      areaIds,
      dates,
      timeWindows,
      minDuration,
      people,
    });
  }

  if (isStudioSearchOpen) {
    return (
      <div className="sheet-layer">
        <button className="sheet-dim" aria-label="합주실 선택 닫기" onClick={() => setIsStudioSearchOpen(false)} />
        <section className="filter-sheet alert-edit-sheet alert-edit-search-sheet" role="dialog" aria-modal="true" aria-label="합주실 선택">
          <div className="alert-edit-search-top">
            <button className="search-back" aria-label="알림 수정으로 돌아가기" onClick={() => setIsStudioSearchOpen(false)}>
              <BackIcon />
            </button>
            <label className="search-field">
              <SearchIcon />
              <input
                value={studioQuery}
                onChange={(event) => setStudioQuery(event.target.value)}
                placeholder="합주실 이름으로 찾기"
                autoFocus
              />
              {studioQuery && (
                <button className="search-clear" aria-label="검색어 지우기" onClick={() => setStudioQuery('')}>
                  ×
                </button>
              )}
            </label>
            <button className="search-cancel" onClick={() => setIsStudioSearchOpen(false)}>닫기</button>
          </div>

          <div className="studio-search-results">
            {studioOptions.length === 0 ? (
              <div className="studio-search-empty-state">
                <h2>등록된 합주실을 찾지 못했어요</h2>
                <p>이름이나 지역을 조금 다르게 입력해보세요</p>
              </div>
            ) : (
              <section className="studio-search-section">
                <h2>{studioQuery.trim() ? '검색 결과' : '합주실'}</h2>
                {studioOptions.map((studio) => {
                  const selected = selectedStudioIds.has(studio.id);
                  return (
                    <button
                      key={studio.id}
                      type="button"
                      className={`studio-search-row${selected ? ' selected' : ''}`}
                      aria-pressed={selected}
                      onClick={() => toggleStudio(studio)}
                    >
                      <span className="studio-search-row-main">
                        <span className="studio-search-row-name">{studio.name}</span>
                        <span className="studio-search-row-meta">{studio.primaryAreaName ?? '지역 미지정'}</span>
                      </span>
                      {selected && <span className="studio-search-selected">✓</span>}
                    </button>
                  );
                })}
              </section>
            )}
          </div>

          <footer>
            <button type="button" className="secondary" onClick={() => setSelectedStudios([])}>전체 합주실</button>
            <button type="button" className="primary" onClick={() => setIsStudioSearchOpen(false)}>
              {selectedStudios.length > 0 ? `${selectedStudios.length}곳 선택` : '완료'}
            </button>
          </footer>
        </section>
      </div>
    );
  }

  return (
    <div className="sheet-layer">
      <button className="sheet-dim" aria-label="알림 수정 닫기" onClick={onClose} />
      <section className="filter-sheet alert-edit-sheet" role="dialog" aria-modal="true" aria-label="알림 수정">
        <div className="sheet-drag">
          <div className="sheet-handle" />
          <header>
            <h2>알림 수정</h2>
            <button type="button" onClick={onClose}>닫기</button>
          </header>
        </div>

        <div className="sheet-body">
          <div className="filter-group">
            <h3>합주실</h3>
            <div className="alert-studio-picker">
              <div className="alert-studio-chip-row">
                {selectedStudios.length === 0 ? (
                  <span className="chip strong alert-studio-empty-chip">전체 합주실</span>
                ) : (
                  selectedStudios.map((studio) => (
                    <button
                      key={studio.id}
                      type="button"
                      className="chip studio-chip active"
                      onClick={() => toggleStudio(studio)}
                      aria-label={`${studio.name} 제거`}
                    >
                      <span>{studio.name}</span>
                      <RemoveIcon />
                    </button>
                  ))
                )}
                <button
                  type="button"
                  className="chip alert-studio-open-search"
                  onClick={() => {
                    setStudioQuery('');
                    setIsStudioSearchOpen(true);
                  }}
                >
                  <SearchIcon />
                  <span>{selectedStudios.length > 0 ? '합주실 추가' : '합주실 찾기'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="filter-group">
            <h3>지역</h3>
            <div className="filter-chips">
              <button className={areaIds.length === 0 ? 'selected' : ''} onClick={() => setAreaIds([])}>
                전체 지역
              </button>
              {areas.map((area) => (
                <button
                  key={area.id}
                  className={areaIds.includes(area.id) ? 'selected' : ''}
                  onClick={() => toggleArea(area.id)}
                >
                  {area.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h3>날짜</h3>
            <CalendarPicker selected={dates} onChange={setDates} />
          </div>

          <div className="filter-group">
            <h3>시간</h3>
            <TimeWindowPicker value={timeWindows} onChange={setTimeWindows} />
          </div>

          <div className="filter-group">
            <h3>연속</h3>
            <div className="filter-chips">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={minDuration === option.value ? 'selected' : ''}
                  onClick={() => setMinDuration(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="people-control">
            <span>인원</span>
            <button onClick={() => setPeople((value) => Math.max(1, value - 1))}>−</button>
            <strong>{people}명</strong>
            <button onClick={() => setPeople((value) => Math.min(10, value + 1))}>+</button>
          </div>
        </div>

        <footer>
          <button type="button" className="secondary" onClick={onClose}>취소</button>
          <button type="button" className="primary" disabled={!canSave} onClick={save}>저장</button>
        </footer>
      </section>
    </div>
  );
}

function buildStudioOptions(studios: Studio[], areaIds: number[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return studios
    .filter((studio) => studioMatchesAreas(studio, areaIds))
    .filter((studio) => {
      if (!normalizedQuery) return true;
      return `${studio.name} ${studio.primaryAreaName ?? ''}`.toLowerCase().includes(normalizedQuery);
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    .slice(0, 8);
}

function studioMatchesAreas(studio: Studio, areaIds: number[]) {
  if (areaIds.length === 0) return true;
  const studioAreaIds = studio.areaIds?.length ? studio.areaIds : studio.primaryAreaId == null ? [] : [studio.primaryAreaId];
  return areaIds.some((areaId) => studioAreaIds.includes(areaId));
}

function buildStudioNamesLabel(studios: SavedAlert['studios']) {
  if (studios.length === 0) return '전체 합주실';
  if (studios.length <= 2) return studios.map((studio) => studio.name).join(', ');
  return `${studios.slice(0, 2).map((studio) => studio.name).join(', ')} 외 ${studios.length - 2}곳`;
}

function buildAreaNamesLabel(areaIds: number[], areas: Area[]) {
  if (areaIds.length === 0) return '전체 지역';
  const nameById = new Map(areas.map((area) => [area.id, area.name]));
  const names = areaIds.map((id) => nameById.get(id)).filter((name): name is string => Boolean(name));
  if (names.length === 0) return `${areaIds.length}개 지역`;
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} 외 ${names.length - 3}곳`;
}

function buildDatesLabel(dates: string[]) {
  const sorted = [...dates].sort();
  if (sorted.length === 0) return '날짜 필요';
  const labels = sorted.map(dateLabel);
  if (labels.length <= 2) return labels.join(', ');
  return `${labels.slice(0, 2).join(', ')} 외 ${labels.length - 2}일`;
}

function buildConditionChips(alert: SavedAlert, areas: Area[]) {
  return [
    buildAreaNamesLabel(alert.areaIds, areas),
    alert.timeWindows.length > 0 ? timeWindowLabel(alert.timeWindows) : '모든 시간',
    `${alert.minDuration}시간 이상`,
    `${alert.people}명 이상`,
  ];
}

function BackIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }} aria-hidden>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.8-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
