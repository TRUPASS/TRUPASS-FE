// 화면에 쓰는 회사 마크만 골라 src/lib/brands.mjs 로 굽는다.
// 출처: Simple Icons (simple-icons, CC0-1.0). 마크와 이름의 상표권은 각 회사에 있다.
// 패키지의 코드는 실행하지 않고 자료 파일(data/simple-icons.json · icons/*.svg)만 읽는다.
// 사용: node tools/gen-brands.mjs <simple-icons 패키지 폴더>
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.argv[2];
if (!root) throw new Error('usage: node tools/gen-brands.mjs <path to node_modules/simple-icons>');
const meta = JSON.parse(readFileSync(join(root, 'data/simple-icons.json'), 'utf8'));
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

// [키(= simple-icons 의 slug), 화면에 적는 이름, 쓰임, 그리는 방법]
// 그리는 방법은 작은 크기(14–18px)에서도 알아볼 수 있게 하려는 것이다. 마크의 모양(path)은 바꾸지 않는다.
//   box  — 가로로 긴 워드마크: 글자가 있는 띠만 잘라 보여 준다(viewBox). 높이를 줄이고 폭을 넓게 쓴다.
//   tile — 색이 옅어 흰 바탕에서 보이지 않는 마크: 회사 색의 바탕(round 원 · square 둥근 사각형) 위에 마크를 올린다.
//          ink 는 마크의 색(dark 검정 · light 흰색), scale 은 바탕 안에서의 크기.
const PICK = [
  ['tripdotcom', '트립닷컴', '항공권 요금 조회', { box: '0 6 24 12' }],
  ['expedia', '익스피디아', '항공권 요금 조회'],
  ['bookingdotcom', '부킹닷컴', '숙소 요금 조회'],
  ['hotelsdotcom', '호텔스닷컴', '숙소 요금 조회'],
  ['googlemaps', 'Google 지도', '지도 · 장소'],
  ['tripadvisor', '트립어드바이저', '후기', { tile: 'round', ink: 'dark', scale: 0.72 }],
  ['tabelog', '타베로그', '후기', { tile: 'square', ink: 'dark', scale: 0.78 }],
  ['naver', '네이버 블로그', '후기', { tile: 'square', ink: 'light', scale: 0.5 }],
];
const out = {};
for (const [slug, label, use, draw = {}] of PICK) {
  const m = meta.find(e => e.slug === slug);
  if (!m) throw new Error('simple-icons 에 없는 마크: ' + slug);
  const svg = readFileSync(join(root, 'icons', slug + '.svg'), 'utf8');
  const d = (svg.match(/<path d="([^"]+)"/) || [])[1];
  if (!d || /<path[^>]*>[\s\S]*<path/.test(svg)) throw new Error('한 개의 path 가 아닌 마크: ' + slug);
  if (!/^[0-9A-Fa-f]{6}$/.test(m.hex) || !/^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s-]+$/.test(d)) throw new Error('예상과 다른 자료: ' + slug);
  out[slug] = { label, title: m.title, hex: '#' + m.hex.toLowerCase(), use, ...draw, path: d };
}
const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, '../src/lib/brands.mjs'), `// 생성 파일 — tools/gen-brands.mjs 가 만든다. 직접 고치지 않는다.
// 출처: Simple Icons ${version} (CC0-1.0). 24px 그리드의 한 색 마크. 마크와 이름의 상표권은 각 회사에 있다.
// 색(hex)은 tokens.css 의 --bx-* 토큰에 같은 값으로 적어 둔다.
export const BRANDS = ${JSON.stringify(out, null, 1)};
`);
console.log(Object.entries(out).map(([k, v]) => `--bx-${k}: ${v.hex};`).join(' '));
