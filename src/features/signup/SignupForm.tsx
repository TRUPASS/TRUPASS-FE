import { useState } from 'react';
import { useNavigate } from 'react-router';
import { afterLogin } from '@/features/auth/next';
import { saveProfile, type ProfileInput } from '@/shared/api/auth';
import type { Schemas } from '@/shared/api/client';
import { authMode } from '@/shared/auth/mode';
import { U } from '@/shared/sample/data';
import { Button } from '@/shared/ui/Button';
import { Checkbox, OptionTile, Radio } from '@/shared/ui/Check';
import { Field, Input, Select } from '@/shared/ui/Field';
import { profileErrorMessage } from './messages';

type Interest = Schemas['TravelInterest'];
type Gender = Schemas['Gender'];
type TermKey = keyof Schemas['Agreements'];

// 화면에 보이는 문구와 백엔드가 받는 값 (PUT /users/me/profile)
const INTERESTS: readonly { value: Interest; label: string }[] = [
  { value: 'FOOD', label: '미식 · 맛집' },
  { value: 'SIGHTSEEING', label: '관광 · 명소' },
  { value: 'SHOPPING', label: '쇼핑' },
  { value: 'RELAXATION', label: '휴양 · 온천' },
  { value: 'CULTURE', label: '문화 · 예술' },
  { value: 'ARCHITECTURE', label: '건축 · 도시 산책' },
  { value: 'NATURE', label: '자연 · 야외 활동' },
  { value: 'THEME_PARK', label: '테마파크 · 체험' },
];
const MAX_INTERESTS = 3;
/** 선택 항목이라 처음에는 "선택 안 함"이다. 고르지 않은 값을 서버에 보내지 않는다 */
const GENDERS: readonly { value: Gender; label: string }[] = [
  { value: 'FEMALE', label: '여성' },
  { value: 'MALE', label: '남성' },
  { value: null, label: '선택 안 함' },
];
/** 동의는 사람이 직접 체크해야 한다. 서버가 동의한 시각을 기록하므로 미리 체크해 두지 않는다 */
const TERMS: readonly { key: TermKey; label: string; required: boolean }[] = [
  { key: 'termsOfService', label: '(필수) Trupass 이용약관', required: true },
  { key: 'privacyCollection', label: '(필수) 개인정보 수집 · 이용', required: true },
  { key: 'marketing', label: '(선택) 여행 혜택 · 알림 수신', required: false },
];
const NO_AGREEMENT: Record<TermKey, boolean> = {
  termsOfService: false,
  privacyCollection: false,
  marketing: false,
};
// 백엔드는 1900년부터 올해(UTC 기준)까지 받는다
const THIS_YEAR = new Date().getUTCFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1900 + 1 }, (_, i) => `${THIS_YEAR - i}년`);
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
 * 제출하면 백엔드(PUT /users/me/profile)에 저장하고 검색으로 넘어간다. 서버가 거절하면 이유를 보여 주고 이 화면에 남는다.
 * 로그인 없이 화면만 보는 설정(off)에서는 서버에 보내지 않고 넘어간다.
 */
export function SignupForm({ email, nickname }: SignupFormProps) {
  const navigate = useNavigate();
  const [nick, setNick] = useState(nickname);
  const [birth, setBirth] = useState(`${U.birth}년`);
  const [gender, setGender] = useState<Gender>(null);
  const [interests, setInterests] = useState<Interest[]>(['CULTURE', 'ARCHITECTURE']);
  const [agreed, setAgreed] = useState(NO_AGREEMENT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const full = interests.length >= MAX_INTERESTS;

  async function submit() {
    setError('');
    if (authMode !== 'off') {
      const profile: ProfileInput = {
        nickname: nick,
        birthYear: Number.parseInt(birth, 10),
        gender,
        interests,
        agreements: agreed,
      };
      setSaving(true);
      try {
        await saveProfile(profile);
      } catch (e) {
        setError(profileErrorMessage(e));
        setSaving(false);
        return;
      }
    }
    // 넘어가는 동안 다시 누르지 못하게 saving 은 그대로 둔다. 회원 정보 입력은 다시 돌아올 화면이 아니라 기록에서 바꾼다
    void navigate(afterLogin(), { replace: true });
  }

  return (
    <form
      className="pnl su-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!saving) void submit();
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
            <Select
              id="su-birth"
              options={YEARS}
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              hinted
            />
          </Field>
        </div>
        <Field label="성별" opt="선택 항목">
          <div className="radios">
            {GENDERS.map((g) => (
              <Radio
                key={g.label}
                name="gender"
                value={g.value ?? ''}
                checked={gender === g.value}
                onChange={() => setGender(g.value)}
              >
                {g.label}
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
            {INTERESTS.map(({ value, label }) => {
              const on = interests.includes(value);
              return (
                <OptionTile
                  key={value}
                  value={value}
                  checked={on}
                  // 정한 개수만큼 고르면 나머지 칸을 잠근다 (하나를 풀면 다시 열린다)
                  disabled={!on && full}
                  onChange={(e) =>
                    setInterests((list) =>
                      e.target.checked ? [...list, value] : list.filter((x) => x !== value),
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
          checked={TERMS.every((t) => agreed[t.key])}
          onChange={(e) => {
            const on = e.target.checked;
            setAgreed({ termsOfService: on, privacyCollection: on, marketing: on });
          }}
        >
          약관 전체 동의
        </Checkbox>
        <div className="hr" />
        {TERMS.map((t) => (
          <div key={t.key} className="term">
            <Checkbox
              checked={agreed[t.key]}
              required={t.required}
              onChange={(e) => {
                const on = e.target.checked;
                setAgreed((now) => ({ ...now, [t.key]: on }));
              }}
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
      {error && (
        <div className="pnl-b">
          <p className="t-sm cbad" role="alert">
            {error}
          </p>
        </div>
      )}
      <div className="pnl-f">
        <span className="t-sm c3 dt-only" aria-live="polite">
          {saving
            ? '회원 정보를 저장하는 중입니다.'
            : '가입을 마치면 적어 둔 조건으로 바로 검색합니다.'}
        </span>
        <Button kind="pri" size="lg" type="submit" disabled={saving} aria-busy={saving}>
          가입하고 검색 시작
        </Button>
      </div>
    </form>
  );
}
