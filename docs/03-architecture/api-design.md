# API Design

## GET /availability

특정 날짜의 합주실별 예약 가능 시간대를 반환합니다.

### Query

| Name | Required | Example |
| --- | --- | --- |
| date | yes | 2026-06-12 |
| area | no | hongdae |

### Response

```json
{
  "date": "2026-06-12",
  "items": []
}
```

## GET /practice-rooms

수집 대상 합주실 목록을 반환합니다.

## GET /practice-rooms/:id/availability

특정 합주실의 날짜별 예약 가능 시간대를 반환합니다.

