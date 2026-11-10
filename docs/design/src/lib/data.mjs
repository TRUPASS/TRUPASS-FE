// Trupass 디자인 — 한 건의 요청이 로그인부터 결제 완료까지 가는 동안 쓰는 목업 데이터.
// 항공사·숙소·제휴사·음식점 이름은 모두 가상이다. 미술관·명소는 실제 장소다.

export const U = { name: '서지안', nick: '지안', mail: 'jian.seo@example.com', birth: 1994, card: '한울카드 ···· 4821' };

export const REQ = {
  text: '12월 18일부터 3박 4일 도쿄, 성인 2명, 예산 160만원. 미술관 위주로 조용하게 다니고 싶습니다.',
  short: '12월 18일부터 3박 4일 도쿄, 성인 2명, 예산 160만원. 미술관 위주로 조용하게',
  dest: '도쿄', range: '12.18 (금) – 12.21 (월)', nights: '3박 4일', pax: '성인 2명', budget: 1600000,
  prefs: '미술관 · 조용한 일정', at: '2026.11.10 14:02', order: 'TP-20261110-0417',
};
export const REV = {
  text: '숙소를 우에노 미술관 근처로 바꿔 주세요. 항공편과 수하물은 그대로 둡니다.',
  at: '2026.11.10 14:06',
};
export const EXAMPLES = [
  '12월 18일부터 3박 4일 도쿄, 성인 2명, 예산 160만원. 미술관 위주로',
  '1월 둘째 주 후쿠오카 2박 3일, 혼자, 80만원 이내. 맛집 중심으로',
  '2월 말 부모님과 제주 3박 4일, 걷는 구간이 적은 일정으로',
];

const leg = (no, d, dep, from, fc, arr, to, tc, dur) => ({ no, d, dep, from, fc, arr, to, tc, dur });
export const FLIGHTS = [
  { id: 'F1', air: '한빛항공', tag: '추천', cls: '이코노미', bag: '위탁 15kg 포함', price: 596400, src: 'haneul',
    out: leg('HB 721', '12.18 (금)', '09:10', '인천', 'ICN', '11:35', '나리타', 'NRT', '2시간 25분'),
    back: leg('HB 724', '12.21 (월)', '18:20', '나리타', 'NRT', '21:05', '인천', 'ICN', '2시간 45분') },
  { id: 'F2', air: '새솔항공', cls: '이코노미', bag: '위탁 수하물 별도', price: 438200, src: 'airmoa',
    out: leg('SL 305', '12.18 (금)', '14:40', '인천', 'ICN', '17:10', '나리타', 'NRT', '2시간 30분'),
    back: leg('SL 308', '12.21 (월)', '20:15', '나리타', 'NRT', '23:05', '인천', 'ICN', '2시간 50분') },
  { id: 'F3', air: '한빛항공', cls: '이코노미', bag: '위탁 15kg 포함', price: 742000, src: 'haneul',
    out: leg('HB 701', '12.18 (금)', '08:05', '김포', 'GMP', '10:15', '하네다', 'HND', '2시간 10분'),
    back: leg('HB 704', '12.21 (월)', '19:40', '하네다', 'HND', '22:10', '김포', 'GMP', '2시간 30분') },
];
export const BAG = { label: '위탁 수하물 23kg으로 변경', sub: '성인 2명 왕복', price: 44000 };

