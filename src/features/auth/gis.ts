// Google Identity Services(GIS): Google 이 주는 로그인 버튼. 누르면 Google 창이 뜨고, 고른 계정의 ID 토큰(credential)을 돌려준다.
// https://developers.google.com/identity/gsi/web/reference/js-reference

const SRC = 'https://accounts.google.com/gsi/client';

export interface CredentialResponse {
  /** ID 토큰 (JWT). 백엔드 POST /auth/google 에 그대로 보낸다 */
  credential?: string;
}

export interface GsiButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  /** px, 최대 400 */
  width?: number;
  locale?: string;
}

/** GIS 가운데 쓰는 부분 */
export interface GoogleId {
  initialize(config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: 'signin' | 'signup' | 'use';
    ux_mode?: 'popup' | 'redirect';
    itp_support?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: GsiButtonOptions): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

let loading: Promise<GoogleId> | null = null;

/** GIS 스크립트를 한 번만 불러온다. 실패하면(네트워크, 광고 차단 등) 다음 호출에서 다시 시도한다 */
export function loadGoogleId(): Promise<GoogleId> {
  const ready = window.google?.accounts?.id;
  if (ready) return Promise.resolve(ready);
  loading ??= new Promise<GoogleId>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SRC;
    script.async = true;
    const fail = () => {
      script.remove();
      loading = null;
      reject(new Error('Google 로그인 스크립트를 불러오지 못했습니다.'));
    };
    script.onload = () => {
      const id = window.google?.accounts?.id;
      if (id) resolve(id);
      else fail();
    };
    script.onerror = fail;
    document.head.append(script);
  });
  return loading;
}

let initializedFor = '';
let handler: ((credential: string) => void) | null = null;

/**
 * GIS 를 이 클라이언트 ID 로 한 번만 초기화한다(여러 번 부르면 Google 이 경고한다).
 * 받은 ID 토큰은 그때 등록된 처리 함수(onCredential)로 넘긴다.
 */
export function initGoogleId(id: GoogleId, clientId: string) {
  if (initializedFor === clientId) return;
  id.initialize({
    client_id: clientId,
    callback: ({ credential }) => {
      if (credential) handler?.(credential);
    },
    auto_select: false,
    context: 'signin',
    ux_mode: 'popup',
    itp_support: true,
  });
  initializedFor = clientId;
}

/** Google 이 ID 토큰을 주면 부를 함수를 등록한다. 돌려준 함수로 해제한다 */
export function onCredential(fn: (credential: string) => void): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

/** 로그아웃한 뒤 다음 방문에서 Google 이 같은 계정을 저절로 고르지 않게 한다 (GIS 를 불러온 적이 있을 때만) */
export function forgetGoogleSelection() {
  window.google?.accounts?.id?.disableAutoSelect();
}
