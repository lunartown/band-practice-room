import type { StudioSortOption } from '../lib/availability';
import { BottomSheet } from './BottomSheet';

export const SORT_OPTIONS: { value: StudioSortOption; label: string }[] = [
  { value: 'popular', label: '리뷰 많은 순' },
  { value: 'name_asc', label: '이름순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
];

interface SortSheetProps {
  value: StudioSortOption;
  onClose: () => void;
  onChange: (value: StudioSortOption) => void;
}

export function SortSheet({ value, onClose, onChange }: SortSheetProps) {
  return (
    <BottomSheet
      ariaLabel="정렬 기준 선택"
      sheetClassName="sort-sheet"
      dimClassName="filter-dim"
      onClose={onClose}
      header={() => (
        <header>
          <h2>정렬</h2>
        </header>
      )}
    >
      <div className="sort-sheet-list" role="radiogroup" aria-label="정렬 기준">
        {SORT_OPTIONS.map((option) => (
          <button
            type="button"
            key={option.value}
            role="radio"
            aria-checked={value === option.value}
            className={`sort-sheet-row${value === option.value ? ' selected' : ''}`}
            onClick={() => {
              onChange(option.value);
              onClose();
            }}
          >
            <span>{option.label}</span>
            <span className="sort-sheet-check" aria-hidden="true">
              {value === option.value ? '✓' : ''}
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
