/** 푸터 (앱 화면). 회사 이름과 요금이 예시라는 사실을 여기에 한 번 적는다. */
export function AppFooter({ wide }: { wide?: boolean }) {
  return (
    <footer className={wide ? 'ftr jb wide' : 'ftr jb'}>
      <span>© 2026 Trupass. 화면의 항공권, 숙소, 요금과 회사 이름은 시안용 예시입니다.</span>
      <div className="row g16 wrap">
        <span>이용약관</span>
        <span>개인정보 처리방침</span>
        <span>전자금융거래 이용약관</span>
        <span>고객센터 1600-0000</span>
      </div>
    </footer>
  );
}