export const HOTELS_V1 = [
  { id: 'H1', name: '호텔 미나토 시부야', grade: '4성급', area: '시부야역 도보 6분', room: '스탠다드 트윈', meal: '조식 포함', cancel: '12.15 (화)까지 무료 취소', price: 468000, src: 'stayon', tag: '추천', photo: 'photos/room_a.jpg' },
  { id: 'H2', name: '신주쿠 가든 타워 호텔', grade: '4성급', area: '신주쿠산초메역 도보 4분', room: '모더레이트 더블', meal: '조식 불포함', cancel: '12.16 (수)까지 무료 취소', price: 402300, src: 'naru', photo: 'photos/room_b.jpg' },
  { id: 'H3', name: '긴자 그랜드 레지던스', grade: '5성급', area: '긴자역 도보 3분', room: '디럭스 트윈', meal: '조식 포함', cancel: '12.11 (금)까지 무료 취소', price: 648000, src: 'stayon', photo: 'photos/room_c.jpg' },
];
export const HOTELS_V2 = [
  { id: 'H4', name: '우에노 스테이 인', grade: '3성급', area: '우에노역 도보 3분', room: '스탠다드 더블', meal: '조식 불포함', cancel: '12.16 (수)까지 무료 취소', price: 312600, src: 'naru', tag: '변경', photo: 'photos/room_d.jpg' },
  { id: 'H5', name: '호텔 시노바즈 우에노', grade: '4성급', area: '유시마역 도보 3분', room: '스탠다드 트윈', meal: '조식 포함', cancel: '12.14 (월)까지 무료 취소', price: 421800, src: 'stayon', photo: 'photos/room_e.jpg' },
  { id: 'H6', name: '닛포리 타운 호텔', grade: '3성급', area: '닛포리역 도보 5분', room: '세미더블', meal: '조식 불포함', cancel: '환불 불가', price: 268400, src: 'naru', photo: 'photos/room_f.jpg' },
];

// 지도: tools/fetch-assets.py 가 만든 OSM 타일 합성 이미지. meta 는 assets/map/meta.json
const P = (no, name, kind, lat, lon, walk, dist, photo, why) => ({ no, name, kind, lat, lon, walk, dist, photo, why });
export const AREA_V1 = {
  key: 'shibuya', title: '시부야', hotel: { name: '호텔 미나토 시부야', lat: 35.6617, lon: 139.6989 },
  groups: [
    { key: 'fit', title: '요청 맞춤', sub: '미술관 · 조용한 일정', items: [
      P(1, '시부야구립 쇼토 미술관', '미술관', 35.6606, 139.6922, '도보 10분', '620m', 'photos/shoto.jpg', '주택가 안쪽의 구립 미술관'),
      P(2, '오타 기념 미술관', '우키요에 전문 미술관', 35.6695, 139.7046, '도보 17분', '1.0km', 'photos/ota.jpg', '소규모 전시 · 평일 한산'),
      P(3, '네즈 미술관', '동양 고미술 · 정원', 35.6622, 139.7171, '지하철 12분', '1.7km', 'photos/nezu.jpg', '정원 산책로 포함'),
    ] },
    { key: 'sight', title: '많이 찾는 명소', sub: '숙소 2km 이내', items: [
      P(4, '시부야 스크램블 교차로', '랜드마크', 35.6595, 139.7005, '도보 5분', '290m', 'photos/crossing.jpg'),
      P(5, '시부야 스카이', '전망대', 35.6585, 139.7022, '도보 8분', '470m', 'photos/sky.jpg'),
      P(6, '오모테산도', '가로수길 · 쇼핑', 35.6652, 139.7123, '지하철 8분', '1.3km', 'photos/omotesando.jpg'),
    ] },
    { key: 'food', title: '주변 음식점', sub: '도보 5분 이내', items: [
      P(7, '스시 우오마루', '스시 · 1인 4,000엔대', 35.6606, 139.6973, '도보 3분', '190m', 'photos/sushi.jpg'),
      P(8, '멘야 사쿠라자카', '라멘 · 1인 1,200엔대', 35.6632, 139.7001, '도보 3분', '200m', 'photos/ramen.jpg'),
      P(9, '깃사 로쿠메이', '카페 · 경양식', 35.6600, 139.7014, '도보 5분', '300m', 'photos/kissa.jpg'),
    ] },
  ],
};
export const AREA_V2 = {
  key: 'ueno', title: '우에노', hotel: { name: '우에노 스테이 인', lat: 35.7126, lon: 139.7792 },
  groups: [
    { key: 'fit', title: '요청 맞춤', sub: '미술관 · 조용한 일정', items: [
      P(1, '국립서양미술관', '미술관 · 세계유산', 35.7154, 139.7758, '도보 7분', '440m', 'photos/nmwa.jpg', '르 코르뷔지에 설계 본관'),
      P(2, '도쿄도 미술관', '미술관', 35.7172, 139.7729, '도보 13분', '770m', 'photos/tobikan.jpg', '기획전 · 오전 시간대 한산'),
      P(3, '도쿄 국립박물관', '박물관', 35.7188, 139.7765, '도보 12분', '730m', 'photos/tnm.jpg', '본관 일본 미술 상설전'),
    ] },
    { key: 'sight', title: '많이 찾는 명소', sub: '숙소 2km 이내', items: [
      P(4, '시노바즈 연못', '우에노 공원 · 산책로', 35.7122, 139.7710, '도보 12분', '740m', 'photos/shinobazu.jpg'),
      P(5, '우에노 도쇼구', '신사', 35.7154, 139.7711, '도보 13분', '790m', 'photos/toshogu.jpg'),
      P(6, '우에노 동물원', '동물원', 35.7167, 139.7733, '도보 12분', '700m', 'photos/zoo.jpg'),
    ] },
    { key: 'food', title: '주변 음식점', sub: '도보 5분 이내', items: [
      P(7, '소바도코로 하나미즈', '소바 · 1인 1,500엔대', 35.7124, 139.7812, '도보 3분', '180m', 'photos/soba.jpg'),
      P(8, '돈카츠 야마베', '돈카츠 · 1인 2,000엔대', 35.7116, 139.7800, '도보 2분', '130m', 'photos/tonkatsu.jpg'),
      P(9, '야키토리 도리신', '꼬치구이 · 1인 2,500엔대', 35.7139, 139.7806, '도보 3분', '190m', 'photos/yakitori.jpg'),
    ] },
  ],
};

