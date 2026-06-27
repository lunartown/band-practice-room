import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AdminAuditLog,
  AdminImageIssue,
  AdminMappingIssue,
  AdminOverview,
  ImageStatus,
  MappingStatus,
  getAdminAuditLogs,
  getAdminImageIssues,
  getAdminMappingIssues,
  getAdminOverview,
  loginAdmin,
  updateAdminSource,
  updateAdminStudioImage,
  updateAdminStudioStatus,
  verifyAdminSource,
} from './api/adminClient';

const TOKEN_KEY = 'hapjusil:admin-token';
const MAPPING_STATUS_OPTIONS: MappingStatus[] = ['ACTIVE', 'NEEDS_MAPPING', 'DISABLED', 'NOT_FOUND'];
const IMAGE_STATUS_OPTIONS: ImageStatus[] = ['OK', 'MISSING', 'BAD', 'NEEDS_REVIEW', 'MANUAL_OVERRIDE', 'HIDDEN'];

type AdminTab = 'dashboard' | 'mapping' | 'images' | 'logs';

interface MappingDraft {
  externalKey: string;
  url: string;
  mappingStatus: MappingStatus;
  mappingNote: string;
}

interface ImageDraft {
  imageUrlManual: string;
  imageStatus: ImageStatus;
  imageNote: string;
}

