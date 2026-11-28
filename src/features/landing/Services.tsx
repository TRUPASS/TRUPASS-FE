import { useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react';
import { searchApiOn } from '@/features/search/searchRef';
import { SENTENCE_MAX } from '@/features/search/useStartSearch';
import { asset } from '@/shared/lib/assets';
import { still } from '@/shared/lib/capture';
import { PROMPTS } from '@/shared/sample/data';
import { Ask, Chips, type AskHandle } from '@/shared/ui/Ask';
import { Icon } from '@/shared/ui/Icon';

export interface ServicesHandle {
  focusSearch(behavior: ScrollBehavior): void;
}

const AUTO_EXPAND_THRESHOLD = 0.92;
const SCROLL_SETTLE_MS = 120;

export function Services({
  onComplete,
  ref,
}: {
  onComplete: () => void;
  ref?: Ref<ServicesHandle>;
}) {
  const [step, setStep] = useState(0);
  const section = useRef<HTMLElement>(null);
  const scrollSpace = useRef<HTMLDivElement>(null);
  const ask = useRef<AskHandle>(null);
  const focusingFromShortcut = useRef(false);
  const previousStep = useRef(step);

  useLayoutEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    ask.current?.focus({ preventScroll: true });
  }, [step]);

  useLayoutEffect(() => {
    const el = section.current;
    const space = scrollSpace.current;
    if (still || !el || !space) return;

    let frame = 0;
    let finishTimer = 0;
    let progress = -1;
    let lastScrollY = window.scrollY;
    const update = () => {
      frame = 0;
      const distance = space.offsetHeight;
      const sectionTop = el.getBoundingClientRect().top;
      const next = distance ? Math.min(1, Math.max(0, -sectionTop / distance)) : 1;
      const ready = next >= AUTO_EXPAND_THRESHOLD;
      const scrollY = window.scrollY;
      if (scrollY !== lastScrollY) {
        window.clearTimeout(finishTimer);
        if (scrollY > lastScrollY && ready && next < 1) {
          // 스크롤을 계속 내리거나 되돌리는 동안에는 위치를 잡아당기지 않는다.
          finishTimer = window.setTimeout(() => {
            const currentDistance = space.offsetHeight;
            const remaining = el.getBoundingClientRect().top + currentDistance;
            if (
              window.scrollY === scrollY &&
              remaining > 0 &&
              remaining <= currentDistance * (1 - AUTO_EXPAND_THRESHOLD)
            ) {
              window.scrollBy({ top: Math.ceil(remaining), behavior: 'instant' });
            }
          }, SCROLL_SETTLE_MS);
        }
        lastScrollY = scrollY;
      }
      if (next === progress) return;
      progress = next;
      const eased = ready ? 1 : next * next * (3 - 2 * next);
      el.style.setProperty('--svc-expand', String(eased));
      el.toggleAttribute('data-zooming', !ready);
      el.toggleAttribute('data-intro-hidden', eased >= 1 / 1.7);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    observer?.observe(space);
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(finishTimer);
      observer?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    focusSearch(behavior) {
      const el = section.current;
      if (!el) return;
      const distance = scrollSpace.current?.offsetHeight ?? 0;
      const top = Math.ceil(window.scrollY + el.getBoundingClientRect().top + distance);
      focusingFromShortcut.current = true;
      ask.current?.focus({ preventScroll: true });
      focusingFromShortcut.current = false;
      window.scrollTo({ top, behavior });
    },
  }));

  return (
    <section
      className="lp-svc"
      id="search"
      ref={section}
      data-scroll-intro={!still || undefined}
      aria-labelledby={`service-question-${step}`}
    >
      <div className="svc-frame">
        <div
          className="win"
          onFocusCapture={() => {
            if (focusingFromShortcut.current) return;
            const distance = scrollSpace.current?.offsetHeight ?? 0;
            const remaining = (section.current?.getBoundingClientRect().top ?? 0) + distance;
            if (distance && remaining > 1) {
              window.scrollBy({ top: Math.ceil(remaining), behavior: 'instant' });
            }
          }}
        >
          <div className="svc-photo" aria-hidden="true">
            {PROMPTS.map((prompt, index) => (
              <div
                key={prompt.k}
                className="svc-photo-image svc-stage"
                data-current={index === step || undefined}
                style={{ backgroundImage: `url(${asset(prompt.img)})` }}
              />
            ))}
          </div>
          <div className="svc-intro" aria-hidden="true">
            <div className="svc-intro-track">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i}>Flights · Hotels · Experiences</span>
              ))}
            </div>
          </div>
          <div className="svc-stages">
            {PROMPTS.map((prompt, index) => {
              const current = index === step;
              const last = index === PROMPTS.length - 1;
              return (
                <div
                  key={prompt.k}
                  className="svc-ui svc-stage"
                  data-current={current || undefined}
                  inert={!current}
                  aria-hidden={!current || undefined}
                >
                  <div className="svc-pane">
                    <h2 className="svc-q" id={`service-question-${index}`}>
                      {prompt.q}
                    </h2>
                    <Ask
                      ref={current ? ask : undefined}
                      prompt={prompt}
                      last={last}
                      required
                      maxLength={searchApiOn ? SENTENCE_MAX : undefined}
                      onSubmit={() => {
                        if (last) onComplete();
                        else setStep(index + 1);
                      }}
                    />
                    <Chips examples={prompt.egs} onPick={(text) => ask.current?.fill(text)} />
                    {index > 0 && (
                      <button className="svc-back" type="button" onClick={() => setStep(index - 1)}>
                        <Icon name="arrow--left" size={16} />전 단계로 돌아가기
                      </button>
                    )}
                  </div>
                  <div className="svc-b">
                    <p
                      className="svc-d"
                      data-manual-line-breaks={prompt.d.includes('\n') || undefined}
                    >
                      {prompt.d}
                    </p>
                    <span
                      className="num svc-n"
                      aria-label={`${PROMPTS.length}단계 중 ${index + 1}단계`}
                    >
                      {String(index + 1).padStart(2, '0')} /{' '}
                      {String(PROMPTS.length).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="svc-scroll-space" ref={scrollSpace} aria-hidden="true" />
    </section>
  );
}
