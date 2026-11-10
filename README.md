# TRUPASS-FE

Trupass — "말 한 번으로 떠나고, 결제는 서명 한 번" AI 여행 패키지 서비스의 프론트엔드입니다.

> 현재는 **뼈대**만 있습니다. 라우팅, API 연동 구조(OpenAPI 타입 생성), MSW Mock, CI 까지 세팅되어 있고
> 화면 디자인·실제 패스키/토스 연동은 아직 없습니다.

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

**Mock 모드** (백엔드 없이 개발) — `.env.local` 에 `VITE_USE_MOCK=true`

```bash
pnpm dev
```

http://localhost:5173 → 대화 → 패키지 비교 → 승인 → 진행 상태 순서로 이동할 수 있고,
진행 상태 페이지는 폴링할 때마다 Mock Saga 단계가 하나씩 진행됩니다.

Mock 시나리오는 URL 쿼리로 바꿀 수 있습니다.

| 쿼리                             | 결과                                             |
| -------------------------------- | ------------------------------------------------ |
| (없음) / `?mockScenario=SUCCESS` | 모든 단계 성공 → `COMPLETED`                     |
| `?mockScenario=SOLD_OUT`         | 숙소 HOLD 실패(매진) → 항공 HOLD 보상 → `FAILED` |
| `?mockScenario=MANUAL_REVIEW`    | 숙소 PAY 실패 → `NEEDS_MANUAL_REVIEW`            |

예: `http://localhost:5173/checkout/demo?mockScenario=SOLD_OUT`

**실서버 모드** — 백엔드를 `http://localhost:8080` 에 띄우고 `.env.local` 에 `VITE_USE_MOCK=false`

```bash
pnpm dev
```

> 백엔드에서 `http://localhost:5173` 에 대한 CORS 를 허용해야 합니다.

## 스크립트

| 명령                    | 설명                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `pnpm dev`              | 개발 서버                                                  |
| `pnpm build`            | 타입 체크 + 프로덕션 빌드                                  |
| `pnpm lint`             | ESLint                                                     |
| `pnpm typecheck`        | TypeScript 타입 체크                                       |
| `pnpm test`             | Vitest (watch). CI 에서는 `pnpm test --run`                |
| `pnpm format`           | Prettier                                                   |
| `pnpm gen:api`          | `openapi/trupass.yaml` → `src/shared/api/schema.d.ts` 생성 |
| `pnpm gen:api --remote` | `${VITE_API_BASE_URL}/v3/api-docs` (백엔드) → 타입 생성    |

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
├── app/        # App, router, routes, providers(QueryClient), RootLayout
├── pages/      # 라우트 단위 페이지
├── features/   # chat, packages, approval, checkout — 기능별 컴포넌트·훅
├── shared/
│   ├── api/    # client.ts, schema.d.ts(생성물), queries/
│   ├── lib/    # env, format, passkey(스텁), toss(스텁)
│   └── ui/     # 공용 컴포넌트
├── mocks/      # MSW handlers, browser worker, fixtures, in-memory db
└── test/       # Vitest setup, MSW node server
```

| 경로                            | 페이지         |
| ------------------------------- | -------------- |
| `/`                             | 대화           |
| `/packages/:requestId`          | 패키지 비교    |
| `/checkout/:checkoutId/approve` | 승인           |
| `/checkout/:checkoutId`         | 진행·결과      |
| `/payments/success`             | 토스 결제 성공 |
| `/payments/fail`                | 토스 결제 실패 |

## 배포 (Vercel)

Vercel GitHub 연동으로 배포합니다 (CI 워크플로에는 포함하지 않음).

1. Vercel 대시보드 → **Add New → Project** → `TRUPASS/TRUPASS-FE` 저장소 Import
2. Framework Preset: **Vite** (Install `pnpm install`, Build `pnpm build`, Output `dist` — 자동 감지)
3. **Settings → Environment Variables** 에 `VITE_API_BASE_URL`, `VITE_USE_MOCK`, `VITE_TOSS_CLIENT_KEY` 등록
   (Preview 환경은 `VITE_USE_MOCK=true` 로 두면 백엔드 없이도 프리뷰 확인 가능)
4. **Settings → General → Node.js Version** 을 26.x 로 설정
5. 이후 PR 마다 프리뷰 URL 이 생성되고 `main` 머지 시 프로덕션에 배포됩니다.

SPA 라우팅은 `vercel.json` 의 rewrite 로 처리합니다.
