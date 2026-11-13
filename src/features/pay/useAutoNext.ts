import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { still } from '@/shared/lib/capture';

/**
 * 화면이 뜨고 잠시 뒤(ms) 다음 화면으로 넘어간다 (결제 진행 등).
 * 그 전에 화면을 떠나면 넘어가지 않는다. 정지 화면 캡처에서도 넘어가지 않는다.
 */
export function useAutoNext(to: string, ms = 4000) {
  const navigate = useNavigate();
  useEffect(() => {
    if (still) return;
    const timer = window.setTimeout(() => void navigate(to), ms);
    return () => window.clearTimeout(timer);
  }, [navigate, to, ms]);
}
