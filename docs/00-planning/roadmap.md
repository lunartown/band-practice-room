# Roadmap

## Phase 0. Project Setup

- 저장소 구조 확정
- 문서 폴더 구성
- 개발 스택과 실행 방식 결정

## Phase 1. Scraping PoC

- 네이버 예약 타겟 URL 1개 선정
- Playwright로 페이지 접근
- 날짜 선택, 방 목록, 시간대 상태 추출
- JSON 결과 포맷 정의

## Phase 2. Backend Foundation

- NestJS API 서버 생성
- PostgreSQL 연결
- 합주실, 방, 가용 시간대 테이블 설계
- 기본 조회 API 구현

## Phase 3. Scheduled Collection

- 스크래퍼 실행 잡 구성
- 오늘/내일 데이터 주기적 갱신
- 실패 로그와 재시도 정책 정리

## Phase 4. Expansion

- 대상 합주실 10~20곳으로 확대
- 페이지 구조 차이 정리
- 스크래퍼 어댑터 분리

## Phase 5. Product Surface

- 간단한 웹 UI 또는 내부 대시보드 검토
- 지역/날짜/시간 필터 추가

