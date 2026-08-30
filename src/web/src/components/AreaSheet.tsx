import type { Area } from '../api/types';
import { BottomSheet } from './BottomSheet';

interface AreaSheetProps {
  areas: Area[];
  selectedAreaId: number | null;
  error?: boolean;
  onRetry?: () => void;
  onClose: () => void;
  onSelect: (areaId: number | null) => void;
}

// 지역은 단일 선택이다. 고르면 바로 반영하고 닫는다 — 별도 확인 버튼 없음.
export function AreaSheet({ areas, selectedAreaId, error, onRetry, onClose, onSelect }: AreaSheetProps) {
  function pick(areaId: number | null) {
    onSelect(areaId);
    onClose();
  }

  return (
    <BottomSheet
      ariaLabel="지역 선택"
      sheetClassName="area-sheet"
      dimClassName="filter-dim"
      onClose={onClose}
      header={() => (
        <header>
          <h2>지역 선택</h2>
        </header>
      )}
    >
      <div className="area-sheet-list">
        <button
          type="button"
          className={`area-sheet-row${selectedAreaId == null ? ' selected' : ''}`}
          onClick={() => pick(null)}
        >
          전체 지역
        </button>
        {areas.map((area) => (
          <button
            type="button"
            key={area.id}
            className={`area-sheet-row${selectedAreaId === area.id ? ' selected' : ''}`}
            onClick={() => pick(area.id)}
          >
            {area.name}
          </button>
        ))}
        {error && areas.length === 0 && (
          <div className="area-sheet-error">
            <p>지역 목록을 불러오지 못했어요</p>
            {onRetry && (
              <button type="button" className="area-sheet-retry" onClick={onRetry}>
                다시 시도
              </button>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
