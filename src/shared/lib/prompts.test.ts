import { act, renderHook } from '@testing-library/react';
import { prompts, usePromptText } from './prompts';

// 적어 둔 문장은 모듈이 기억하므로, 아래 테스트는 적힌 순서대로 이어진다.
describe('prompts', () => {
  it('아무것도 적지 않았으면 예시 문장을 보여 준다', () => {
    const { result } = renderHook(() => usePromptText('stay', '난바역 근처 깔끔한 호텔'));

    expect(prompts.any()).toBe(false);
    expect(result.current).toEqual({ text: '난바역 근처 깔끔한 호텔', empty: false });
  });

  it('일부만 적었으면 적은 칸은 그 문장을, 비운 칸은 "적지 않았습니다"를 보여 준다', () => {
    const { result } = renderHook(() => ({
      flight: usePromptText('flight', '예시'),
      stay: usePromptText('stay', '예시'),
    }));

    act(() => prompts.put('flight', '삿포로 1월 말'));

    expect(prompts.any()).toBe(true);
    expect(result.current.flight).toEqual({ text: '삿포로 1월 말', empty: false });
    expect(result.current.stay).toEqual({ text: '적지 않았습니다', empty: true });
  });

  it('적은 문장을 sessionStorage 에 담아 다음 화면에서 다시 읽는다', async () => {
    act(() => prompts.put('exp', '먹거리 위주'));
    expect(JSON.parse(sessionStorage.getItem('tp.prompts') ?? '{}')).toEqual({
      flight: '삿포로 1월 말',
      exp: '먹거리 위주',
    });

    // 새로 불러온 모듈은 저장소에서 읽는다 (화면을 새로 연 것과 같다)
    vi.resetModules();
    const next = await import('./prompts');
    expect(next.prompts.get()).toEqual({ flight: '삿포로 1월 말', exp: '먹거리 위주' });
  });
});
