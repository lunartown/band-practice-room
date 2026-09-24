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

개발 서버에서 `/api`는 기본적으로 Render prod API(`https://hapjusil-api.onrender.com`)로 프록시된다. 휴대폰 브라우저가 직접 Render API를 호출하면 CORS에 막힐 수 있으므로, 로컬 웹에서는 상대경로(`/api/v1`)를 유지한다.

로컬 API를 의도적으로 확인할 때만 proxy 타깃을 덮어쓴다.

```bash
VITE_USE_MOCK_API=false VITE_API_BASE_URL=/api/v1 \
VITE_DEV_API_PROXY_TARGET=http://127.0.0.1:3000 \
npm run dev
```

Render dev API(`https://hapjusil-api-dev.onrender.com`)와 Render Postgres dev DB를 확인할 때도 proxy 타깃만 바꾼다.

```bash
VITE_USE_MOCK_API=false VITE_API_BASE_URL=/api/v1 \
VITE_DEV_API_PROXY_TARGET=https://hapjusil-api-dev.onrender.com \
npm run dev
```

## 접속 URL의 초기 검색 조건

웹 접속 시 쿼리 파라미터로 초기 검색 조건을 지정할 수 있다.

```text
https://hapjusil.com/?date=2026-10-03&from=18&to=22&people=5
```

- `date`: `YYYY-MM-DD`. 한국 날짜 기준 오늘부터 29일 뒤까지.
- `from`, `to`: 시작·종료 시각을 함께 지정. 정수 시각 또는 `HH:00` 형식이며 시작은 0~23, 종료는 1~24, 시작 < 종료.
- `people`: 1~10명.
- `duration`: 연속 이용시간 1~4시간.
- `areaIds`, `studioIds`: 지역·합주실의 양의 정수 ID. 쉼표로 구분하거나 키를 반복한다(예: `areaIds=1,2` 또는 `areaIds=1&areaIds=2`). ID는 `/api/v1/areas`, `/api/v1/studios`에서 확인한다.
- `minPrice`, `maxPrice`: 시간당 가격 0~50000원 정수. 각각 0원·50000원은 하한·상한 제한 없음. 최솟값 > 최댓값이면 두 값 모두 무시한다.

유효한 조건이 하나라도 있으면 저장된 검색 조건보다 우선하고, 생략하거나 잘못 입력한 항목에는 기본값을 사용한다. 유효한 조건이 하나도 없으면 기존 세션 조건 복원·기본값 흐름을 유지한다. UTM 등 다른 파라미터는 검색 조건으로 사용하지 않는다.

URL은 최초 화면을 열 때만 읽는다. 화면에서 검색 조건을 바꾸어도 URL은 변경하지 않는다. 같은 URL을 새로고침하면 URL 조건을 다시 적용한다. 앱의 외부 링크 연동은 포함하지 않는다.

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
