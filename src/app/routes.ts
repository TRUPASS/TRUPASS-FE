import { generatePath } from 'react-router';

export const routes = {
  // 디자인을 옮긴 화면 (예시 데이터로 채워져 있다)
  landing: '/',
  login: '/login',
  signup: '/signup',
  search: '/search',
  searching: '/search/progress',
  results: '/results',
  places: '/places',
  mandate: '/pay/mandate',
  checkout: '/pay/checkout',
  paying: '/pay/processing',
  complete: '/pay/complete',
  trips: '/trips',
  styleguide: '/styleguide',
  // API 연동 뼈대 (Mock API 로 동작한다)
  chat: '/chat',
  packages: '/packages/:requestId',
  approval: '/checkout/:checkoutId/approve',
  checkoutStatus: '/checkout/:checkoutId',
  paymentSuccess: '/payments/success',
  paymentFail: '/payments/fail',
} as const;

export const paths = {
  packages: (requestId: string) => generatePath(routes.packages, { requestId }),
  approval: (checkoutId: string) => generatePath(routes.approval, { checkoutId }),
  checkoutStatus: (checkoutId: string) => generatePath(routes.checkoutStatus, { checkoutId }),
};
