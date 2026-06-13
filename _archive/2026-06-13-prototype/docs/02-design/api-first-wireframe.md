# API-first Wireframe

초기 제품 표면은 API입니다. 웹 UI가 생기기 전까지 응답 구조를 기준으로 사용자 경험을 검토합니다.

## Availability List

```json
{
  "date": "2026-06-12",
  "items": [
    {
      "practiceRoom": {
        "id": "practice_room_id",
        "name": "합주실 이름",
        "area": "홍대"
      },
      "rooms": [
        {
          "id": "room_id",
          "name": "A룸",
          "availableSlots": [
            {
              "startTime": "14:00",
              "endTime": "15:00"
            }
          ]
        }
      ]
    }
  ]
}
```

