import { useRef, useState } from 'react';
import { asset } from '@/shared/lib/assets';
import { reduceMotion } from '@/shared/lib/capture';
import { PROMPTS } from '@/shared/sample/data';
import { Ask, Chips, type AskHandle } from '@/shared/ui/Ask';
import { Icon } from '@/shared/ui/Icon';

const pad2 = (n: number) => String(n).padStart(2, '0');
const LAST = PROMPTS.length - 1;

interface ServicesProps {
  /** i 번째 문장에서 엔터를 눌렀을 때 (마지막이면 로그인으로 넘어간다) */
  onSubmit: (i: number) => void;
}

/**
 * 서비스 구간: 창이 화면 가득 커진 뒤 항공 · 숙소 · 체험 질문이 스크롤을 따라 차례로 넘어간다.
 * 지금 질문(data-on), 창이 다 커졌는지(.live) 같은 스크롤 상태는 scroll.ts 가 이 구간 요소에 직접 적는다.
 */
export function Services({ onSubmit }: ServicesProps) {
  const section = useRef<HTMLElement>(null);
  const asks = useRef<(AskHandle | null)[]>([]);
  const [paused, setPaused] = useState(false);

  return (
    <section ref={section} className="lp-svc" id="search" data-sec="svc" data-on="0">
      <div className="hold">
        <div className="mq" aria-hidden="true">
          <div className="mq-t">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i}>Flights · Hotels · Experiences</span>
            ))}
          </div>
        </div>
        {/* 흐르는 글자 멈춤 단추. 움직임을 끈 환경에서는 글자가 흐르지 않으므로 숨긴다 */}
        <button
          type="button"
          className="mq-x"
          aria-pressed={paused}
          aria-label="흐르는 글자 멈춤"
          hidden={reduceMotion()}
          onClick={() => {
            // 구간의 다른 클래스(live · mq-gone)는 스크롤이 적으므로 여기서도 클래스만 켜고 끈다
            section.current?.classList.toggle('mq-paused', !paused);
            setPaused(!paused);
          }}
        >
          <Icon name="pause--filled" size={16} className="i-pause" />
          <Icon name="play--filled--alt" size={16} className="i-play" />
        </button>
        <div className="win">
          {PROMPTS.map((p, i) => (
            <div
              key={p.k}
              className={`stg stg-${i}`}
              style={{ backgroundImage: `url(${asset(p.img)})` }}
            />
          ))}
          <div className="svc-ui">
            <div className="svc-c">
              {PROMPTS.map((p, i) => (
                <div key={p.k} className="svc-pane" data-i={i} data-stage-ui={i}>
                  <h2 className="svc-q">{p.q}</h2>
                  <Ask
                    ref={(handle) => {
                      asks.current[i] = handle;
                    }}
                    prompt={p}
                    last={i === LAST}
                    onSubmit={() => onSubmit(i)}
                  />
                  <Chips examples={p.egs} onPick={(text) => asks.current[i]?.fill(text)} />
                  <p className="svc-k">
                    {i < LAST
                      ? '엔터를 누르면 다음 질문으로 넘어갑니다'
                      : '엔터를 누르면 로그인 후 검색을 시작합니다'}
                  </p>
                </div>
              ))}
            </div>
            <div className="svc-b">
              <div className="svc-ds">
                {PROMPTS.map((p, i) => (
                  <p key={p.k} className="svc-d" data-i={i}>
                    {p.d}
                  </p>
                ))}
              </div>
              <div className="svc-pg" aria-hidden="true">
                <span className="num svc-n">
                  {PROMPTS.map((p, i) => (
                    <b key={p.k} data-i={i}>
                      {pad2(i + 1)}
                    </b>
                  ))}
                  <em>/ {pad2(PROMPTS.length)}</em>
                </span>
                <span className="svc-bar">
                  <i />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
