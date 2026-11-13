import { useEffect, useRef, useState } from 'react';
import { asset } from '@/shared/lib/assets';
import { cx } from '@/shared/lib/cx';
import { HOW } from '@/shared/sample/data';
import { IconButton } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

const LAST = HOW.length - 1;
const clamp = (v: number) => Math.min(LAST, Math.max(0, v));

/**
 * 이용 방법: 좌우로 넘겨 보는 상자. 순서가 있는 목록(ol)이고 번호는 CSS 카운터가 그린다.
 * 버튼 · 점 · 좌우 화살표 키 · 쓸어 넘기기로 넘기고, 끝까지 읽으면 아래로 스크롤을 권한다.
 */
export function HowTo({ onNext }: { onNext: () => void }) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const car = useRef<HTMLElement>(null);
  const touchX = useRef<number | null>(null);

  const show = (next: number | ((i: number) => number)) =>
    setIndex((i) => {
      const j = clamp(typeof next === 'function' ? next(i) : next);
      if (j === LAST) setDone(true); // 끝까지 읽었다 → 아래로 스크롤을 권한다
      return j;
    });

  // 상자가 화면 가운데에 있을 때는 좌우 화살표 키로도 넘긴다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = e.target instanceof HTMLElement ? e.target.tagName : '';
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
      const r = car.current?.getBoundingClientRect();
      const vh = window.innerHeight;
      if (!r || r.bottom < vh * 0.4 || r.top > vh * 0.6) return;
      if (e.key === 'ArrowLeft') show((i) => i - 1);
      else if (e.key === 'ArrowRight') show((i) => i + 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section
      ref={car}
      className={done ? 'lp-how done' : 'lp-how'}
      id="how"
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 44) show((i) => i + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="how-hd">
        <h2 className="t-display">다섯 걸음이면 여행이 정해집니다</h2>
      </div>
      <div className="how-car">
        {/* 끝에서는 꺼진 모양만 보인다(disabled 로 막으면 키보드 초점이 사라지므로 aria-disabled 를 쓴다) */}
        <IconButton
          icon="arrow--left"
          className="rb"
          label="이전 걸음"
          aria-disabled={index === 0 ? true : undefined}
          onClick={() => show((i) => i - 1)}
        />
        <ol className="how-box">
          {HOW.map((h, i) => (
            <li key={h.t} className={cx('how-sl', i === index && 'on', i < index && 'was')}>
              <div className="how-img">
                <img
                  src={asset(`tutorial/step${i + 1}.jpg`)}
                  width={1280}
                  height={760}
                  alt=""
                  loading="lazy"
                />
              </div>
              <div className="how-tx">
                <h3 className="t-h1">{h.t}</h3>
                <p className="t-lg c2">{h.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <IconButton
          icon="arrow--right"
          className="rb"
          label="다음 걸음"
          aria-disabled={index === LAST ? true : undefined}
          onClick={() => show((i) => i + 1)}
        />
      </div>
      <div className="how-ft">
        <div className="how-dots">
          {HOW.map((h, i) => (
            <button
              key={h.t}
              type="button"
              className={i === index ? 'on' : undefined}
              aria-label={`${i + 1}번째 걸음`}
              aria-current={i === index ? 'step' : undefined}
              onClick={() => show(i)}
            />
          ))}
        </div>
      </div>
      <button type="button" className="how-go" onClick={onNext}>
        <span>다 읽으셨다면 아래로 스크롤하세요</span>
        <Icon name="arrow--down" size={18} />
      </button>
    </section>
  );
}
