export const queryKeys = {
  packages: (requestId: string) => ['trip-requests', requestId, 'packages'] as const,
  checkout: (checkoutId: string) => ['checkouts', checkoutId] as const,
};
