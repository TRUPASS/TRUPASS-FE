/** 지난 여행: 다녀온 여행이 일정 · 문서와 함께 남는 자리. 아직 다녀온 여행이 없을 때의 안내를 보여 준다. */
export function PastTrips() {
  return (
    <section className="pnl">
      <div className="pnl-h">
        <h2 className="t-h3">지난 여행</h2>
      </div>
      <div className="pnl-b">
        <p className="t-sm c3">
          아직 다녀온 여행이 없습니다. 다녀온 여행은 일정과 문서와 함께 여기에 남습니다.
        </p>
      </div>
    </section>
  );
}
