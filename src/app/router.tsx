import { createBrowserRouter } from 'react-router';
import { ApprovalPage } from '@/pages/ApprovalPage';
import { ChatPage } from '@/pages/ChatPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { CheckoutStatusPage } from '@/pages/CheckoutStatusPage';
import { CompletePage } from '@/pages/CompletePage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { MandatePage } from '@/pages/MandatePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PackagesPage } from '@/pages/PackagesPage';
import { PayingPage } from '@/pages/PayingPage';
import { PaymentFailPage } from '@/pages/PaymentFailPage';
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage';
import { PlacesPage } from '@/pages/PlacesPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { SearchingPage } from '@/pages/SearchingPage';
import { SearchPage } from '@/pages/SearchPage';
import { SignupPage } from '@/pages/SignupPage';
import { StyleGuidePage } from '@/pages/StyleGuidePage';
import { TripsPage } from '@/pages/TripsPage';
import { DesignLayout } from './layout/DesignLayout';
import { forgetScrollOnFreshVisit } from './layout/scrollMemory';
import { RootLayout } from './RootLayout';
import { routes } from './routes';

forgetScrollOnFreshVisit();

export const router = createBrowserRouter([
  // 디자인된 화면: 랜딩부터 결제 완료 · 내 여행까지. 지금은 예시 데이터(shared/sample)로 채워져 있다.
  {
    element: <DesignLayout />,
    children: [
      { path: routes.landing, element: <LandingPage /> },
      { path: routes.login, element: <LoginPage /> },
      { path: routes.signup, element: <SignupPage /> },
      { path: routes.search, element: <SearchPage /> },
      { path: routes.searching, element: <SearchingPage /> },
      { path: routes.results, element: <ResultsPage /> },
      { path: routes.places, element: <PlacesPage /> },
      { path: routes.mandate, element: <MandatePage /> },
      { path: routes.checkout, element: <CheckoutPage /> },
      { path: routes.paying, element: <PayingPage /> },
      { path: routes.complete, element: <CompletePage /> },
      { path: routes.trips, element: <TripsPage /> },
      { path: routes.styleguide, element: <StyleGuidePage /> },
    ],
  },
  // API 연동 뼈대: Mock API 로 요청 → 패키지 → 승인 → 진행 상태가 이어진다. 위 화면에 API 를 붙이면서 하나씩 합친다.
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
