// 테스트용 가짜 Google Identity Services. renderButton 이 그리는 단추를 누르면 initialize 때 받은 callback 에
// window.__googleAccount 로 정한 계정의 ID 토큰(Mock API 형식 'mock:<이름>')을 넘긴다.
import type { CredentialResponse, GoogleId, GsiButtonOptions } from '@/features/auth/gis';

declare global {
  interface Window {
    __googleAccount?: string;
  }
}

export interface FakeGoogle {
  /** renderButton 에 넘어온 모양 설정 (마지막 것) */
  options: GsiButtonOptions | null;
  initialized: number;
  autoSelectDisabled: number;
}

export function installFakeGoogle(): FakeGoogle {
  const state: FakeGoogle = { options: null, initialized: 0, autoSelectDisabled: 0 };
  let callback: ((r: CredentialResponse) => void) | null = null;
  const id: GoogleId = {
    initialize(config) {
      state.initialized += 1;
      callback = config.callback;
    },
    renderButton(parent, options) {
      state.options = options;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Google 계정으로 계속하기';
      button.addEventListener('click', () =>
        callback?.({ credential: `mock:${window.__googleAccount ?? 'traveler'}` }),
      );
      parent.replaceChildren(button);
    },
    disableAutoSelect() {
      state.autoSelectDisabled += 1;
    },
  };
  window.google = { accounts: { id } };
  return state;
}
