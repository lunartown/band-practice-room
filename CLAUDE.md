# AGENTS.md / CLAUDE.md

이 저장소에서 작업하는 에이전트(Claude / Codex 등)를 위한 규칙. 사람도 동일하게 따른다.
이 규칙 문서는 `AGENTS.md`와 `CLAUDE.md`에 같은 내용으로 유지한다.

## 대화 원칙

- 사용자에게 항상 존댓말을 사용한다.
- 응답은 차분하고 직접적인 문장으로 작성한다.
- 욕설, 비속어, 조롱하는 표현을 쓰지 않는다.
- `ㅋㅋ`, `ㅎㅎ`, `lol`처럼 웃음을 나타내는 표현을 쓰지 않는다.

## 프로젝트 개요

합주실 예약 가능 시간대를 한곳에서 조회하는 서비스(도메인: hapjusil.com). 자세한 현황·문서 네비게이션은 [README.md](README.md) 참고.

- `src/scraper` — 네이버/스페이스클라우드 예약 가능 시간 수집 (GitHub Actions cron)
- `src/api` — Nest/Nest 풍 백엔드, ORM 없이 SQL 직접 작성 (Render + Neon Postgres)
- `src/web` — Vite + React 프런트엔드 (Vercel), Capacitor로 iOS·Android 패키징

## 토큰 비용이 큰 작업

- Chrome/브라우저 제어, 대형 DOM 스냅샷, 긴 문서·로그 전체 출력, 장시간 웹 탐색, 이미지·영상 분석, 대량 파일 읽기, 멀티 에이전트처럼 토큰을 극단적으로 많이 쓸 수 있는 작업은 가급적 실행 전에 사용자에게 허락을 받는다.
- 장애 대응처럼 시간이 중요한 경우에도 먼저 `curl`, `gh`, `rg`, 짧은 로그 조회 등 저비용 확인 수단을 우선 사용한다.
- 고비용 도구가 꼭 필요하면 어떤 도구를 왜 써야 하는지 짧게 설명하고 허락을 구한다.
- 사용자가 이미 해당 고비용 도구 사용을 명시적으로 요청했거나, 저비용 확인만으로는 복구가 막히고 즉시 조치가 필요한 경우에는 진행할 수 있다. 이때는 사후에 어떤 고비용 작업을 했는지 간단히 보고한다.

## 로컬 확인 URL 안내

- 개발 서버 URL을 사용자에게 안내할 때는 가능하면 `localhost` 대신 같은 네트워크의 휴대폰에서 접근 가능한 IP 주소를 우선 제공한다. 이 프로젝트는 모바일 확인 작업이 잦다.
- 예: `http://192.168.x.x:5173/`
- IP 확인이 어렵거나 로컬 전용 작업이면 `localhost`를 보조로 안내한다.
- 폰에서 로컬 웹을 볼 때 브라우저의 `localhost`는 Mac이 아니라 폰 자신이다. 실제 데이터를 볼 때는 프론트 `VITE_API_BASE_URL`을 상대경로(`/api/v1`)로 두고, Vite proxy가 Render API로 넘기게 한다(CORS 회피).
- 로컬에서 프론트만 prod 데이터로 확인할 때는 기본 proxy(Render prod API)를 쓴다. 백엔드/dev DB까지 확인할 때만 `VITE_DEV_API_PROXY_TARGET=https://hapjusil-api-dev.onrender.com` 또는 `http://127.0.0.1:3000`으로 덮어쓴다. `localhost`는 Node에서 IPv6 `::1`로 해석될 수 있으므로 로컬 API 타깃에는 `127.0.0.1`을 쓴다.
- 배포 환경은 `main=prod 프론트→prod API/DB`, `dev=dev 프론트→dev API/DB`, `stg=stg 프론트→prod API/DB`로 둔다. Vercel 무료 플랜 rate limit 때문에 기능 브랜치는 Vercel에 올리지 말고 로컬에서 확인한 뒤 `dev`로 PR한다. 설정 근거는 [docs/04_개발/03_배포_전략.md](docs/04_개발/03_배포_전략.md) "프리뷰 배포 필터" 참고.

## 커밋 규칙

