import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { env } from '@/shared/lib/env';
import './index.css';

async function enableMocking() {
  if (!env.useMock) return;
  const { worker } = await import('@/mocks/browser');
  // 핸들러가 없는 요청(정적 파일, 외부 SDK 등)은 그대로 통과시킨다.
  await worker.start({ onUnhandledFrame: 'bypass' });
}

void enableMocking()
  .catch((error: unknown) => {
    // 워커 등록에 실패해도 앱은 렌더링한다 (API 호출만 실패).
    console.error('[MSW] Mock 워커를 시작하지 못했습니다.', error);
  })
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
