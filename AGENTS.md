# AGENTS.md

이 저장소의 에이전트 규칙은 [CLAUDE.md](CLAUDE.md)에 정리되어 있다. 두 파일은 같은 규칙을 가리키므로 CLAUDE.md를 정본으로 본다.

핵심만 옮기면:

- **커밋 prefix는 대문자 + 콜론, 괄호(scope) 없음. front/back 구분 없음.**
  예: `FEAT: 즐겨찾기 추가`, `FIX: 스플래시 로고 크기 수정`, `CHORE: iOS 설정 변경`
  (`feat(web):`, `fix(ios):` 형태 금지)
- 허용 prefix: `PLAN` `DESIGN` `SPEC` `FEAT` `FIX` `REFACTOR` `STYLE` `TEST` `CHORE` `DOCS`
- 커밋 메시지는 한국어, "무엇을 왜" 한 줄 요약.
- 통합 브랜치는 `dev`. 기능은 `dev`에서 브랜치를 따서 `dev`로 PR. `main`(프로덕션)·`dev` 직접 푸시 지양.
- 브랜치명은 의미 있게(무엇을 하는지 드러나게) 짓는다.

자세한 내용·코드 규칙은 [CLAUDE.md](CLAUDE.md)와 [docs/04_개발/02_코딩_컨벤션.md](docs/04_개발/02_코딩_컨벤션.md) 참고.
