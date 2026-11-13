import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { useLeave } from '@/app/layout/useLeave';
import { routes } from '@/app/routes';
import { Hero } from '@/features/landing/Hero';
import { HowTo } from '@/features/landing/HowTo';
import { LandingFooter } from '@/features/landing/LandingFooter';
import { startLandingScroll, type LandingScroll } from '@/features/landing/scroll';
import { Services } from '@/features/landing/Services';
import { Stats } from '@/features/landing/Stats';
import { useSignedInUser } from '@/shared/auth/member';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { PROMPTS } from '@/shared/sample/data';
import { Button } from '@/shared/ui/Button';

/**
 * 랜딩. 스크롤로 넘기는 한 장짜리 소개와 문장 입력 세 번.
 * 하늘(구름이 가까워진다) → 숫자 → 이용 방법(좌우로 넘기는 상자) → 항공 · 숙소 · 체험 문장 입력 → 푸터.
 * 세 번째 문장에서 엔터를 누르면 로그인으로 넘어간다. 움직임은 scroll.ts 가 스크롤 위치(--p)로 만든다.
 */
export function LandingPage() {
  useBodyClass('lp');
  const { hash } = useLocation();
  const leave = useLeave();
  // 로그인한 채로 오면 로그인 화면을 거치지 않는다 (로그인 없이 보는 설정에서는 로그인 상태가 늘 없다)
  const signedIn = useSignedInUser() !== null;
  const scroll = useRef<LandingScroll | null>(null);

  useEffect(() => {
    const s = startLandingScroll(document);
    scroll.current = s;
    return () => {
      s.destroy();
      scroll.current = null;
    };
  }, []);

  // 다른 화면에서 [문장 다시 적기]로 돌아왔을 때(#search)는 첫 질문 자리에서 시작한다.
  useEffect(() => {
    if (hash !== '#search') return;
    const id = requestAnimationFrame(() => scroll.current?.toStage(0, true, true));
    return () => cancelAnimationFrame(id);
  }, [hash]);

  const toStage = (i: number) => scroll.current?.toStage(i, true);

  return (
    <>
      <title>문장 세 개로 찾는 여행 | Trupass</title>
      {/* 오른쪽 위에 늘 떠 있는 알약 두 개 */}
      <div className="lp-top">
        {signedIn ? (
          <Button size="sm" to={routes.search}>
            새 검색
          </Button>
        ) : (
          <Button size="sm" to={routes.login}>
            로그인
          </Button>
        )}
        <Button
          size="sm"
          arrow
          href="#search"
          onClick={(e) => {
            e.preventDefault();
            toStage(0);
          }}
        >
          검색 시작
        </Button>
      </div>
      <main>
        <Hero onLogo={() => scroll.current?.toTop()} />
        <Stats />
        <HowTo onNext={() => toStage(0)} />
        <Services
          onSubmit={(i) =>
            i < PROMPTS.length - 1
              ? toStage(i + 1)
              : leave(signedIn ? routes.searching : routes.login)
          }
        />
      </main>
      <LandingFooter
        onStart={() => toStage(0)}
        onHow={() => scroll.current?.toElement('#how')}
        onTop={() => scroll.current?.toTop()}
      />
    </>
  );
}
