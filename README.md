# TRUPASS-FE

Trupass — "말 한 번으로 떠나고, 결제는 서명 한 번" AI 여행 패키지 서비스의 프론트엔드입니다.

> **화면**은 디자인까지 입혀져 있고, 지금은 예시 데이터로 채워져 있습니다
> (랜딩 → 로그인 → 회원 정보 → 검색 → 결과 → 장소 → 결제 → 내 여행).
> **API 연동**은 뼈대가 따로 있습니다 (OpenAPI 타입 생성, MSW Mock, 요청 → 패키지 → 승인 → 진행 상태).
> 디자인된 화면에 API 를 붙이면서 뼈대 페이지를 하나씩 합쳐 갑니다. 실제 패스키·토스 연동은 아직 없습니다.

## 5분 온보딩

### 1. Node / pnpm 설치

- **Node 26 (Active LTS)** — 버전은 `.nvmrc` 에 고정되어 있습니다.
- **pnpm 12** — 버전은 `package.json` 의 `packageManager` 에 고정되어 있습니다.

```bash
nvm install && nvm use      # .nvmrc 의 Node 26 사용
npm i -g pnpm@12.18.0       # Node 26 에는 corepack 이 기본 포함되지 않습니다
pnpm install
```

### 2. 환경 변수

```bash
cp .env.example .env.local
```

| 키                     | 설명                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`    | 백엔드(Spring Boot) 주소. 기본 `http://localhost:8080`                             |
| `VITE_USE_MOCK`        | `true` 면 MSW 가 API 를 가로채 Mock 응답을 돌려줍니다                              |
| `VITE_TOSS_CLIENT_KEY` | 토스페이먼츠 **클라이언트 키**(공개 키). **시크릿 키는 절대 FE 에 넣지 않습니다.** |

`VITE_` 로 시작하는 값은 빌드 결과물(브라우저)에 그대로 노출됩니다. 비밀 값은 넣지 마세요.

### 3. 실행

```bash
pnpm dev
```

http://localhost:5173 을 열면 랜딩부터 결제 완료 · 내 여행까지 디자인된 화면을 눌러 볼 수 있습니다.
이 화면들은 예시 데이터로 그리므로 백엔드와 Mock 설정 없이도 동작합니다.

**API 연동 뼈대 — Mock 모드** (백엔드 없이 개발) — `.env.local` 에 `VITE_USE_MOCK=true`

http://localhost:5173/chat → 대화 → 패키지 비교 → 승인 → 진행 상태 순서로 이동할 수 있고,
진행 상태 페이지는 폴링할 때마다 Mock Saga 단계가 하나씩 진행됩니다.

Mock 시나리오는 URL 쿼리로 바꿀 수 있습니다.

| 쿼리                             | 결과                                             |
| -------------------------------- | ------------------------------------------------ |
| (없음) / `?mockScenario=SUCCESS` | 모든 단계 성공 → `COMPLETED`                     |
| `?mockScenario=SOLD_OUT`         | 숙소 HOLD 실패(매진) → 항공 HOLD 보상 → `FAILED` |
| `?mockScenario=MANUAL_REVIEW`    | 숙소 PAY 실패 → `NEEDS_MANUAL_REVIEW`            |

예: `http://localhost:5173/checkout/demo?mockScenario=SOLD_OUT`

**API 연동 뼈대 — 실서버 모드** — 백엔드를 `http://localhost:8080` 에 띄우고 `.env.local` 에 `VITE_USE_MOCK=false`

> 백엔드에서 `http://localhost:5173` 에 대한 CORS 를 허용해야 합니다.

## 스크립트

