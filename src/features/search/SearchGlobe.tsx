import { useEffect, useRef } from 'react';
import { runGlobe, type GlobeRoute, type GlobeStage } from './globe';

interface GlobeProps {
  route: GlobeRoute;
  /** 한 장면에 멈춘 모습으로 그린다 */
  freeze: '' | 'flight' | 'stay';
  /** 움직임 없이 두 장면을 차례로 보여 주고 끝낸다 */
  calm: boolean;
  onStage: (stage: GlobeStage) => void;
  onDone: () => void;
}

/** 검색 중 화면의 지구본. 지도 데이터는 화면이 열릴 때 따로 받아 온다. */
export function Globe({ route, freeze, calm, onStage, onDone }: GlobeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const handlers = useRef({ onStage, onDone });
  useEffect(() => {
    handlers.current = { onStage, onDone };
  });

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    let stop: (() => void) | undefined;
    let gone = false;
    void import('@/assets/geo/world.json').then((data) => {
      if (gone) return;
      stop = runGlobe(cv, {
        route,
        data: data.default,
        freeze,
        calm,
        onStage: (stage) => handlers.current.onStage(stage),
        onDone: () => handlers.current.onDone(),
      });
    });
    return () => {
      gone = true;
      stop?.();
    };
  }, [route, freeze, calm]);

  return (
    <canvas
      ref={canvas}
      id="globe"
      width={560}
      height={560}
      role="img"
      aria-label={`${route.from.name}에서 ${route.to.name}으로 가는 경로를 표시한 지구본`}
    />
  );
}
