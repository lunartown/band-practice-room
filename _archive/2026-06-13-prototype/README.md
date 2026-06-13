# Band Practice Room

합주실 예약 가능 시간대를 한 곳에서 조회하기 위한 서비스입니다.

## MVP

- 서울 주요 합주실 10~20곳의 예약 가능 시간대 통합 조회
- 오늘/내일 기준 빈 방과 시간대 확인
- 초기 데이터 소스는 네이버 예약 페이지 스크래핑
- API 우선 개발, 프론트엔드는 후순위

## Repository Layout

```txt
apps/
  api/                 # NestJS API 서버
  web/                 # 추후 프론트엔드 앱
packages/
  scraper/             # Playwright 기반 스크래핑 패키지
  shared/              # 공용 타입, 유틸리티
docs/
  00-planning/         # 기획, MVP 범위, 로드맵
  01-research/         # 대상 합주실, 플랫폼 조사, 스크래핑 관찰
  02-design/           # IA, 화면 흐름, UX 초안
  03-architecture/     # 시스템 설계, DB, API, 스크래퍼 구조
  04-development/      # 개발 태스크, 컨벤션, 로컬 실행
  05-operations/       # 배포, 운영, 모니터링, 장애 대응
infra/
  docker/              # Docker 관련 파일
  database/            # DB 초기화, 마이그레이션 보조 자료
scripts/               # 개발/운영 자동화 스크립트
```

## Current Focus

1. 네이버 예약 페이지 1곳을 대상으로 스크래핑 PoC 작성
2. 예약 가능 시간대 JSON 구조 확정
3. DB 스키마 설계
4. 조회 API 초안 구현

