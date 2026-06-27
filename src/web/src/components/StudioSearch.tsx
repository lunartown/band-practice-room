import { useMemo, useState } from 'react';
import type { Studio } from '../api/types';

interface StudioSearchProps {
  studios: Studio[];
  selectedId: number | null;
  onSelect: (studio: Studio | null) => void;
}

// 합주실 89곳 규모라 평면 목록은 무리 — 이름으로 좁히는 검색.
// "그라운드 자리 있나?"를 이름 입력 한 번으로 끝낸다. 지역명으로도 걸린다.
export function StudioSearch({ studios, selectedId, onSelect }: StudioSearchProps) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

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
      <div className="studio-search-list" role="listbox">
        <button
          role="option"
          aria-selected={selectedId === null}
          className={`popover-option${selectedId === null ? ' selected' : ''}`}
          onClick={() => onSelect(null)}
        >
          <span>전체 합주실</span>
          {selectedId === null && <span className="pop-check">✓</span>}
        </button>
        {filtered.map((s) => {
          const on = s.id === selectedId;
          return (
            <button
              key={s.id}
              role="option"
              aria-selected={on}
              className={`popover-option${on ? ' selected' : ''}`}
              onClick={() => onSelect(s)}
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
