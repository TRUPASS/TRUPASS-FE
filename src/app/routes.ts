import { generatePath } from 'react-router';

export const routes = {
  chat: '/',
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
