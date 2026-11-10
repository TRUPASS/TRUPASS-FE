/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_MOCK?: string;
  /** 토스페이먼츠 클라이언트 키(공개 키). 시크릿 키를 넣지 않는다. */
  readonly VITE_TOSS_CLIENT_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
