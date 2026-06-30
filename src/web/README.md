# 합주실 Web

Vite + React 기반 MVP 프론트엔드입니다.

## 실행

```bash
npm install
npm run dev
```

`dev` 스크립트는 `vite --host 0.0.0.0`으로 실행된다. 휴대폰에서 확인할 때는 같은 네트워크의 Mac IP로 접속한다.

```bash
ipconfig getifaddr en0
# 예: http://192.168.x.x:5173/
```

## API 전환

기본값은 mock API다(`VITE_USE_MOCK_API` 미설정 시 mock).

```bash
VITE_USE_MOCK_API=false VITE_API_BASE_URL=/api/v1 npm run dev
```

개발 서버에서 `/api`는 기본적으로 Render 실 API(`https://hapjusil-api.onrender.com`)로 프록시된다. 휴대폰 브라우저가 직접 Render API를 호출하면 CORS에 막힐 수 있으므로, 로컬 웹에서는 상대경로(`/api/v1`)를 유지한다.

로컬 API를 의도적으로 확인할 때만 proxy 타깃을 덮어쓴다.

```bash
VITE_USE_MOCK_API=false VITE_API_BASE_URL=/api/v1 \
VITE_DEV_API_PROXY_TARGET=http://127.0.0.1:3000 \
npm run dev
```

Render dev API(`https://hapjusil-api-dev.onrender.com`)를 확인할 때도 proxy 타깃만 바꾼다.

```bash
VITE_USE_MOCK_API=false VITE_API_BASE_URL=/api/v1 \
VITE_DEV_API_PROXY_TARGET=https://hapjusil-api-dev.onrender.com \
npm run dev
```

## 네이티브 앱 실행

기본 네이티브 실행은 스토어 앱을 덮지 않는 `local` variant다.

```bash
npm run app:ios      # com.hapjusil.app.local
npm run app:android  # com.hapjusil.app.local
```

dev OTA 테스트 앱은 `app:ios:dev` / `app:android:dev`, 스토어 제출용 앱은
`app:ios:prod` / `app:android:prod` 를 명시적으로 사용한다.
iOS의 `app:ios` / `app:ios:dev` 는 Xcode를 열어 scheme을 고르게 하지 않고
각각 `Hapjusil Local` / `Hapjusil Dev` scheme으로 바로 설치한다.

variant를 바꾸면 `cap sync`가 복사하는 `capacitor.config.json`도 바뀐다.
따라서 Xcode scheme이나 Android flavor를 바꿀 때는 같은 variant의
`app:sync:*` 또는 `app:ios:*` / `app:android:*` 를 다시 실행한다.

실제 백엔드 응답에는 `scrapedAt`이 포함되지만, 이는 **내부 운영용 값일 뿐 화면에 노출하지 않는다**. 데이터 신선도/마지막 확인 시각/stale 상태는 사용자에게 표시하지 않는다(의사결정 로그 2026-06-21). 신선함은 제품이 주기 수집으로 보장하고, 사용자는 당연히 신선하다고 믿고 쓴다.
