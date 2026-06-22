import type { Area } from '../api/types';

interface OpenScreenProps {
  areas: Area[];
  error?: boolean;
  onRetry?: () => void;
  onPick: (areaIds: number[]) => void;
}

// 첫 진입 화면. 브랜드를 전면에 두고, 지역을 고르면 바로 결과로 들어간다.
export function OpenScreen({ areas, error, onRetry, onPick }: OpenScreenProps) {
  return (
    <section className="open-screen" aria-label="합주실닷컴 시작">
      <div className="open-brand">
        <img className="open-logo" src="/logo.svg" alt="" aria-hidden width={48} height={48} />
        <h1 className="open-wordmark">
          합주실<span className="open-dot">닷컴</span>
        </h1>
        <p className="open-tagline">합주실 빈 시간, 한 곳에서</p>
      </div>

      <div className="open-pick">
        <p className="open-prompt">어느 동네에서 찾으세요?</p>
        {error && areas.length === 0 ? (
          <div className="open-areas-error">
            <p>지역 목록을 불러오지 못했어요</p>
            {onRetry && (
              <button className="open-retry" onClick={onRetry}>
                다시 시도
              </button>
            )}
          </div>
        ) : (
          <div className="open-areas">
            {areas.length === 0
              ? [0, 1, 2, 3].map((i) => <span key={i} className="skeleton open-area-skeleton" />)
              : areas.map((area) => (
                  <button key={area.id} className="open-area" onClick={() => onPick([area.id])}>
                    {area.name}
                  </button>
                ))}
          </div>
        )}
        <button className="open-all" onClick={() => onPick([])}>
          전체 지역 둘러보기
        </button>
      </div>
    </section>
  );
}
