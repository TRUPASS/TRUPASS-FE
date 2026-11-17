import { Outlet } from 'react-router';
import { env } from '@/shared/lib/env';
import { Logo } from '@/shared/ui/Logo';

export function RootLayout() {
  return (
    <div className="mx-auto min-h-dvh max-w-3xl p-4">
      <header className="mb-6 flex items-center justify-between border-b pb-3">
        <Logo size={28} />
        {env.useMock && <span className="text-xs text-gray-500">MOCK MODE</span>}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
