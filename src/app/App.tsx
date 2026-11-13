import { RouterProvider } from 'react-router/dom';
import { AppProviders } from './providers';
import { router } from './router';
import { SessionSync } from './SessionSync';

export function App() {
  return (
    <AppProviders>
      <SessionSync />
      <RouterProvider router={router} />
    </AppProviders>
  );
}
