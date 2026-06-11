# Data Model

## practice_rooms

합주실 단위의 정보를 저장합니다.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| name | text | 합주실 이름 |
| area | text | 지역 |
| address | text | 주소 |
| source_type | text | naver, spacecloud, website |
| source_url | text | 원본 예약 URL |
| is_active | boolean | 수집 대상 여부 |
| created_at | timestamptz | 생성 시각 |
| updated_at | timestamptz | 수정 시각 |

## rooms

합주실 내부 방 정보를 저장합니다.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| practice_room_id | uuid | practice_rooms.id |
| name | text | 방 이름 |
| description | text | 설명 |
| capacity | integer | 수용 인원 |
| is_active | boolean | 노출 여부 |
| created_at | timestamptz | 생성 시각 |
| updated_at | timestamptz | 수정 시각 |

## availability_slots

날짜별 방 예약 가능 상태를 저장합니다.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| room_id | uuid | rooms.id |
| date | date | 기준 날짜 |
| start_time | time | 시작 시간 |
| end_time | time | 종료 시간 |
| status | text | available, unavailable, unknown |
| price | integer | 가격 |
| scraped_at | timestamptz | 수집 시각 |
| source_snapshot_id | uuid | 원본 스냅샷 참조 |

## scrape_runs

스크래핑 실행 이력을 저장합니다.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| practice_room_id | uuid | practice_rooms.id |
| target_date | date | 수집 대상 날짜 |
| status | text | success, failed, partial |
| started_at | timestamptz | 시작 시각 |
| finished_at | timestamptz | 종료 시각 |
| error_message | text | 실패 원인 |