| 명령                    | 설명                                                        |
| ----------------------- | ----------------------------------------------------------- |
| `pnpm dev`              | 개발 서버                                                   |
| `pnpm build`            | 타입 체크 + 프로덕션 빌드                                   |
| `pnpm lint`             | ESLint                                                      |
| `pnpm typecheck`        | TypeScript 타입 체크                                        |
| `pnpm test`             | Vitest (watch). CI 에서는 `pnpm test --run`                 |
| `pnpm test:flow`        | 빌드한 앱을 실제 브라우저로 눌러 보는 흐름 검사 (아래 참고) |
| `pnpm format`           | Prettier                                                    |
| `pnpm gen:api`          | `openapi/trupass.yaml` → `src/shared/api/schema.d.ts` 생성  |
| `pnpm gen:api --remote` | `${VITE_API_BASE_URL}/v3/api-docs` (백엔드) → 타입 생성     |

## 화면

| 경로               | 화면                                                            |
| ------------------ | --------------------------------------------------------------- |
| `/`                | 랜딩 — 스크롤 소개와 항공 · 숙소 · 체험 문장 입력               |
| `/login`           | 로그인 — Google 계정으로 계속하기                               |
| `/signup`          | 회원 정보 입력 (최초 1회)                                       |
| `/search`          | 새 검색 (로그인 후)                                             |
| `/search/progress` | 검색 중 — 지구본 위 비행기와 호텔                               |
| `/results`         | 검색 결과 — 항공권과 숙소 조합. `?rev=2` 는 수정 요청 뒤의 결과 |
| `/places`          | 숙소 주변 추천 장소                                             |
| `/pay/mandate`     | 결제 권한 등록 (첫 결제 때 한 번)                               |
| `/pay/checkout`    | 결제 확인                                                       |
| `/pay/processing`  | 결제 진행                                                       |
| `/pay/complete`    | 결제 완료                                                       |
| `/trips`           | 내 여행                                                         |
| `/styleguide`      | 디자인 기준 — 색 · 글꼴 · 컴포넌트 · 움직임을 한 장에 모은 문서 |

아래는 API 연동 뼈대 페이지입니다. 위 화면에 API 를 붙이면서 하나씩 합칩니다.

| 경로                            | 페이지         |
| ------------------------------- | -------------- |
| `/chat`                         | 대화           |
| `/packages/:requestId`          | 패키지 비교    |
| `/checkout/:checkoutId/approve` | 승인           |
| `/checkout/:checkoutId`         | 진행·결과      |
| `/payments/success`             | 토스 결제 성공 |
| `/payments/fail`                | 토스 결제 실패 |

## 디자인 시스템

- **스타일** — `src/styles/` 의 `tokens.css`(색 · 글자 · 간격 토큰과 바탕 규칙), `components.css`(버튼 · 입력 · 패널 등),
  `screens.css`(화면별 배치)입니다. `src/index.css` 에서 Tailwind 의 `components` 층으로 불러옵니다.
- **적용 범위** — 바탕 규칙(`div` 를 세로 flex 로 두는 것 등)은 `body.tp` 아래에만 걸립니다.
  `DesignLayout` 이 `tp` 를 붙이므로 디자인된 화면에만 적용되고, Tailwind 로 만든 뼈대 페이지(`RootLayout`)에는 영향을 주지 않습니다.
- **클래스** — 디자인된 화면은 Tailwind 유틸리티 대신 디자인 시스템의 클래스(`row`, `g12`, `t-sm`, `btn` …)를 씁니다.
  쓸 수 있는 클래스와 컴포넌트의 모습은 `/styleguide` 에서 볼 수 있습니다.
  - 조건에 따라 붙는 클래스는 `cx()`(`src/shared/lib/cx.ts`)로 잇습니다.
    Prettier 의 Tailwind 플러그인이 `className` 문자열의 앞뒤 공백을 지우기 때문에 `` `sl${on ? ' on' : ''}` `` 처럼 공백에 기대는 문자열은 깨집니다.
  - Tailwind 유틸리티와 이름이 같은 클래스는 Tailwind 쪽이 이깁니다(층 순서). 지금 겹치는 이름은 `grow` 하나이고,
    `src/index.css` 에서 Tailwind 가 이 이름을 만들지 않게 막아 두었습니다. 겹치는 이름이 더 생기면 같은 곳에 더합니다.
