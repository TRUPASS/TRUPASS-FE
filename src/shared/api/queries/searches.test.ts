import { SEARCH_POLL_MS, searchPollInterval } from './searches';

describe('검색 진행 상태 폴링', () => {
  it('진행 중이면 1.5초마다 다시 묻고, 끝났거나 아직 모르면 멈춘다', () => {
    expect(SEARCH_POLL_MS).toBe(1500);
    expect(searchPollInterval('IN_PROGRESS')).toBe(1500);
    expect(searchPollInterval('COMPLETED')).toBe(false);
    expect(searchPollInterval('FAILED')).toBe(false);
    expect(searchPollInterval('CANCELED')).toBe(false);
    expect(searchPollInterval(undefined)).toBe(false);
  });
});
