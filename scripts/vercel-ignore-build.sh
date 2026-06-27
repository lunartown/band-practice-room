#!/usr/bin/env bash
# Vercel "Ignored Build Step" 용 스크립트.
# 규칙: exit 1 = 빌드 진행, exit 0 = 빌드 건너뜀.
#
# 목적: 프리뷰(브랜치) 배포를 src/web(프런트)가 실제로 바뀐 PR에만 띄운다.
#   - 빌트인 옵션은 "그 브랜치의 직전 배포"와 비교해 새 브랜치 첫 빌드를 못 막는다.
#   - 그래서 dev를 기준으로 src/web 변경 여부를 직접 본다(첫 빌드부터 적용).
#
# Vercel은 shallow clone이라 cross-branch 비교가 까다롭다. 그래서:
#   - 명시적 refspec으로 dev를 트래킹 ref(refs/remotes/origin/dev)에 받고,
#   - merge-base가 필요한 3점(...) 대신 2점 비교로 트리 차이만 본다.
#   - dev를 못 받으면 안전하게 빌드한다(놓치는 것보단 한 번 더 빌드).
#
# Vercel 대시보드: Settings → Build and Deployment → Ignored Build Step
#   Behavior: "Run my Bash script"
#   Command:  bash "$(git rev-parse --show-toplevel)/scripts/vercel-ignore-build.sh"
set -uo pipefail

# pathspec(-- src/web)이 맞으려면 저장소 루트에서 실행해야 한다.
root="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "build: git 루트 못 찾음 → 빌드"; exit 1; }
cd "$root" || { echo "build: cd 실패 → 빌드"; exit 1; }

ref="${VERCEL_GIT_COMMIT_REF:-}"
echo "ignore-build: ref='$ref' sha='${VERCEL_GIT_COMMIT_SHA:-?}'"

# dev·main은 항상 빌드(프로덕션 + dev 고정 URL).
if [ "$ref" = "main" ] || [ "$ref" = "dev" ]; then
  echo "build: $ref (always)"
  exit 1
fi

# dev를 비교 기준으로 확보(명시적 refspec → refs/remotes/origin/dev 생성).
if git fetch --depth=500 origin dev:refs/remotes/origin/dev >/dev/null 2>&1; then
  echo "fetched origin/dev for comparison"
else
  echo "build: dev fetch 실패 → 안전하게 빌드"
  exit 1
fi

# 2점 비교(merge-base 불필요): dev 대비 src/web 트리 차이만 본다.
if git diff --quiet origin/dev HEAD -- src/web; then
  echo "skip: src/web 변경 없음 (vs dev)"
  exit 0
fi

echo "build: src/web 변경 있음 (vs dev)"
exit 1