- **그림 크기** — Tailwind 의 preflight 가 `img { height: auto }` 를 걸기 때문에 `height` 속성만으로는 높이가 고정되지 않습니다.
  크기를 못 박아야 하는 그림은 CSS 나 `style` 로 높이를 줍니다(예: `AirlineLogo`).
- **공용 컴포넌트** — `src/shared/ui/` 의 `Button`, `Field`(Input · Select), `Check`(Checkbox · Radio · OptionTile),
  `Status`(Status · Tag · Kv · Note), `Steps`, `PageHead`, `Ask`(문장 입력), `Dock`(수정 요청), `Icon`, `Logo`, `BrandMark` 입니다.
- **예시 데이터** — `src/shared/sample/data.ts` 한 곳에 있습니다. API 를 붙이면서 걷어 낼 대상입니다.
  결과 화면의 합계도 지금은 예시 데이터에서 더해서 보여 줍니다. API 를 붙일 때 백엔드가 준 금액으로 바꿉니다(아래 원칙).
- **움직임** — 랜딩의 스크롤 연출은 `src/features/landing/scroll.ts`, 검색 중 화면의 지구본은 `src/features/search/globe.ts`,
  로그인으로 넘어갈 때의 구름 장막은 `src/app/layout/useLeave.ts` 에 있습니다. 움직임 줄이기를 켠 기기에서는 최종 상태만 보여 줍니다.
- **정지 화면** — 주소 끝에 `#still` 을 붙이면 자동 이동과 움직임을 멈춘 화면이 나옵니다. 화면을 찍어 비교할 때 씁니다.
- **로고 · 파비콘** — `scripts/logo/trupass-logo.webp`(팀이 만든 원본)에서 `python3 scripts/logo/make-logo.py` 로 만듭니다
  (Pillow · numpy 필요). 화면의 로고는 `Logo` 컴포넌트를 씁니다.
- **출처** — 사진 · 지도 · 아이콘 · 글꼴 · 회사 마크의 출처와 라이선스는 `public/CREDITS.md` 에 있습니다.

## 화면의 현재 상태

디자인된 화면은 **도쿄 3박 예시 데이터 한 벌**로 그립니다. 어디까지 동작하고 무엇이 아직 모양뿐인지 적어 둡니다.

- **동작하는 것** — 랜딩의 스크롤 움직임과 이용 방법 상자, 문장 입력과 엔터 이동, 회원 정보 폼의 입력과 선택, 지구본,
  결과 화면의 항공권 · 숙소 · 추가 선택과 합계, 수정 요청 독, 결제 단계 이동. 전부 키보드로도 됩니다.
- **적은 문장** — 다음 화면(로그인 · 검색 중 · 결과)의 "적어 둔 문장"에 그대로 나옵니다(`sessionStorage`).
  검색 결과는 문장과 무관하게 같은 예시 데이터이고, 결과 화면에서 고른 조합도 다음 화면으로 넘어가지 않습니다.
  장소 화면부터는 기본 조합(대한항공 KE 703 + 우에노 스테이 인)으로 고정되어 있습니다.
- **모양만 있는 것** — 바깥 사이트로 이어지는 자리(Google 지도에서 열기, 후기 검색), 상단의 `결제 내역` · 알림 · 계정 메뉴,
  모바일 폭의 메뉴 단추, 약관 `[보기]`, 결제수단 `[변경]`. 모바일에서 내 여행은 결제 완료 화면의 버튼으로 갑니다.
- **없는 화면** — 검색 결과 없음, 권한 초과, 요금 변동, 재고 마감, 결제 실패 같은 예외 화면.

### 가정한 것과 확인이 필요한 것

- 랜딩의 숫자(연동 API 6개, 항공편 23건, 숙소 조합 9가지, 약 30초)는 예시 검색 한 건에서 나온 값입니다.
  실제 수치가 정해지면 `src/shared/sample/data.ts` 의 `STATS` 를 바꿉니다. 화면에도 예시 값이라고 적혀 있습니다.