// 합계 계산은 전부 여기서 한다 (화면에 숫자를 직접 적지 않는다).
export const combo = ({ flight = 'F1', hotel = 'H1', bag = false, hotels = HOTELS_V1 } = {}) => {
  const f = FLIGHTS.find(x => x.id === flight), h = hotels.find(x => x.id === hotel);
  const lines = [
    { k: '항공권', t: `${f.air} ${f.out.no} / ${f.back.no}`, s: `${f.cls} · 성인 2명 왕복`, p: f.price, m: f.air, src: f.src },
    ...(bag ? [{ k: '수하물', t: '위탁 23kg으로 변경', s: BAG.sub, p: BAG.price, m: f.air, src: f.src }] : []),
    { k: '숙소', t: h.name, s: `${h.room} · 3박 · ${h.meal}`, p: h.price, m: h.name, src: h.src },
  ];
  const total = lines.reduce((s, l) => s + l.p, 0);
  return { f, h, lines, total, left: REQ.budget - total, air: f.price + (bag ? BAG.price : 0) };
};
export const V1 = combo();
export const V1B = combo({ bag: true });
export const V2 = combo({ bag: true, hotel: 'H4', hotels: HOTELS_V2 });

// 결제 권한(사전 서명된 권한 증명서)
export const MANDATE = {
  id: 'TP-M-26111002', signed: '2026.11.10 14:07', until: '2027.11.09', from: '2026.11.10',
  per: 2000000, month: 5000000, scope: '항공권, 숙박', method: '매 결제마다 패스키로 본인 확인',
};
export const PAY = {
  at: '2026.11.10 14:08', approved: '2026.11.10 14:08:09',
  air: { no: 'HB-7K2M9Q', hold: '14:08:12', pay: '14:08:15', done: '14:08:21' },
  stay: { no: 'US-20931155', hold: '14:08:13', pay: '14:08:24', done: '14:08:31' },
  mailed: '14:09',
};
