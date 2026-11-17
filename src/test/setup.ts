import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { resetMockDb } from '@/mocks/db';
import { session } from '@/shared/auth/session';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockDb();
  session.clear();
  sessionStorage.clear();
});
afterAll(() => server.close());
