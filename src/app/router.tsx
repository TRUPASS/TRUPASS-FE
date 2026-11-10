import { createBrowserRouter } from 'react-router';
import { ApprovalPage } from '@/pages/ApprovalPage';
import { ChatPage } from '@/pages/ChatPage';
import { CheckoutStatusPage } from '@/pages/CheckoutStatusPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PackagesPage } from '@/pages/PackagesPage';
import { PaymentFailPage } from '@/pages/PaymentFailPage';
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage';
import { RootLayout } from './RootLayout';
import { routes } from './routes';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: routes.chat, element: <ChatPage /> },
      { path: routes.packages, element: <PackagesPage /> },
      { path: routes.approval, element: <ApprovalPage /> },
      { path: routes.checkoutStatus, element: <CheckoutStatusPage /> },
      { path: routes.paymentSuccess, element: <PaymentSuccessPage /> },
      { path: routes.paymentFail, element: <PaymentFailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
