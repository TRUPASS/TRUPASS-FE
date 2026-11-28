export const queryKeys = {
  packages: (requestId: string) => ['trip-requests', requestId, 'packages'] as const,
  checkout: (checkoutId: string) => ['checkouts', checkoutId] as const,
  // 검색 한 건의 한 버전에 딸린 것들. 끝 이름을 달리해 서로의 앞부분이 되지 않게 한다
  searchVersion: (searchId: number, versionNo: number) =>
    ['searches', searchId, 'versions', versionNo, 'detail'] as const,
  searchProgress: (searchId: number, versionNo: number) =>
    ['searches', searchId, 'versions', versionNo, 'progress'] as const,
  combination: (searchId: number, versionNo: number) =>
    ['searches', searchId, 'versions', versionNo, 'combination'] as const,
};
