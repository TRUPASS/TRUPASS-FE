/**
 * 패스키(WebAuthn) 래퍼 — 스텁.
 *
 * TODO: 백엔드 WebAuthn 라이브러리와 AP2 Mandate 서명 옵션 형식이 확정되면 구현한다.
 *  1. 백엔드에서 서명 옵션(challenge 등)을 받는다.
 *  2. `startAuthentication`(@simplewebauthn/browser)으로 사용자 서명을 받는다.
 *  3. 결과를 `POST /api/checkouts/{checkoutId}/mandate` 로 제출한다.
 */
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';

export function isPasskeySupported(): boolean {
  return browserSupportsWebAuthn();
}

export async function signMandateWithPasskey(checkoutId: string): Promise<never> {
  throw new Error(`signMandateWithPasskey(${checkoutId}): 아직 구현되지 않았습니다 (TODO)`);
}
