import logoUrl from './trupass-logo.svg';

/**
 * Trupass 로고(마크 + 워드마크).
 * 그림 파일은 docs/design/tools/make-logo.py 가 만든다. 높이는 className 으로 정하고 폭은 비율을 따른다.
 */
export function Logo({ className }: { className?: string }) {
  return <img src={logoUrl} alt="Trupass" width={1859} height={291} className={className} />;
}
