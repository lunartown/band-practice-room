import type { TimeWindow } from '../api/types';

const TIME_OPTIONS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00',
];

export const TIME_PRESETS = [
  { label: '오전', from: '09:00', to: '12:00' },
  { label: '오후', from: '12:00', to: '18:00' },
  { label: '저녁', from: '18:00', to: '22:00' },
  { label: '밤', from: '22:00', to: '24:00' },
];

// 시간 윈도우들이 하나의 연속된 구간을 이루면 그 구간(가장 이른 시작~가장 늦은 종료)을 돌려준다.
// 시간 문자열은 'HH:MM' 고정폭이라 사전식 비교로 시각 비교가 그대로 성립한다.
export function contiguousSpan(windows: TimeWindow[]): TimeWindow | null {
  if (windows.length === 0) return null;
  const sorted = [...windows].sort((a, b) => a.from.localeCompare(b.from));
  let { from, to } = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].from > to) return null; // 사이에 빈 구간이 있으면 단일 구간이 아니다
    if (sorted[i].to > to) to = sorted[i].to;
  }
  return { from, to };
}

// 칩 라벨: 미선택은 '아무 때나', 단일 프리셋은 프리셋명, 이어진 구간은 'HH:MM~HH:MM',
// 떨어진 여러 구간은 'N개 시간대'로 압축한다.
export function timeWindowLabel(windows: TimeWindow[]): string {
  if (windows.length === 0) return '아무 때나';
  if (windows.length === 1) {
    const preset = TIME_PRESETS.find((p) => p.from === windows[0].from && p.to === windows[0].to);
    if (preset) return preset.label;
  }
  const span = contiguousSpan(windows);
  if (span) return `${span.from}~${span.to}`;
  return `시간대 ${windows.length}개`;
}

interface TimeWindowPickerProps {
  value: TimeWindow[];
  onChange: (windows: TimeWindow[]) => void;
}

// 선호 시간대 선택 UI: 시작~종료 직접 선택 + 오전/오후/저녁/밤 프리셋 토글.
// 필터 시트와 상단 칩 팝오버에서 함께 쓴다.
export function TimeWindowPicker({ value, onChange }: TimeWindowPickerProps) {
  // 각 밴드는 독립된 시간 윈도우. 떨어진 밴드(오전+밤)도 각각 윈도우로 유지된다.
  function isBandActive(band: (typeof TIME_PRESETS)[number]) {
    return value.some((w) => w.from === band.from && w.to === band.to);
  }

  function toggleBand(band: (typeof TIME_PRESETS)[number]) {
    const exists = isBandActive(band);
    const next = exists
      ? value.filter((w) => !(w.from === band.from && w.to === band.to))
      : [...value, { from: band.from, to: band.to }];
    onChange(next);
  }

  // 직접 선택에는 선택한 윈도우들의 "이어진 구간"을 보여준다.
  // 저녁(18~22)+밤(22~24)처럼 맞닿은 밴드는 18~24로 합쳐 표시하고,
  // 오전+밤처럼 떨어진 윈도우는 단일 구간으로 표현할 수 없어 비워 둔다.
  const span = contiguousSpan(value);
  const fromVal = span?.from ?? '';
  const toVal = span?.to ?? '';

  function setManual(part: 'from' | 'to', v: string) {
    const from = part === 'from' ? v : span?.from ?? '';
    const to = part === 'to' ? v : span?.to ?? '';
    if (!from && !to) {
      onChange([]);
      return;
    }
    if (from && to && from >= to) return; // 역전 방지 (UI에서도 차단)
    onChange([{ from: from || '00:00', to: to || '24:00' }]);
  }

  return (
    <div className="time-picker">
      <div className="time-range-row">
        <select value={fromVal} onChange={(e) => setManual('from', e.target.value)}>
          <option value="">시작 시간</option>
          {TIME_OPTIONS.slice(0, -1).map((t) => (
            <option key={t} value={t} disabled={!!toVal && t >= toVal}>{t}</option>
          ))}
        </select>
        <span className="time-sep">~</span>
        <select value={toVal} onChange={(e) => setManual('to', e.target.value)}>
          <option value="">종료 시간</option>
          {TIME_OPTIONS.slice(1).map((t) => (
            <option key={t} value={t} disabled={!!fromVal && t <= fromVal}>{t}</option>
          ))}
        </select>
      </div>
      <div className="preset-chips">
        {TIME_PRESETS.map((p) => (
          <button
            key={p.label}
            className={isBandActive(p) ? 'selected' : ''}
            onClick={() => toggleBand(p)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
