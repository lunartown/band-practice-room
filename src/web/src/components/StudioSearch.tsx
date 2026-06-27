import { useMemo, useState } from 'react';
import type { Studio } from '../api/types';

interface StudioSearchProps {
  studios: Studio[];
  selectedIds: number[];
  onToggle: (studio: Studio) => void;
  onClearAll: () => void;
}

// 합주실 89곳 규모라 평면 목록은 무리 — 이름으로 좁히는 검색.
// 단골은 보통 여러 곳이라 다중 선택을 지원한다("그라운드 + 하모닉스 한 번에 보기").
// 지역명으로도 걸린다.
export function StudioSearch({ studios, selectedIds, onToggle, onClearAll }: StudioSearchProps) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const selected = new Set(selectedIds);

  const sorted = useMemo(
    () => [...studios].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [studios],
  );

  const filtered = q
    ? sorted.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.primaryAreaName ?? '').toLowerCase().includes(q),
      )
    : sorted;

  return (
    <div className="studio-search">
      <input
        className="studio-search-input"
        type="search"
        inputMode="search"
        placeholder="합주실 이름 검색"
        value={query}
        autoFocus
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="studio-search-list" role="listbox" aria-multiselectable="true">
        <button
          role="option"
          aria-selected={selected.size === 0}
          className={`popover-option${selected.size === 0 ? ' selected' : ''}`}
          onClick={onClearAll}
        >
          <span>전체 합주실</span>
          {selected.size === 0 && <span className="pop-check">✓</span>}
        </button>
        {filtered.map((s) => {
          const on = selected.has(s.id);
          return (
            <button
              key={s.id}
              role="option"
              aria-selected={on}
              className={`popover-option${on ? ' selected' : ''}`}
              onClick={() => onToggle(s)}
            >
              <span className="studio-search-name">
                {s.name}
                {s.primaryAreaName && <span className="studio-search-sub">{s.primaryAreaName}</span>}
              </span>
              {on && <span className="pop-check">✓</span>}
            </button>
          );
        })}
        {filtered.length === 0 && <div className="studio-search-empty">검색 결과가 없어요</div>}
      </div>
    </div>
  );
}
