import { Link } from 'react-router';
import { routes } from '@/app/routes';
import { BrandMark } from '@/shared/ui/BrandMark';
import { brandName } from '@/shared/ui/brandName';
import type { BrandKey } from '@/shared/ui/brands';
import { Logo } from '@/shared/ui/Logo';

const SOURCES: BrandKey[] = ['tripdotcom', 'expedia', 'bookingdotcom', 'hotelsdotcom'];

interface LandingFooterProps {
  /** [이용 방법]: 이용 방법 상자로 */
  onHow: () => void;
  /** 로고: 맨 위로 */
  onTop: () => void;
}

/** 랜딩의 푸터. 스크롤이 여기서 끝난다. 회사 이름이 연동을 가정한 예시라는 사실을 적는다. */
export function LandingFooter({ onHow, onTop }: LandingFooterProps) {
  return (
    <footer className="lp-ftr">
      <div className="ftr-win">
        <div className="ftr-g">
          <div className="ftr-c">
            <span className="k">검색 출처</span>
            <div className="ftr-src">
              {SOURCES.map((k) => (
                <span key={k} className="s">
                  <BrandMark name={k} />
                  <span>{brandName(k)}</span>
                </span>
              ))}
            </div>
            <span className="d">
              장소와 후기는 Google 지도와 웹 검색 결과를 함께 조회합니다. 위 회사들은 연동을 가정한
              예시이며 실제 제휴 관계가 아닙니다.
            </span>
          </div>
          <div className="ftr-c">
            <span className="k">안내</span>
            <a
              href="#how"
              onClick={(e) => {
                e.preventDefault();
                onHow();
              }}
            >
              이용 방법
            </a>
            <span>이용약관</span>
            <span>개인정보 처리방침</span>
            <span>전자금융거래 이용약관</span>
          </div>
          <div className="ftr-c">
            <span className="k">고객센터</span>
            <span className="v num">1600-0000</span>
            <span className="d">평일 09:00 ~ 18:00</span>
            <Link to={routes.login}>로그인</Link>
          </div>
        </div>
        <div className="ftr-e">
          <Logo
            size={20}
            variant="inv"
            to={routes.landing}
            label="Trupass 맨 위로"
            onClick={(e) => {
              e.preventDefault();
              onTop();
            }}
          />
          <span>© 2026 Trupass</span>
          <span className="grow" />
          <a className="ul" href="/CREDITS.md">
            사진 · 지도 · 글꼴 · 회사 마크 출처
          </a>
        </div>
      </div>
    </footer>
  );
}
