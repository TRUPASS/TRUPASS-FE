import { useLocation, useSearchParams } from 'react-router';
import { routes } from '@/app/routes';
import { ResultScreen } from '@/features/results/ResultScreen';
import { FLIGHTS, REQ, REV, V1, V2 } from '@/shared/sample/data';
import { Note } from '@/shared/ui/Status';

const T1 = REQ.at.slice(11);
const T2 = REV.at.slice(11);

/**
 * 검색 결과: 항공권과 숙소 고르기. 주소의 쿼리로 처음 모습을 정한다.
 * - /results: 첫 검색 결과. 항공권 3건이 표의 줄로 떠오르고, 줄 아래의 [추천 숙소 3곳]을 펼쳐 숙소와 추가 선택을 고른다.
 * - /results?dock=up: 수정 요청 독이 올라와 문장이 적힌 모습. 화면 높이만큼만 보여 준다.
 * - /results?rev=2: 수정 요청을 반영해 다시 검색한 결과. 무엇이 바뀌고 무엇을 유지했는지 맨 위에 적고,
 *   바뀐 조건과 새로 찾은 숙소에 표식을 단다. 바뀐 숙소가 바로 보이도록 고른 항공권의 숙소를 펼쳐 둔다.
 */
export function ResultsPage() {
  const [params] = useSearchParams();
  // 주소가 같아도 새로 들어오면 고른 것과 독을 처음 모습으로 되돌린다
  const { key } = useLocation();

  if (params.get('rev') === '2') {
    return (
      <ResultScreen
        key={key}
        head="조건을 바꿔 다시 찾았습니다"
        start={V2}
        ver={`v2 ${T2}`}
        changed
        open
        change={{ stay: [['위치', '우에노역 도보 5분 이내', '변경']] }}
        top={
          <Note tone="b" icon="renew">
            <div className="g2">
              <span className="w6 c1">수정 요청을 반영해 다시 검색했습니다.</span>
              <span>
                {`항공권마다 보여 주는 숙소를 우에노역 도보 5분 이내로 바꿨습니다. 항공권 ${FLIGHTS.length}건과 고르신 우에노 스테이 인은 그대로 두었습니다.`}
              </span>
            </div>
          </Note>
        }
        history={[
          { v: 'v2', at: T2, text: REV.text },
          { v: 'v1', at: T1, text: '첫 검색', to: routes.results },
        ]}
        dock={{ placeholder: '예) 조식이 포함된 숙소만 보여 주세요' }}
      />
    );
  }

  const up = params.get('dock') === 'up';
  return (
    <ResultScreen
      key={key}
      head={`항공권 ${FLIGHTS.length}건을 찾았습니다`}
      start={V1}
      ver={`v1 ${T1}`}
      open={up}
      vp={up}
      dock={up ? { up: true, text: REV.text } : undefined}
    />
  );
}
