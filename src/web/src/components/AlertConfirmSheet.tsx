import type { Area, Studio } from '../api/types';
import { dateLabel } from '../lib/date';
import type { FilterState } from './FilterSheet';
import { timeWindowLabel } from './TimeWindowPicker';

export type AlertDraft =
  | {
      scope: 'studios';
      studios: Pick<Studio, 'id' | 'name'>[];
      dates: string[];
    }
  | {
      scope: 'search';
      dates: string[];
    };

interface AlertConfirmSheetProps {
  draft: AlertDraft;
  filters: FilterState;
  areas: Area[];
  onClose: () => void;
  onConfirm: () => void;
}

export function AlertConfirmSheet({ draft, filters, areas, onClose, onConfirm }: AlertConfirmSheetProps) {
  const targetLabel = buildTargetLabel(draft, filters, areas);
  const headline = buildHeadline(draft);
  const rows = [
    { label: '대상', value: targetLabel },
    { label: '날짜', value: buildDatesLabel(draft.dates) },
    { label: '시간', value: filters.timeWindows.length > 0 ? timeWindowLabel(filters.timeWindows) : '모든 시간' },
    { label: '연속', value: `${filters.minDuration}시간 이상` },
    { label: '인원', value: `${filters.people}명 이상` },
  ];

  return (
    <div className="sheet-layer sheet-layer--safe">
      <button className="sheet-dim" aria-label="알림 조건 닫기" onClick={onClose} />
      <section className="filter-sheet alert-sheet" role="dialog" aria-modal="true" aria-label="빈 자리 알림 조건">
        <div className="sheet-drag">
          <div className="sheet-handle" />
          <header>
            <h2>빈 자리 알림</h2>
            <button type="button" onClick={onClose}>닫기</button>
          </header>
        </div>

        <div className="sheet-body">
          <div className="alert-summary">
            <BellIcon />
            <div>
              <strong>{headline}</strong>
              <span>선택한 날짜 안에서 조건이 맞는 빈 시간을 확인해요</span>
            </div>
          </div>

          <dl className="alert-condition-list">
            {rows.map((row) => (
              <div key={row.label} className="alert-condition-row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <footer>
          <button type="button" className="secondary" onClick={onClose}>취소</button>
          <button type="button" className="primary" onClick={onConfirm}>확인</button>
        </footer>
      </section>
    </div>
  );
}

function buildHeadline(draft: AlertDraft) {
  if (draft.scope === 'search') return '이 조건에 맞는 빈 시간이 생기면 알려드릴게요';
  if (draft.studios.length === 1) return `${draft.studios[0].name}에 빈 시간이 생기면 알려드릴게요`;
  return `선택한 ${draft.studios.length}곳에 빈 시간이 생기면 알려드릴게요`;
}

function buildTargetLabel(draft: AlertDraft, filters: FilterState, areas: Area[]) {
  if (draft.scope === 'studios') {
    return buildStudioNamesLabel(draft.studios);
  }
  return buildAreaNamesLabel(filters.areaIds, areas);
}

function buildStudioNamesLabel(studios: Pick<Studio, 'id' | 'name'>[]) {
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

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 16v-4.4c0-3.1-1.9-5.6-5-6.2V4a1 1 0 0 0-2 0v1.4c-3.1.6-5 3.1-5 6.2V16l-1.7 2h15.4L18 16z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M9.5 20a2.6 2.6 0 0 0 5 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
