// 랜딩의 스크롤 연출. 스크롤 구간([data-sec])마다 진행도 --p(0→1)를 넣고, 화면의 움직임은 CSS 가 --p 로 계산한다.
// 스크롤 위치에서 바로 나오는 값(진행도 · 숫자 · 지금 질문)이라 React 상태를 거치지 않고 요소에 직접 적는다.
import { reduceMotion, still } from '@/shared/lib/capture';

interface Section {
  el: HTMLElement;
  k: string;
  p: number;
  top: number;
  h: number;
}

export interface LandingScroll {
  /** 서비스 구간의 i 번째 질문으로 간다. focus 면 그 질문이 보이는 대로 입력 칸에 커서를 둔다. */
  toStage(i: number, focus: boolean, instant?: boolean): void;
  /** 화면 안의 한 요소(#id) 자리로 간다 */
  toElement(selector: string): void;
  toTop(): void;
  destroy(): void;
}

const GROW = 0.16; // 서비스 구간: 앞 16% 는 창이 커지는 동안
const HOLD = 0.34; // 각 질문에서 머무는 자리(구간 안 0–1)
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (t: number) => t * t * (3 - 2 * t);

export function startLandingScroll(root: ParentNode): LandingScroll {
  const reduce = reduceMotion();
  const secs: Section[] = Array.from(root.querySelectorAll<HTMLElement>('[data-sec]')).map(
    (el) => ({
      el,
      k: el.dataset.sec ?? '',
      p: -1,
      top: 0,
      h: 0,
    }),
  );
  const sec = (k: string) => secs.find((s) => s.k === k);
  let vh = window.innerHeight;
  let raf = 0;
  let gone = false;
  const timers = new Set<number>();

  const fx: Record<string, (s: Section, p: number) => void> = {
    // 숫자: 구간에 들어오면 0 에서 제 값까지 올라간다
    stats(s, p) {
      s.el.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
        const i = Number(el.dataset.i);
        const n = Number(el.dataset.count);
        const t = ease(clamp((p - 0.1 - i * 0.07) / 0.5, 0, 1));
        const v = String(Math.round(n * t));
        if (el.textContent !== v) el.textContent = v;
      });
    },
    // 서비스: 창이 커진 뒤 질문 세 개가 차례로 넘어간다
    svc(s, p) {
      const g = clamp(p / GROW, 0, 1);
      const ge = ease(g);
      const q = clamp((p - GROW) / (1 - GROW), 0, 1) * 3;
      const st = Math.min(2, Math.floor(q));
      const f = q - st;
      const sl = st < 2 ? clamp((f - 0.74) / 0.26, 0, 1) : 0;
      const s1 = st === 0 ? sl : 1;
      const s2 = st === 1 ? sl : st === 2 ? 1 : 0;
      const style = s.el.style;
      style.setProperty('--g', ge.toFixed(4));
      style.setProperty('--s1', ease(s1).toFixed(4));
      style.setProperty('--s2', ease(s2).toFixed(4));
      style.setProperty('--bar', (q / 3).toFixed(4));
      const on = String(Math.min(2, st + (sl > 0.5 ? 1 : 0)));
      if (s.el.dataset.on !== on) s.el.dataset.on = on;
      s.el.classList.toggle('live', g > 0.9); // 창이 다 커졌다 → 입력 칸을 누를 수 있다
      s.el.classList.toggle('mq-gone', ge > 0.59); // 흐르는 글자가 다 사라졌다 → 멈춤 단추도 치운다
    },
  };

  function measure() {
    vh = window.innerHeight;
    secs.forEach((s) => {
      const r = s.el.getBoundingClientRect();
      s.top = r.top + window.scrollY;
      s.h = r.height;
    });
  }
  function goal(s: Section) {
    const span = s.h - vh;
    return span > 0
      ? clamp((window.scrollY - s.top) / span, 0, 1)
      : window.scrollY >= s.top
        ? 1
        : 0;
  }
  function frame() {
    if (gone) return;
    let moving = false;
    secs.forEach((s) => {
      const t = goal(s);
      let p = reduce || still || s.p < 0 ? t : s.p + (t - s.p) * 0.16;
      if (Math.abs(t - p) < 0.0004) p = t;
      else moving = true;
      if (p !== s.p) {
        s.p = p;
        s.el.style.setProperty('--p', p.toFixed(4));
        fx[s.k]?.(s, p);
      }
    });
    raf = moving ? requestAnimationFrame(frame) : 0;
  }
  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }
  const onResize = () => {
    measure();
    kick();
  };
  function scrollTo(y: number, instant?: boolean) {
    window.scrollTo({
      top: Math.max(0, y),
      behavior: instant || reduce || still ? 'auto' : 'smooth',
    });
  }

  function toStage(i: number, focus: boolean, instant?: boolean) {
    const s = sec('svc');
    if (!s) return;
    measure();
    scrollTo(s.top + (GROW + ((i + HOLD) / 3) * (1 - GROW)) * (s.h - vh), instant);
    if (!focus) return;
    const t0 = Date.now();
    const wait = () => {
      if (gone) return;
      const el = root.querySelector<HTMLInputElement>(`[data-stage-ui="${i}"] input`);
      if (!el) return;
      const shown = s.el.dataset.on === String(i) && s.el.classList.contains('live');
      if (shown || Date.now() - t0 > 2600) el.focus({ preventScroll: true });
      else timers.add(window.setTimeout(wait, 60));
    };
    wait();
  }

  // 키보드로 문장 칸에 들어오면(아직 창이 커지기 전이라 보이지 않을 수 있다) 그 질문 자리로 스크롤해 보여 준다.
  const panes = Array.from(root.querySelectorAll<HTMLElement>('[data-stage-ui]'));
  const onFocusIn = (e: FocusEvent) => {
    const pane = e.currentTarget as HTMLElement;
    const s = sec('svc');
    const i = pane.dataset.stageUi;
    if (s && !(s.el.classList.contains('live') && s.el.dataset.on === i)) toStage(Number(i), false);
  };
  panes.forEach((pane) => pane.addEventListener('focusin', onFocusIn));

  measure();
  frame();
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('load', onResize);
  // 그림이 늦게 들어와 구간의 자리가 바뀌면 다시 잰다
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(onResize) : null;
  observer?.observe(document.body);

  return {
    toStage,
    toElement(selector) {
      const el = root.querySelector(selector);
      if (el) scrollTo(el.getBoundingClientRect().top + window.scrollY);
    },
    toTop() {
      scrollTo(0);
    },
    destroy() {
      gone = true;
      cancelAnimationFrame(raf);
      timers.forEach((id) => clearTimeout(id));
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onResize);
      observer?.disconnect();
      panes.forEach((pane) => pane.removeEventListener('focusin', onFocusIn));
    },
  };
}
