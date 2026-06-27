# AGENTS.md

이 저장소의 에이전트 규칙은 [CLAUDE.md](CLAUDE.md)에 정리되어 있다. 두 파일은 같은 규칙을 가리키므로 CLAUDE.md를 정본으로 본다.

핵심만 옮기면:

- **커밋 prefix는 대문자 + 콜론, 괄호(scope) 없음. front/back 구분 없음.**
  예: `FEAT: 즐겨찾기 추가`, `FIX: 스플래시 로고 크기 수정`, `CHORE: iOS 설정 변경`
  (`feat(web):`, `fix(ios):` 형태 금지)
- 허용 prefix: `PLAN` `DESIGN` `SPEC` `FEAT` `FIX` `REFACTOR` `STYLE` `TEST` `CHORE` `DOCS`
- 커밋 메시지는 한국어, "무엇을 왜" 한 줄 요약.
- 통합 브랜치는 `dev`. 기능은 `dev`에서 브랜치를 따서 `dev`로 PR. `main`(프로덕션)·`dev` 직접 푸시 지양.
- `dev`는 항상 `main`보다 앞서(또는 같게) 유지하고, 선형(일자) 히스토리를 지킨다. 머지할 때는 rebase를 우선하고, 애매하면 squash를 사용한다. 머지 커밋은 금지한다.
- 브랜치명은 의미 있게(무엇을 하는지 드러나게) 짓되, 뒤에 짧은 숫자·해시 suffix를 붙여 중복을 피한다(`fix-vercel-backend-load-ll89qg` 등).
- 개발 서버 URL을 안내할 때는 가능하면 `localhost` 대신 같은 네트워크의 휴대폰에서 접근 가능한 IP 주소를 우선 제공한다.
- 폰에서 로컬 웹을 확인할 때 실제 API는 프론트 상대경로(`/api/v1`) + Vite proxy로 Render 실 API에 붙인다. 로컬 API 확인 시에만 `VITE_DEV_API_PROXY_TARGET=http://127.0.0.1:3000`으로 덮어쓴다.
- 로컬에서 새 작업을 시작할 때는 현재 체크아웃을 직접 건드리지 말고 별도 `git worktree`를 만들어 그 안에서 브랜치를 딴다. 이미 작업 전용 worktree/브랜치 안이면 그대로 이어간다.

자세한 내용·코드 규칙은 [CLAUDE.md](CLAUDE.md)와 [docs/04_개발/02_코딩_컨벤션.md](docs/04_개발/02_코딩_컨벤션.md) 참고.