- 항공사(대한항공 · 제주항공)와 요금 조회처 · 지도 · 후기 사이트는 실제 회사 이름을 씁니다.
  **연동을 가정한 예시이며 제휴 관계가 아닙니다.** 편명 · 시각 · 요금 · 평점은 예시 값입니다.
  연동할 곳이 정해지면 `src/shared/ui/brands.ts` 와 예시 데이터를 바꿉니다.
- 숙소와 음식점 이름, 결제 카드 이름은 가상입니다. 미술관 · 명소는 실제 장소이고 거리는 좌표로 계산했습니다.
- 문장 세 개(항공 · 숙소 · 체험)의 질문과 예시 문구는 예시 데이터의 `PROMPTS`, 지구본의 출발 · 도착은 `ROUTE` 에서 정합니다.
  지금은 대한민국 → 일본 고정이고, 확대해 그릴 수 있는 정밀 경계는 동아시아 5개국만 들어 있습니다(`src/assets/geo/world.json`).
- 지도는 실제 화면에서 Google 지도를 쓴다는 전제로 "Google 지도에서 열기" 자리를 두었습니다.
  지금의 지도 그림은 OpenStreetMap 자료로 만든 것이고, 화면의 지도 아래에도 그렇게 적혀 있습니다.
- 장소별 평점 · 후기 수 · 후기 제목은 예시 값이고, 후기 썸네일은 자리를 보여 주는 사진이지 실제 후기 사진이 아닙니다.
- 결제 권한 등록(`/pay/mandate`)은 "미리 서명해 둔 결제 권한"이 있으려면 처음 한 번은 등록해야 해서 첫 결제 직전에 둔 화면입니다.
- Google 로그인 버튼은 실제 구현에서 Google 의 공식 버튼 규격을 따라야 합니다.
- 로고는 팀이 만든 그림(webp)을 벡터로 옮긴 것입니다. 원본 벡터 파일(SVG · AI)이 있으면 그것을 기준으로 바꾸는 편이 낫습니다.

### 피그마

같은 화면이 피그마 파일에 보드(v5)로 올라가 있습니다. 화면 보드는 폭마다 한 장입니다.
보드는 올린 시점의 모습이고 코드와 자동으로 맞춰지지 않으므로, 지금은 이 저장소의 화면이 기준입니다.

| 보드                     | 링크                                                                          |
| ------------------------ | ----------------------------------------------------------------------------- |
| 로고                     | https://www.figma.com/design/zew1dl0LBSUY6N2QHFZmUT/Trupass?node-id=143-2     |
| 디자인 기준              | https://www.figma.com/design/zew1dl0LBSUY6N2QHFZmUT/Trupass?node-id=143-65    |
| 화면 설계 · Desktop 1440 | https://www.figma.com/design/zew1dl0LBSUY6N2QHFZmUT/Trupass?node-id=143-1834  |
| 화면 설계 · Tablet 834   | https://www.figma.com/design/zew1dl0LBSUY6N2QHFZmUT/Trupass?node-id=143-8084  |
| 화면 설계 · Mobile 390   | https://www.figma.com/design/zew1dl0LBSUY6N2QHFZmUT/Trupass?node-id=143-14032 |

## 테스트

- `pnpm test` — Vitest 로 단위 · 컴포넌트 테스트를 돌립니다. CI 에서도 돕니다.
- `pnpm test:flow` — 앱을 빌드해 미리보기 서버로 띄우고, Playwright 로 랜딩부터 결제 완료 · 내 여행까지 실제 브라우저에서 눌러 봅니다
  (마우스 · 키보드 · 터치 · 움직임 줄이기). 1분 반쯤 걸리고 CI 에는 넣지 않았습니다. 화면의 동작을 고쳤다면 올리기 전에 돌려 주세요.
  처음 한 번은 브라우저를 받아야 합니다: `pnpm exec playwright install chromium`
  이미 떠 있는 서버를 검사하려면 `node scripts/flow-test.mjs --base=http://localhost:5173` 처럼 주소를 줍니다.

