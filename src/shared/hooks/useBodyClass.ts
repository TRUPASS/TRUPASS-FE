import { useLayoutEffect } from 'react';

/**
 * 화면이 떠 있는 동안 body 에 클래스를 붙인다.
 * styles 의 `body.vp` · `body.has-dock` · `body.veil-in` 같은 규칙이 이 클래스를 본다.
 */
export function useBodyClass(classes: string) {
  useLayoutEffect(() => {
    const list = classes.split(/\s+/).filter(Boolean);
    document.body.classList.add(...list);
    return () => document.body.classList.remove(...list);
  }, [classes]);
}