export function AdminApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [mappingItems, setMappingItems] = useState<AdminMappingIssue[]>([]);
  const [imageItems, setImageItems] = useState<AdminImageIssue[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [mappingDrafts, setMappingDrafts] = useState<Record<string, MappingDraft>>({});
  const [imageDrafts, setImageDrafts] = useState<Record<number, ImageDraft>>({});
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const sourceNeedsMapping = mappingItems.filter((item) => item.mappingStatus === 'NEEDS_MAPPING').length;
    const badImages = imageItems.filter((item) => item.imageStatus === 'BAD' || item.imageStatus === 'MISSING').length;
    return { sourceNeedsMapping, badImages };
  }, [imageItems, mappingItems]);

  useEffect(() => {
    if (!token) return;
    void loadAll(token);
  }, [token]);

  async function loadAll(activeToken = token) {
    if (!activeToken) return;
    setLoading(true);
    setError(null);
    try {
      const [nextOverview, nextMapping, nextImages, nextLogs] = await Promise.all([
        getAdminOverview(activeToken),
        getAdminMappingIssues(activeToken),
        getAdminImageIssues(activeToken),
        getAdminAuditLogs(activeToken),
      ]);
      setOverview(nextOverview);
      setMappingItems(nextMapping);
      setImageItems(nextImages);
      setAuditLogs(nextLogs);
      setMappingDrafts(Object.fromEntries(nextMapping.map((item) => [mappingKey(item), toMappingDraft(item)])));
      setImageDrafts(Object.fromEntries(nextImages.map((item) => [item.id, toImageDraft(item)])));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      if (/token|unauthorized|credentials/i.test(message)) logout();
    } finally {
      setLoading(false);
    }
  }

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await loginAdmin(password);
      sessionStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  async function saveMapping(item: AdminMappingIssue) {
    if (!token) return;
    const key = mappingKey(item);
    const draft = mappingDrafts[key];
    if (!draft) return;
    setSavingKey(key);
    setError(null);
    try {
      await updateAdminSource(token, item, {
        externalKey: emptyToNull(draft.externalKey),
        url: emptyToNull(draft.url),
        mappingStatus: draft.mappingStatus,
        mappingNote: emptyToNull(draft.mappingNote),
      });
      await loadAll(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingKey(null);
    }
  }

  async function quickMappingStatus(item: AdminMappingIssue, mappingStatus: MappingStatus) {
    if (!token) return;
    const key = mappingKey(item);
    setSavingKey(key);
    setError(null);
    try {
      await updateAdminSource(token, item, { mappingStatus });
      await loadAll(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingKey(null);
    }
  }

  async function verifyMapping(item: AdminMappingIssue) {
    if (!token) return;
    const key = mappingKey(item);
    setSavingKey(key);
    setError(null);
    try {
      await verifyAdminSource(token, item);
      await loadAll(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingKey(null);
    }
  }

  async function saveImage(item: AdminImageIssue) {
    if (!token) return;
    const draft = imageDrafts[item.id];
    if (!draft) return;
    const key = `image:${item.id}`;
    setSavingKey(key);
    setError(null);
    try {
      await updateAdminStudioImage(token, item.id, {
        imageUrlManual: emptyToNull(draft.imageUrlManual),
        imageStatus: draft.imageStatus,
        imageNote: emptyToNull(draft.imageNote),
      });
      await loadAll(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingKey(null);
    }
  }

  async function toggleStudioActive(item: AdminImageIssue) {
    if (!token) return;
    const key = `status:${item.id}`;
    setSavingKey(key);
    setError(null);
    try {
      await updateAdminStudioStatus(token, item.id, !item.isActive);
      await loadAll(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingKey(null);
    }
  }

  if (!token) {
    return (
      <main className="admin-login-shell">
        <form className="admin-login" onSubmit={submitLogin}>
          <div>
            <p className="admin-eyebrow">합주실닷컴</p>
            <h1>운영 콘솔</h1>
          </div>
          <label>
            관리자 비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </label>
          {error && <p className="admin-error">{error}</p>}
          <button className="admin-primary" disabled={loading || !password}>
            {loading ? '확인 중' : '로그인'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <p className="admin-eyebrow">합주실닷컴</p>
          <h1>운영 콘솔</h1>
        </div>
        <nav className="admin-tabs" aria-label="관리자 메뉴">
          <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>대시보드</button>
          <button className={tab === 'mapping' ? 'active' : ''} onClick={() => setTab('mapping')}>매핑 큐</button>
          <button className={tab === 'images' ? 'active' : ''} onClick={() => setTab('images')}>이미지 큐</button>
          <button className={tab === 'logs' ? 'active' : ''} onClick={() => setTab('logs')}>변경 이력</button>
        </nav>
        <button className="admin-ghost" onClick={logout}>로그아웃</button>
      </aside>

      <section className="admin-main">
        <header className="admin-main-head">
          <div>
            <h2>{tabTitle(tab)}</h2>
            <p>{tabDescription(tab)}</p>
          </div>
          <button className="admin-secondary" onClick={() => loadAll()} disabled={loading}>
            {loading ? '새로고침 중' : '새로고침'}
          </button>
        </header>

        {error && <div className="admin-error-banner">{error}</div>}

        {tab === 'dashboard' && (
          <Dashboard overview={overview} mappingCount={mappingItems.length} imageCount={imageItems.length} stats={stats} />
        )}
        {tab === 'mapping' && (
          <MappingQueue
            items={mappingItems}
            drafts={mappingDrafts}
            savingKey={savingKey}
            onDraft={(item, draft) => setMappingDrafts((current) => ({ ...current, [mappingKey(item)]: draft }))}
            onSave={saveMapping}
            onVerify={verifyMapping}
            onStatus={quickMappingStatus}
          />
        )}
        {tab === 'images' && (
          <ImageQueue
            items={imageItems}
            drafts={imageDrafts}
            savingKey={savingKey}
            onDraft={(id, draft) => setImageDrafts((current) => ({ ...current, [id]: draft }))}
            onSave={saveImage}
            onToggleActive={toggleStudioActive}
          />
        )}
        {tab === 'logs' && <AuditLogList items={auditLogs} />}
      </section>
    </main>
  );
}

function Dashboard({
  overview,
  mappingCount,
  imageCount,
  stats,
}: {
  overview: AdminOverview | null;
  mappingCount: number;
  imageCount: number;
  stats: { sourceNeedsMapping: number; badImages: number };
}) {
  const cards = [
    { label: '매핑 확인 필요', value: overview?.mappingIssueCount ?? mappingCount },
    { label: '이미지 검수 필요', value: overview?.imageIssueCount ?? imageCount },
    { label: '24시간 실패 수집', value: overview?.failedRunCount24h ?? 0 },
    { label: '비활성 합주실/방', value: `${overview?.disabledStudioCount ?? 0}/${overview?.disabledRoomCount ?? 0}` },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-stat-grid">
        {cards.map((card) => (
          <div className="admin-stat" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>
      <div className="admin-panel">
        <h3>우선 처리</h3>
        <div className="admin-priority-list">
          <span>장소/방 코드 확인: {stats.sourceNeedsMapping}건</span>
          <span>누락/불량 이미지: {stats.badImages}건</span>
        </div>
      </div>
    </div>
  );
}

function MappingQueue({
  items,
  drafts,
  savingKey,
  onDraft,
  onSave,
  onVerify,
  onStatus,
}: {
  items: AdminMappingIssue[];
  drafts: Record<string, MappingDraft>;
  savingKey: string | null;
  onDraft: (item: AdminMappingIssue, draft: MappingDraft) => void;
  onSave: (item: AdminMappingIssue) => void;
  onVerify: (item: AdminMappingIssue) => void;
  onStatus: (item: AdminMappingIssue, status: MappingStatus) => void;
}) {
  if (items.length === 0) return <EmptyAdminState title="매핑 이슈가 없습니다" body="최근 실패나 확인 대기 상태가 없습니다." />;

  return (
    <div className="admin-list">
      {items.map((item) => {
        const key = mappingKey(item);
        const draft = drafts[key] ?? toMappingDraft(item);
        const saving = savingKey === key;
        return (
          <article className="admin-row" key={key}>
            <div className="admin-row-head">
              <div>
                <div className="admin-row-title">
                  <strong>{item.studioName}</strong>
                  {item.roomName && <span>{item.roomName}</span>}
                </div>
                <p>
                  {item.sourceName}
                  {item.latestErrorKind ? ` · ${item.latestErrorKind}` : ''}
                  {item.latestFinishedAt ? ` · ${formatDateTime(item.latestFinishedAt)}` : ''}
                </p>
              </div>
              <StatusPill value={item.mappingStatus} />
            </div>

            {(item.lastLookupError || item.latestErrorMessage) && (
              <p className="admin-warning">{item.lastLookupError ?? item.latestErrorMessage}</p>
            )}

            <div className="admin-form-grid">
              <label>
                식별자
                <input
                  value={draft.externalKey}
                  onChange={(event) => onDraft(item, { ...draft, externalKey: event.target.value })}
                />
              </label>
              <label>
                URL
                <input
                  value={draft.url}
                  onChange={(event) => onDraft(item, { ...draft, url: event.target.value })}
                />
              </label>
              <label>
                상태
                <select
                  value={draft.mappingStatus}
                  onChange={(event) => onDraft(item, { ...draft, mappingStatus: event.target.value as MappingStatus })}
                >
                  {MAPPING_STATUS_OPTIONS.map((status) => (
                    <option value={status} key={status}>{statusLabel(status)}</option>
                  ))}
                </select>
              </label>
              <label>
                메모
                <input
                  value={draft.mappingNote}
                  onChange={(event) => onDraft(item, { ...draft, mappingNote: event.target.value })}
                />
              </label>
            </div>

            <div className="admin-actions">
              <button className="admin-primary small" disabled={saving} onClick={() => onSave(item)}>
                {saving ? '저장 중' : '저장'}
              </button>
              <button className="admin-secondary small" disabled={saving} onClick={() => onVerify(item)}>검증 완료 처리</button>
              <button className="admin-danger small" disabled={saving} onClick={() => onStatus(item, 'DISABLED')}>비활성화</button>
              {item.url && (
                <a className="admin-link-button" href={item.url} target="_blank" rel="noreferrer">원본 열기</a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ImageQueue({
  items,
  drafts,
  savingKey,
  onDraft,
  onSave,
  onToggleActive,
}: {
  items: AdminImageIssue[];
  drafts: Record<number, ImageDraft>;
  savingKey: string | null;
  onDraft: (id: number, draft: ImageDraft) => void;
  onSave: (item: AdminImageIssue) => void;
  onToggleActive: (item: AdminImageIssue) => void;
}) {
  if (items.length === 0) return <EmptyAdminState title="이미지 이슈가 없습니다" body="검수 대기 이미지가 없습니다." />;

  return (
    <div className="admin-list image-list">
      {items.map((item) => {
        const draft = drafts[item.id] ?? toImageDraft(item);
        const saving = savingKey === `image:${item.id}` || savingKey === `status:${item.id}`;
        return (
          <article className="admin-row image-row" key={item.id}>
            <div className="admin-image-preview">
              {item.effectiveImageUrl ? (
                <img src={item.effectiveImageUrl} alt={`${item.name} 대표 이미지`} />
              ) : (
                <span>이미지 없음</span>
              )}
            </div>

            <div className="admin-image-body">
              <div className="admin-row-head">
                <div>
                  <div className="admin-row-title">
                    <strong>{item.name}</strong>
                    <span>{item.primaryAreaName ?? '지역 미확인'}</span>
                  </div>
                  <p>{item.slug ?? 'slug 없음'}</p>
                </div>
                <StatusPill value={item.imageStatus} />
              </div>

              <div className="admin-form-grid">
                <label className="wide">
                  수동 이미지 URL
                  <input
                    value={draft.imageUrlManual}
                    onChange={(event) => onDraft(item.id, { ...draft, imageUrlManual: event.target.value })}
                  />
                </label>
                <label>
                  상태
                  <select
                    value={draft.imageStatus}
                    onChange={(event) => onDraft(item.id, { ...draft, imageStatus: event.target.value as ImageStatus })}
                  >
                    {IMAGE_STATUS_OPTIONS.map((status) => (
                      <option value={status} key={status}>{statusLabel(status)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  메모
                  <input
                    value={draft.imageNote}
                    onChange={(event) => onDraft(item.id, { ...draft, imageNote: event.target.value })}
                  />
                </label>
              </div>

              {item.imageUrlScraped && (
                <p className="admin-source-url">수집 이미지: {item.imageUrlScraped}</p>
              )}

              <div className="admin-actions">
                <button className="admin-primary small" disabled={saving} onClick={() => onSave(item)}>
                  {saving ? '저장 중' : '저장'}
                </button>
                <button
                  className="admin-secondary small"
                  disabled={saving}
                  onClick={() => onDraft(item.id, { ...draft, imageStatus: 'OK' })}
                >
                  검수 완료 선택
                </button>
                <button className="admin-danger small" disabled={saving} onClick={() => onToggleActive(item)}>
                  {item.isActive ? '합주실 비활성화' : '합주실 활성화'}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function AuditLogList({ items }: { items: AdminAuditLog[] }) {
  if (items.length === 0) return <EmptyAdminState title="변경 이력이 없습니다" body="관리자 수정 내역이 아직 없습니다." />;

  return (
    <div className="admin-panel audit-panel">
      {items.map((item) => (
        <div className="audit-row" key={item.id}>
          <div>
            <strong>{item.action}</strong>
            <span>{item.targetType} #{item.targetId}</span>
          </div>
          <time>{item.createdAt ? formatDateTime(item.createdAt) : '-'}</time>
        </div>
      ))}
    </div>
  );
}

function EmptyAdminState({ title, body }: { title: string; body: string }) {
  return (
    <div className="admin-empty">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function StatusPill({ value }: { value: MappingStatus | ImageStatus }) {
  return <span className={`admin-status ${statusTone(value)}`}>{statusLabel(value)}</span>;
}

function mappingKey(item: AdminMappingIssue) {
  return `${item.kind}:${item.id}`;
}

function toMappingDraft(item: AdminMappingIssue): MappingDraft {
  return {
    externalKey: item.externalKey ?? '',
    url: item.url ?? '',
    mappingStatus: item.mappingStatus,
    mappingNote: item.mappingNote ?? '',
  };
}

function toImageDraft(item: AdminImageIssue): ImageDraft {
  return {
    imageUrlManual: item.imageUrlManual ?? '',
    imageStatus: item.imageStatus,
    imageNote: item.imageNote ?? '',
  };
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function tabTitle(tab: AdminTab) {
  switch (tab) {
    case 'mapping':
      return '매핑 큐';
    case 'images':
      return '이미지 큐';
    case 'logs':
      return '변경 이력';
    default:
      return '대시보드';
  }
}

function tabDescription(tab: AdminTab) {
  switch (tab) {
    case 'mapping':
      return '조회가 안 되는 장소와 방 식별자를 수정합니다.';
    case 'images':
      return '대표 이미지 수동 교체와 검수 상태를 관리합니다.';
    case 'logs':
      return '관리자가 바꾼 값을 최근순으로 확인합니다.';
    default:
      return '데이터 품질 상태를 한 번에 확인합니다.';
  }
}

function statusLabel(value: MappingStatus | ImageStatus) {
  const labels: Record<string, string> = {
    ACTIVE: '정상',
    NEEDS_MAPPING: '매핑 필요',
    DISABLED: '비활성',
    NOT_FOUND: '못 찾음',
    OK: '정상',
    MISSING: '이미지 없음',
    BAD: '불량',
    NEEDS_REVIEW: '검수 필요',
    MANUAL_OVERRIDE: '수동 이미지',
    HIDDEN: '숨김',
  };
  return labels[value] ?? value;
}

function statusTone(value: MappingStatus | ImageStatus) {
  if (value === 'ACTIVE' || value === 'OK' || value === 'MANUAL_OVERRIDE') return 'good';
  if (value === 'DISABLED' || value === 'HIDDEN' || value === 'NOT_FOUND') return 'muted';
  if (value === 'BAD' || value === 'MISSING' || value === 'NEEDS_MAPPING') return 'danger';
  return 'warn';
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
