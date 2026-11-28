import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLeave } from '@/app/layout/useLeave';
import { routes } from '@/app/routes';
import { ApiError } from '@/shared/api/client';
import { useCreateSearch } from '@/shared/api/queries/searches';
import { session } from '@/shared/auth/session';
import type { PromptKey } from '@/shared/lib/prompts';
import { apiErrorText } from './progressText';
import { searchPaths } from './searchRef';

/** 문장 한 칸에 적을 수 있는 최대 글자 수 (계약: 500자 이하) */
export const SENTENCE_MAX = 500;

export type Sentences = Record<PromptKey, string>;

const NAMES: Record<PromptKey, string> = {
  flight: '항공',
  stay: '숙소',
  exp: '체험 · 여행 요구사항',
};

/** 보내기 전에 확인한다. 비었거나 너무 길면 그 이유, 괜찮으면 null (백엔드도 같은 규칙으로 400 을 준다) */
export function sentenceProblem(sentences: Sentences): string | null {
  for (const key of ['flight', 'stay', 'exp'] as const) {
    const text = sentences[key];
    if (!text) return `${NAMES[key]} 문장을 적어 주세요.`;
    if (text.length > SENTENCE_MAX) {
      return `${NAMES[key]} 문장은 ${SENTENCE_MAX}자까지 적을 수 있습니다.`;
    }
  }
  return null;
}

/**
 * 문장 세 개로 검색을 시작한다 (POST /searches). 받으면 검색 중 화면으로 간다.
 * - 보내는 중에는 다시 보내지 않는다.
 * - 로그인 전이면 적은 문장은 저장소(sessionStorage)에 둔 채 로그인으로 보낸다. 로그인하면 새 검색 화면이 이어서 보낸다.
 *   401 도 같다. 다만 로그인이 그대로 남아 있는데 401 이면(토큰을 바꿔 다시 보내도 거절) 오가며 돌지 않게 문구만 보인다.
 * - 그 밖의 실패(400 · 429 등)는 백엔드가 보낸 문장을 error 로 돌려준다. 적은 문장은 그대로 둔다.
 */
export function useStartSearch() {
  const navigate = useNavigate();
  const leave = useLeave();
  const { mutate, isPending } = useCreateSearch();
  const sending = useRef(false);
  const [error, setError] = useState('');

  const start = useCallback(
    (sentences: Sentences) => {
      if (sending.current) return;
      const problem = sentenceProblem(sentences);
      if (problem) {
        setError(problem);
        return;
      }
      setError('');
      const toLogin = () => leave(`${routes.login}?from=search`);
      if (!session.get()) {
        toLogin();
        return;
      }
      sending.current = true;
      mutate(
        {
          flightSentence: sentences.flight,
          staySentence: sentences.stay,
          experienceSentence: sentences.exp,
        },
        {
          onSuccess: (started) => void navigate(searchPaths.progress(started)),
          onError: (e) => {
            if (e instanceof ApiError && e.status === 401 && !session.get()) {
              toLogin();
              return;
            }
            setError(apiErrorText(e, '검색을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.'));
          },
          onSettled: () => {
            sending.current = false;
          },
        },
      );
    },
    [leave, mutate, navigate],
  );

  return { start, busy: isPending, error };
}