## API 타입

API 타입은 손으로 쓰지 않고 OpenAPI 스펙에서 **생성**합니다.

- 지금은 백엔드가 없어 `openapi/trupass.yaml` 에 최소 초안 스펙을 둡니다.
- 백엔드가 준비되면 `pnpm gen:api --remote` 로 생성하고, 필요하면 `openapi/trupass.yaml` 을 백엔드 스펙으로 교체합니다.
- 호출은 `src/shared/api/client.ts` 의 `apiClient`(openapi-fetch)로 하고, 쿼리 훅은 `src/shared/api/queries/` 에 둡니다.
- 스펙을 바꾸면 `src/mocks/handlers.ts` 의 Mock 도 함께 맞춰주세요.

## 원칙

- 금액은 FE 가 계산하지 않습니다. 백엔드 값을 그대로 보여주고 표시용 포맷(`formatKrw`)만 합니다.
- FE 는 백엔드 core API 만 호출합니다 (AI 에이전트는 백엔드 뒤에 있음).

## 디렉터리

```
src/
├── app/        # App, router, routes, providers(QueryClient)
│   └── layout/ # DesignLayout(디자인된 화면의 틀), AppHeader, AppFooter, 화면 전환
├── pages/      # 라우트 단위 페이지 (조립만 합니다)
├── features/   # 기능별 컴포넌트·훅
│               #   화면: landing, signup, search, results, places, pay, trips, styleguide
│               #   API 뼈대: chat, packages, approval, checkout
├── shared/
│   ├── api/    # client.ts, schema.d.ts(생성물), queries/
│   ├── lib/    # env, format, cx, prompts(적어 둔 검색 문장), passkey(스텁), toss(스텁)
│   ├── sample/ # 화면을 채우는 예시 데이터
│   └── ui/     # 공용 컴포넌트
├── styles/     # 디자인 시스템 CSS (tokens, components, screens)
├── assets/     # 사진, 지도, 로고, 지구본 경계 자료
├── mocks/      # MSW handlers, browser worker, fixtures, in-memory db
└── test/       # Vitest setup, MSW node server
scripts/
├── flow-test.mjs  # 흐름 검사 (pnpm test:flow)
├── gen-api.mjs    # API 타입 생성 (pnpm gen:api)
└── logo/          # 로고 원본과 로고 · 파비콘 생성 스크립트
```

## 배포 (Vercel)

Vercel GitHub 연동으로 배포합니다 (CI 워크플로에는 포함하지 않음).

1. Vercel 대시보드 → **Add New → Project** → `TRUPASS/TRUPASS-FE` 저장소 Import
2. Framework Preset: **Vite** (Install `pnpm install`, Build `pnpm build`, Output `dist`).
   프리셋은 `vercel.json` 의 `framework` 로도 고정해 두어, 대시보드 설정이 비어 있어도 `dist` 를 찾습니다.
3. **Settings → Environment Variables** 에 `VITE_API_BASE_URL`, `VITE_USE_MOCK`, `VITE_TOSS_CLIENT_KEY` 등록
   (Preview 환경은 `VITE_USE_MOCK=true` 로 두면 백엔드 없이도 프리뷰 확인 가능)
4. **Settings → General → Node.js Version** 을 26.x 로 설정
5. 이후 PR 마다 프리뷰 URL 이 생성되고 `main` 머지 시 프로덕션에 배포됩니다.

SPA 라우팅은 `vercel.json` 의 rewrite 로 처리합니다.

화면이 아직 예시 데이터라서 `index.html` 에 검색 엔진 수집을 막는 `robots` 메타(`noindex`)를 넣어 두었습니다. 실제 서비스를 열 때 뺍니다.
