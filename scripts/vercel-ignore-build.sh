#!/usr/bin/env bash
# Vercel "Ignored Build Step" 용 스크립트.
# 규칙: exit 1 = 빌드 진행, exit 0 = 빌드 건너뜀.
#
# 목적: 프리뷰(브랜치) 배포를 src/web(프런트)가 실제로 바뀐 PR에만 띄운다.
#   - 빌트인 옵션은 "그 브랜치의 직전 배포"와 비교해서, 새 브랜치 첫 빌드는
#     비교 대상이 없어 무조건 빌드된다(= docs/design/백엔드 PR도 다 뜸).
#   - 이 스크립트는 dev를 fetch해 머지베이스(origin/dev...HEAD) 기준으로 보므로
#     새 브랜치 첫 빌드부터 정확히 걸러진다.
#
# Vercel 대시보드 설정:
#   Settings → Build and Deployment → Ignored Build Step
#   Behavior: "Run my Bash script", Command: bash ../../scripts/vercel-ignore-build.sh
#   (경로 오류가 나면 bash scripts/vercel-ignore-build.sh 로 시도)
set -uo pipefail

# 어디서 실행되든 저장소 루트 기준으로 동작시킨다.
cd "$(git rev-parse --show-toplevel)" || exit 1

ref="${VERCEL_GIT_COMMIT_REF:-}"

# dev·main은 항상 빌드한다(프로덕션 + dev 고정 URL).
if [ "$ref" = "main" ] || [ "$ref" = "dev" ]; then
  echo "build: $ref (always)"
  exit 1
fi

# dev를 가져와(얕은 클론 대비 depth 지정) 머지베이스 기준으로 src/web 변경 여부 확인.
git fetch origin dev --depth=200 >/dev/null 2>&1 || true

if git diff --quiet origin/dev...HEAD -- src/web; then
  echo "skip: src/web 변경 없음 (vs dev)"
  exit 0
fi

echo "build: src/web 변경 있음 (vs dev)"
exit 1
