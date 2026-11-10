import { Link, Outlet } from 'react-router';
import { env } from '@/shared/lib/env';

export function RootLayout() {
  return (
    <div className="mx-auto min-h-dvh max-w-3xl p-4">
      <header className="mb-6 flex items-center justify-between border-b pb-3">
        <Link to="/" className="text-lg font-bold">
          Trupass
        </Link>
        {env.useMock && <span className="text-xs text-gray-500">MOCK MODE</span>}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
