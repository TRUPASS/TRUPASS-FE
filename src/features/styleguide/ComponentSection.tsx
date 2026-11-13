import { useRef } from 'react';
import { PROMPTS } from '@/shared/sample/data';
import { Ask, Chips, type AskHandle } from '@/shared/ui/Ask';
import { BrandSource } from '@/shared/ui/BrandMark';
import type { BrandKey } from '@/shared/ui/brands';
import { Button, IconButton } from '@/shared/ui/Button';
import { Checkbox, OptionTile, Radio } from '@/shared/ui/Check';
import { Field, Input } from '@/shared/ui/Field';
import { Note, Status, Tag } from '@/shared/ui/Status';
import { Steps } from '@/shared/ui/Steps';
import { Section } from './Section';

const SOURCES: BrandKey[] = [
  'tripdotcom',
  'expedia',
  'bookingdotcom',
  'hotelsdotcom',
  'googlemaps',
  'tripadvisor',
  'tabelog',
  'naver',
];
// 보기로 놓은 문장 칸은 엔터를 눌러도 다음으로 넘어가지 않는다
const noop = () => {};

/** 누르고 고르는 것과 상태를 알리는 것: 버튼 · 선택 · 상태와 표식 · 단계 · 출처 */
function Controls() {
  return (
    <div className="fd-col">
      <span className="t-sm w6">버튼</span>
      <div className="spec">
        <Button size="lg">검색 시작</Button>
        <Button kind="pri" size="lg">
          가입하고 검색 시작
        </Button>
        <Button kind="pri">이 조합으로 결제</Button>
      </div>
      <div className="spec">
        <Button after="renew">다시 검색</Button>
        <Button kind="txt">수정</Button>
        <Button disabled>다시 검색</Button>
        <Button size="sm">로그인</Button>
        <IconButton icon="arrow--left" className="rb" label="이전" />
        <IconButton icon="arrow--right" className="rb" label="다음" />
      </div>
      <span className="t-sm w6">선택</span>
      <div className="spec">
        <Checkbox defaultChecked>약관 전체 동의</Checkbox>
        <Checkbox>조식 추가</Checkbox>
        <Radio name="fd-term" defaultChecked>
          1년
        </Radio>
        <Radio name="fd-term">6개월</Radio>
      </div>
      <div className="spec">
        <OptionTile defaultChecked>문화 · 예술</OptionTile>
        <OptionTile>쇼핑</OptionTile>
      </div>
      <span className="t-sm w6">상태 · 표식</span>
      <div className="spec">
        <Status tone="ok">결제 완료</Status>
        <Status tone="run">결제 중</Status>
        <Status tone="warn">미등록</Status>
        <Status tone="bad">결제 실패</Status>
        <Status>대기</Status>
        <Tag tone="b">추천</Tag>
        <Tag tone="y">새로 찾음</Tag>
        <Tag tone="g">확정</Tag>
        <Tag>환불 불가</Tag>
      </div>
      <span className="t-sm w6">단계 · 출처 (회사 마크는 Simple Icons, 연동을 가정한 예시)</span>
      <div className="spec">
        <Steps current={1} />
      </div>
      <div className="spec">
        {SOURCES.map((k) => (
          <BrandSource key={k} name={k} />
        ))}
      </div>
    </div>
  );
}

/** 글을 적는 것과 알리는 글: 문장 검색 상자 · 입력 칸 · 안내 상자 */
function Inputs() {
  const flight = useRef<AskHandle>(null);
  return (
    <div className="fd-col">
      <span className="t-sm w6">문장 검색 상자 · 사진 위(유리) / 종이 위</span>
      <div className="ask-demo">
        <Ask ref={flight} prompt={PROMPTS[0]!} onSubmit={noop} />
        <Chips examples={PROMPTS[0]!.egs} onPick={(text) => flight.current?.fill(text)} />
      </div>
      <Ask prompt={PROMPTS[1]!} filled plain onSubmit={noop} />
      <span className="t-sm w6">입력</span>
      <Field label="닉네임" htmlFor="fd-nick" hint="2~12자. 화면과 알림에 표시됩니다.">
        <Input id="fd-nick" defaultValue="OO" hinted />
      </Field>
      <Field label="이메일" htmlFor="fd-mail" hint="읽기 전용">
        <Input id="fd-mail" defaultValue="user@example.com" readOnly hinted />
      </Field>
      <span className="t-sm w6">안내 상자</span>
      <Note>요금은 결제 직전에 한 번 더 조회합니다.</Note>
      <Note tone="b" icon="renew">
        수정 요청을 반영해 다시 검색했습니다.
      </Note>
    </div>
  );
}

/** 컴포넌트: 화면이 공통으로 쓰는 조각을 종류별로 늘어놓는다 */
export function ComponentSection() {
  return (
    <Section
      title="컴포넌트"
      desc="버튼과 표식은 알약형. 누를 수 있는 것은 실제 버튼과 입력이다. 상태는 글자 색과 테두리로 구분하고 점은 진행 중에만 쓴다"
    >
      <div className="fd-row">
        <Controls />
        <Inputs />
      </div>
    </Section>
  );
}