**핵심: prefix는 대문자 + 콜론, 괄호(scope) 붙이지 않는다. front/back 구분도 하지 않는다.**

```
FEAT: 즐겨찾기·햅틱·네이티브 공유 추가
FIX: 스플래시 로고 크기 적정화
CHORE: iOS 수출 규정 면제 키 추가
```

- 형식: `PREFIX: <한 줄 요약>` — `feat(web):`, `fix(ios):` 같은 소문자·괄호 형태를 쓰지 않는다.
- 본문(요약 포함)은 한국어로 "무엇을 왜" 한 줄로 적는다.
- web/api/scraper 등 어느 패키지를 고쳤는지로 prefix를 나누지 않는다. 변경의 **성격**으로만 고른다.

허용 prefix:

| Prefix | 용도 |
| --- | --- |
| `PLAN:` | 계획·로드맵 |
| `DESIGN:` | 디자인 결정·시안 |
| `SPEC:` | 기획·요구사항·명세 |
| `FEAT:` | 기능 추가 |
| `FIX:` | 버그 수정 |
| `REFACTOR:` | 동작 변화 없는 구조 개선 |
| `STYLE:` | 포맷·UI 스타일 (동작 변화 없음) |
| `TEST:` | 테스트 추가·수정 |
| `CHORE:` | 빌드·설정·잡일 |
| `DOCS:` | 문서 |

- 의미 있는 변경마다 묻지 말고 알아서 커밋한다.
- remote가 있으면 자동으로 push한다. 단 force push는 먼저 확인한다.

## 브랜치 전략

- `dev`가 통합 브랜치다. 기능 작업은 **`dev`에서 브랜치를 따서** 진행하고 **`dev`로 PR**을 올린다. 직접 푸시는 피한다.
- `stg`는 프론트 변경을 prod API/DB에 붙여 확인하는 장기 브랜치다. 백엔드·DB 검증은 `dev`, 프론트 실데이터 확인은 `stg`로 역할을 나눈다.
- `main`은 배포(프로덕션) 브랜치다. 검증 끝난 `dev`를 `main`으로 머지해 릴리스한다. `main` 직접 푸시는 하지 않는다.
- **`dev`는 항상 `main`보다 앞서(또는 같게) 유지한다.** `main`에 핫픽스가 들어가면 곧바로 `main`을 `dev`에 리베이스로 따라잡혀, `dev`가 `main`보다 뒤처지지 않게 한다.
- **선형(일자) 히스토리를 유지한다.** 머지할 때는 rebase를 우선하고, 애매하면 squash를 사용한다. 머지 커밋은 금지한다.
- 브랜치명은 의미 있게 짓되 **뒤에 짧은 숫자·해시 suffix를 붙여 중복을 피한다.** 무엇을 하는지 드러나는 이름 + 구분자(`fix-vercel-backend-load-ll89qg`, `feat-favorite-share-2` 등)를 쓰고, 의미 없는 해시·번호만으로 짓지는 않는다.
- 로컬에서 새 작업을 시작할 때는 현재 체크아웃을 직접 건드리지 말고 **별도 `git worktree`를 만들어 그 안에서 브랜치를 딴다.** 예: `git worktree add ../band-practice-room-<branch> -b <branch> dev`. 이미 작업 전용 worktree/브랜치 안에 있다면 그대로 이어가되, 다른 사람이 쓰는 worktree의 파일을 섞어서 수정하지 않는다.
- PR 머지 후 더 이상 쓰지 않는 로컬 worktree는 `git worktree remove <path>`로 정리하고, 필요하면 `git worktree prune`을 실행한다.

## 코드 규칙 (요약)

전체는 [docs/04_개발/02_코딩_컨벤션.md](docs/04_개발/02_코딩_컨벤션.md) 참고.

- 모든 패키지 TypeScript + ESM. 상대 import는 확장자 `.js`를 붙인다.
- 실행은 `tsx`, 배포 빌드만 `tsc`. API는 ORM 없이 SQL 직접 작성(쿼리는 repository 계층).
- 별도 ESLint/Prettier 없음 — 주변 코드 관행(2칸 들여쓰기, 작은따옴표)을 따른다.
