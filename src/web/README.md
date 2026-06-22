# 합주실 Web

Vite + React 기반 MVP 프론트엔드입니다.

## 실행

```bash
npm install
npm run dev
```

`dev` 스크립트는 `vite --host 0.0.0.0`으로 실행된다. 로컬에서 `localhost`가 다른 IPv6 프로세스로 붙는 경우 `http://127.0.0.1:5173/` 로 접속한다.

## API 전환

기본값은 mock API다(`VITE_USE_MOCK_API` 미설정 시 mock).

```bash
VITE_USE_MOCK_API=false VITE_API_BASE_URL=/api/v1 npm run dev
```

실제 백엔드 응답에는 `scrapedAt`이 포함되지만, 이는 **내부 운영용 값일 뿐 화면에 노출하지 않는다**. 데이터 신선도/마지막 확인 시각/stale 상태는 사용자에게 표시하지 않는다(의사결정 로그 2026-06-21). 신선함은 제품이 주기 수집으로 보장하고, 사용자는 당연히 신선하다고 믿고 쓴다.
