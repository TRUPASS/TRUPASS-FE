import { useState } from 'react';
import { useNavigate } from 'react-router';
import { afterLogin } from '@/features/auth/next';
import { U } from '@/shared/sample/data';
import { Button } from '@/shared/ui/Button';
import { Checkbox, OptionTile, Radio } from '@/shared/ui/Check';
import { Field, Input, Select } from '@/shared/ui/Field';

const INTERESTS = [
  '미식 · 맛집',
  '관광 · 명소',
  '쇼핑',
  '휴양 · 온천',
  '문화 · 예술',
  '건축 · 도시 산책',
  '자연 · 야외 활동',
  '테마파크 · 체험',
];
const MAX_INTERESTS = 3;
const GENDERS = ['여성', '남성', '선택 안 함'];
const TERMS = [
  { label: '(필수) Trupass 이용약관', required: true },
  { label: '(필수) 개인정보 수집 · 이용', required: true },
  { label: '(선택) 여행 혜택 · 알림 수신', required: false },
];
const YEARS = Array.from({ length: 2008 - 1940 + 1 }, (_, i) => `${2008 - i}년`);
const NICK_MAX = 12;

interface SignupFormProps {
  /** 로그인한 Google 계정의 이메일 (고칠 수 없다) */
  email: string;
  /** 닉네임 칸에 처음 채워 둘 값 */
  nickname: string;
}

/**
 * 회원 정보 입력 폼. 입력 순서: 이메일(확인) → 닉네임 → 출생 연도 → 성별(선택) → 여행 관심사 → 약관.
 * 칸은 전부 실제 input · select · checkbox · radio 다. 닉네임(2~12자)과 필수 약관을 채워야 넘어간다.
 */
export function SignupForm({ email, nickname }: SignupFormProps) {
  const navigate = useNavigate();
  const [nick, setNick] = useState(nickname);
  const [interests, setInterests] = useState(['문화 · 예술', '건축 · 도시 산책']);
  const [agreed, setAgreed] = useState(TERMS.map((t) => t.required));
  const full = interests.length >= MAX_INTERESTS;

  return (
    <form
      className="pnl su-form"
      onSubmit={(e) => {
        e.preventDefault();
        // 백엔드에 회원 정보(닉네임 · 출생 연도 · 성별 · 관심사 · 약관 동의)를 받는 API 가 아직 없어 서버로 보내지 않는다.
        // 가입 자체는 Google 로그인 때 백엔드가 이미 마쳤다. API 가 생기면 여기서 보내고, 실패하면 넘어가지 않는다 (README 의 "로그인")
        void navigate(afterLogin());
      }}
    >
      <div className="pnl-b g24">
        <Field label="이메일" htmlFor="su-mail" hint="영수증과 예약 확정서가 이 주소로 발송됩니다.">
          <Input
            id="su-mail"
            type="email"
            value={email}
            readOnly
            hinted
            after={<span className="t-xs c3 fn">Google 계정</span>}
          />
        </Field>
        <div className="f2">
          <Field label="닉네임" htmlFor="su-nick" hint="2~12자. 화면과 알림에 표시됩니다.">
            <Input
              id="su-nick"
              value={nick}
              required
              minLength={2}
              maxLength={NICK_MAX}
              autoComplete="nickname"
              hinted
              onChange={(e) => setNick(e.target.value)}
              after={<span className="t-xs c3 fn num">{`${nick.length} / ${NICK_MAX}`}</span>}
            />
          </Field>
          <Field label="출생 연도" htmlFor="su-birth" hint="연령대에 맞는 추천에 사용합니다.">
            <Select id="su-birth" options={YEARS} defaultValue={`${U.birth}년`} hinted />
          </Field>
        </div>
        <Field label="성별" opt="선택 항목">
          <div className="radios">
            {GENDERS.map((g, i) => (
              <Radio key={g} name="gender" defaultChecked={i === 0}>
                {g}
              </Radio>
            ))}
          </div>
        </Field>
        <Field
          label="여행 관심사"
          opt={`최대 ${MAX_INTERESTS}개`}
          hint="추천 장소와 활동을 고르는 기준이 됩니다. 설정에서 언제든 바꿀 수 있습니다."
        >
          <div className="tiles t3">
            {INTERESTS.map((label) => {
              const on = interests.includes(label);
              return (
                <OptionTile
                  key={label}
                  checked={on}
                  // 정한 개수만큼 고르면 나머지 칸을 잠근다 (하나를 풀면 다시 열린다)
                  disabled={!on && full}
                  onChange={(e) =>
                    setInterests((list) =>
                      e.target.checked ? [...list, label] : list.filter((x) => x !== label),
                    )
                  }
                >
                  {label}
                </OptionTile>
              );
            })}
          </div>
        </Field>
      </div>
      <div className="hr" />
      <div className="pnl-b g10">
        <Checkbox
          textClassName="w6"
          checked={agreed.every(Boolean)}
          onChange={(e) => setAgreed(TERMS.map(() => e.target.checked))}
        >
          약관 전체 동의
        </Checkbox>
        <div className="hr" />
        {TERMS.map((t, i) => (
          <div key={t.label} className="term">
            <Checkbox
              checked={agreed[i] ?? false}
              required={t.required}
              onChange={(e) =>
                setAgreed((list) => list.map((v, k) => (k === i ? e.target.checked : v)))
              }
            >
              {t.label}
            </Checkbox>
            <button
              type="button"
              className="tbtn n t-sm fn"
              aria-label={`${t.label.replace(/^\([^)]*\)\s*/, '')} 보기`}
            >
              보기
            </button>
          </div>
        ))}
      </div>
      <div className="pnl-f">
        <span className="t-sm c3 dt-only">가입을 마치면 적어 둔 조건으로 바로 검색합니다.</span>
        <Button kind="pri" size="lg" type="submit">
          가입하고 검색 시작
        </Button>
      </div>
    </form>
  );
}
