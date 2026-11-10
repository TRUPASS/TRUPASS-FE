// Carbon 아이콘(@carbon/icons, Apache-2.0)에서 쓰는 것만 골라 src/lib/icons.mjs 로 굽는다.
// 사용: node tools/gen-icons.mjs <@carbon/icons 경로>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.argv[2];
if (!root) throw new Error('usage: node tools/gen-icons.mjs <path to node_modules/@carbon/icons>');
const NAMES = `plane hotel location location--filled restaurant cafe noodle-bowl monument building map
launch arrow--right arrow--left arrow--up arrow--down chevron--left chevron--right chevron--down chevron--up
close checkmark add subtract search edit renew information warning--alt error checkmark--filled checkmark--outline
pending in-progress circle-dash time calendar email document document--pdf document--signed receipt download
wallet purchase security locked certificate credentials policy fingerprint-recognition identification
user user--avatar user--multiple notification menu overflow-menu--horizontal help settings logout
star--filled pedestrian train filter send view copy history compare list--checked baggage-claim password
dot-mark earth printer undo trash-can home stamp misuse warning--filled information--filled incomplete radio-button
shopping--bag tree sight image send--alt caret--down caret--right link at`.split(/\s+/).filter(Boolean);

const out = {};
const missing = [];
for (const n of NAMES) {
  const f = join(root, 'svg/32', n + '.svg');
  if (!existsSync(f)) { missing.push(n); continue; }
  let s = readFileSync(f, 'utf8');
  s = s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  s = s.replace(/<title>[\s\S]*?<\/title>/g, '').replace(/<defs>[\s\S]*?<\/defs>/g, '');
  // 채움 아이콘의 투명 내부 패스(data-icon-path="inner-path")는 뺀다
  s = s.replace(/<path[^>]*data-icon-path="inner-path"[^>]*\/>/g, '').replace(/<path[^>]*fill="none"[^>]*\/>/g, '');
  s = s.replace(/\s+class="[^"]*"/g, '').replace(/\s+id="[^"]*"/g, '').replace(/\s+data-name="[^"]*"/g, '').trim();
  out[n] = s;
}
if (missing.length) console.warn('missing:', missing.join(' '));
const here = dirname(fileURLToPath(import.meta.url));
const body = `// 생성 파일 — tools/gen-icons.mjs 가 만든다. 직접 고치지 않는다.
// 출처: IBM Carbon Icons (@carbon/icons), Apache License 2.0. 32px 그리드 원본을 그대로 쓴다.
export const ICONS = ${JSON.stringify(out, null, 1)};
`;
writeFileSync(join(here, '../src/lib/icons.mjs'), body);
console.log('icons:', Object.keys(out).length);
