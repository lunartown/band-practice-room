import { useState } from 'react';
import type { Area, TimeWindow } from '../api/types';
import type { SavedAlert } from '../lib/alerts';
import { dateLabel } from '../lib/date';
import { CalendarPicker } from './CalendarPicker';
import { DURATION_OPTIONS } from './FilterSheet';
import { TimeWindowPicker, timeWindowLabel } from './TimeWindowPicker';

interface AlertsScreenProps {
  alerts: SavedAlert[];
  areas: Area[];
  onBack: () => void;
  onUpdate: (alert: SavedAlert) => void;
  onDelete: (alertId: string) => void;
}

export function AlertsScreen({ alerts, areas, onBack, onUpdate, onDelete }: AlertsScreenProps) {
  const [editing, setEditing] = useState<SavedAlert | null>(null);

  function requestDelete(alert: SavedAlert) {
    const ok = window.confirm(`${buildTargetLabel(alert, areas)} 알림을 삭제할까요?`);
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
                  <strong>{buildTargetLabel(alert, areas)}</strong>
                  <span>{buildDatesLabel(alert.dates)}</span>
                </div>
              </div>

              <div className="alert-card-chips">
                {buildConditionChips(alert).map((chip) => (
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
  onClose: () => void;
  onSave: (alert: SavedAlert) => void;
}

function AlertEditSheet({ alert, areas, onClose, onSave }: AlertEditSheetProps) {
  const [areaIds, setAreaIds] = useState(alert.areaIds);
  const [dates, setDates] = useState(alert.dates);
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>(alert.timeWindows);
  const [minDuration, setMinDuration] = useState(alert.minDuration);
  const [people, setPeople] = useState(alert.people);
  const canSave = dates.length > 0;

  function toggleArea(id: number) {
    setAreaIds((current) => (current.includes(id) ? current.filter((areaId) => areaId !== id) : [...current, id]));
  }

  function save() {
    if (!canSave) return;
    onSave({
      ...alert,
      areaIds: alert.scope === 'search' ? areaIds : alert.areaIds,
      dates,
      timeWindows,
      minDuration,
      people,
    });
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
          <div className="alert-edit-target">
            <span>대상</span>
            <strong>{buildTargetLabel(alert, areas)}</strong>
          </div>

          {alert.scope === 'search' && (
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
          )}

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

function buildTargetLabel(alert: SavedAlert, areas: Area[]) {
  if (alert.scope === 'studios') return buildStudioNamesLabel(alert.studios);
  return buildAreaNamesLabel(alert.areaIds, areas);
}

function buildStudioNamesLabel(studios: SavedAlert['studios']) {
  if (studios.length === 0) return '선택한 합주실';
  if (studios.length <= 2) return studios.map((studio) => studio.name).join(', ');
  return `${studios.slice(0, 2).map((studio) => studio.name).join(', ')} 외 ${studios.length - 2}곳`;
}

function buildAreaNamesLabel(areaIds: number[], areas: Area[]) {
  if (areaIds.length === 0) return '모든 지역';
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

function buildConditionChips(alert: SavedAlert) {
  return [
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
