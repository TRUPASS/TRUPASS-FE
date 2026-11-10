/**
 * 토스페이먼츠 SDK 래퍼 — 스텁.
 *
 * FE 에는 **클라이언트 키(공개 키)** 만 둔다. 시크릿 키와 결제 승인(confirm) 호출은 백엔드 몫이다.
 *
 * TODO: 결제 요청 흐름이 정해지면 구현한다.
 *  - `payment.requestPayment({ ..., successUrl: `${origin}/payments/success`, failUrl: `${origin}/payments/fail` })`
 *  - 금액·주문번호는 백엔드가 내려준 값을 그대로 쓴다 (FE 계산 금지).
 */
import { loadTossPayments, type TossPaymentsSDK } from '@tosspayments/tosspayments-sdk';
import { env } from './env';

let sdkPromise: Promise<TossPaymentsSDK> | null = null;

export function getTossPayments(): Promise<TossPaymentsSDK> {
  if (!env.tossClientKey) {
    return Promise.reject(new Error('VITE_TOSS_CLIENT_KEY 가 설정되지 않았습니다.'));
  }
  sdkPromise ??= loadTossPayments(env.tossClientKey);
  return sdkPromise;
}

export function getPaymentRedirectUrls(origin: string = window.location.origin) {
  return {
    successUrl: `${origin}/payments/success`,
    failUrl: `${origin}/payments/fail`,
  };
}
