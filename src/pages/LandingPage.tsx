import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { useLeave } from '@/app/layout/useLeave';
import { routes } from '@/app/routes';
import { Hero } from '@/features/landing/Hero';
import { HowTo } from '@/features/landing/HowTo';
import { LandingFooter } from '@/features/landing/LandingFooter';
import { Services, type ServicesHandle } from '@/features/landing/Services';
import { searchStartPath } from '@/features/search/searchRef';
import { useSignedInUser } from '@/shared/auth/member';
import { reduceMotion, still } from '@/shared/lib/capture';

function scrollBehavior(): ScrollBehavior {
  return reduceMotion() || still ? 'auto' : 'smooth';
}

export function LandingPage() {
  const { hash } = useLocation();
  const leave = useLeave();
  const signedIn = useSignedInUser() !== null;
  const services = useRef<ServicesHandle>(null);
  useEffect(() => {
    if (hash !== '#search') return;
    const id = requestAnimationFrame(() => services.current?.focusSearch('auto'));
    return () => cancelAnimationFrame(id);
  }, [hash]);

  const start = () => services.current?.focusSearch(scrollBehavior());

  return (
    <div className="landing-redesign">
      <title>여행을 말하면, 선택지는 정리됩니다 | Trupass</title>
      <main>
        <Hero signedIn={signedIn} />
        <HowTo onNext={start} />

        <Services
          ref={services}
          onComplete={() => leave(signedIn ? searchStartPath() : `${routes.login}?from=search`)}
        />
      </main>

      <LandingFooter
        onHow={() => document.getElementById('how')?.scrollIntoView({ behavior: scrollBehavior() })}
        onTop={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}
      />
    </div>
  );
}
