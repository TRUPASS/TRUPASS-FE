import { useEffect, useRef } from 'react';
import {
  runGlobe,
  runLiveGlobe,
  type GlobeRoute,
  type GlobeStage,
  type LiveGlobe,
  type LiveTarget,
} from './globe';

interface GlobeProps {
  route: GlobeRoute;
  /** 한 장면에 멈춘 모습으로 그린다 */
  freeze: '' | 'flight' | 'stay';
  /** 움직임 없이 두 장면을 차례로 보여 주고 끝낸다 */
  calm: boolean;
  onStage: (stage: GlobeStage) => void;
  onDone: () => void;
}

/** 검색 중 화면(예시)의 지구본. 지도 데이터는 화면이 열릴 때 따로 받아 온다. */
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

interface LiveGlobeProps {
  /** 지금 장면과 출발 · 도착 국가. 바뀌면 지구본이 그쪽으로 옮겨 간다 */
  target: LiveTarget;
  /** 움직임 없이 장면마다 멈춘 모습으로 그린다 */
  calm: boolean;
  label: string;
}

/** 검색 중 화면(API)의 지구본. 진행 상태가 바뀔 때마다 target 이 바뀌고, 지구본은 다시 시작하지 않고 장면만 옮긴다. */
export function LiveSearchGlobe({ target, calm, label }: LiveGlobeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const globe = useRef<LiveGlobe | null>(null);
  const latest = useRef(target);

  useEffect(() => {
    latest.current = target;
    globe.current?.update(target);
  }, [target]);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    let gone = false;
    void import('@/assets/geo/world.json').then((data) => {
      if (gone) return;
      globe.current = runLiveGlobe(cv, { data: data.default, target: latest.current, calm });
    });
    return () => {
      gone = true;
      globe.current?.stop();
      globe.current = null;
    };
  }, [calm]);

  return <canvas ref={canvas} id="globe" width={560} height={560} role="img" aria-label={label} />;
}
