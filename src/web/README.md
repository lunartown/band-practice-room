# 합주실 Web

Vite + React 기반 MVP 프론트엔드입니다.

## 실행

```bash
npm install
npm run dev -- --port 5174 --strictPort
```

현재 로컬 환경에서는 `localhost`가 다른 IPv6 프로세스로 붙을 수 있어 `http://127.0.0.1:5174/` 접속을 권장합니다.

## API 전환

기본값은 mock API입니다.

```bash
VITE_USE_MOCK_API=false VITE_API_BASE_URL=/api/v1 npm run dev
```

실제 백엔드 연결 시 `src/api/types.ts`의 `Slot.scrapedAt`, `Slot.freshness`, `Slot.area` 선택 필드까지 응답에 포함하면 디자인의 stale/확인 시각 표시를 그대로 사용할 수 있습니다.
