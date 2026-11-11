// 글자가 어느 글꼴로 그려지는지 가린다.
// 화면의 글꼴 순서는 "Outfit", "Gothic A1" 이다: 라틴 글자와 숫자는 Outfit, Outfit 에 없는 글자(한글 · 화살표 등)는 Gothic A1 로 그려진다.
// 피그마의 글자 층은 한 구간에 글꼴 하나만 가지므로, 구간을 글꼴별로 나눠야 화면과 같은 모양이 된다.
// 이 기기에 설치된 Outfit 글꼴 파일의 cmap 을 읽어 "Outfit 에 있는 글자" 구간 목록을 만든다. 파일을 못 찾으면 아래 기본 목록을 쓴다.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Outfit 1.1 의 cmap 에서 뽑은 구간 (글꼴 파일을 못 찾을 때 쓴다)
const FALLBACK = [[0x20, 0x7e], [0xa0, 0xac], [0xae, 0x107], [0x10a, 0x113], [0x116, 0x11b], [0x11e, 0x123], [0x126, 0x127], [0x12a, 0x12b], [0x12e, 0x133], [0x136, 0x137], [0x139, 0x13e], [0x141, 0x148], [0x14a, 0x14d], [0x150, 0x15b], [0x15e, 0x161], [0x164, 0x165], [0x16a, 0x17e], [0x1cd, 0x1ce], [0x218, 0x21b], [0x237, 0x237], [0x2bc, 0x2bc], [0x2c6, 0x2c7], [0x2d8, 0x2dd], [0x300, 0x304], [0x306, 0x308], [0x30a, 0x30c], [0x312, 0x312], [0x326, 0x328], [0x1e80, 0x1e85], [0x1e9e, 0x1e9e], [0x1ef2, 0x1ef3], [0x2013, 0x2014], [0x2018, 0x201a], [0x201c, 0x201e], [0x2022, 0x2022], [0x2026, 0x2026], [0x2039, 0x203a], [0x2044, 0x2044], [0x2074, 0x2074], [0x20ac, 0x20ac], [0x2120, 0x2120], [0x2122, 0x2122], [0x2190, 0x2193], [0x2196, 0x2199], [0x2212, 0x2212], [0x2215, 0x2215], [0x2713, 0x2713], [0xfb01, 0xfb02]];

function cmapRanges(buf) {
  const u16 = o => buf.readUInt16BE(o), u32 = o => buf.readUInt32BE(o);
  const n = u16(4);
  let cmap = -1;
  for (let i = 0; i < n; i++) if (buf.toString('latin1', 12 + i * 16, 16 + i * 16) === 'cmap') cmap = u32(12 + i * 16 + 8);
  if (cmap < 0) throw new Error('cmap 표가 없다');
  const subs = [];
  for (let i = 0, k = u16(cmap + 2); i < k; i++) subs.push({ pid: u16(cmap + 4 + i * 8), eid: u16(cmap + 6 + i * 8), off: cmap + u32(cmap + 8 + i * 8) });
  const pick = subs.find(s => u16(s.off) === 12) || subs.find(s => u16(s.off) === 4 && (s.pid === 0 || (s.pid === 3 && s.eid === 1)));
  if (!pick) throw new Error('읽을 수 있는 cmap 형식이 없다');
  const o = pick.off, out = [];
  if (u16(o) === 12) {
    for (let i = 0, k = u32(o + 12); i < k; i++) out.push([u32(o + 16 + i * 12), u32(o + 20 + i * 12)]);
  } else {
    const seg = u16(o + 6) / 2, end = o + 14, start = end + seg * 2 + 2, delta = start + seg * 2, range = delta + seg * 2;
    for (let i = 0; i < seg; i++) {
      const s = u16(start + i * 2), e = u16(end + i * 2);
      if (s === 0xffff) continue;
      const ro = u16(range + i * 2);
      if (!ro) { if (((s + u16(delta + i * 2)) & 0xffff) !== 0 || e > s) out.push([s, e]); continue; }
      let a = -1;                                          // 글리프 번호가 0 인 칸은 빈 자리다
      for (let c = s; c <= e; c++) {
        const g = u16(range + i * 2 + ro + (c - s) * 2);
        if (g && a < 0) a = c;
        if (!g && a >= 0) { out.push([a, c - 1]); a = -1; }
      }
      if (a >= 0) out.push([a, e]);
    }
  }
  out.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of out) { const z = merged[merged.length - 1]; if (z && r[0] <= z[1] + 1) z[1] = Math.max(z[1], r[1]); else merged.push([...r]); }
  return merged;
}

// [시작, 끝] 구간 목록. family 글꼴에 들어 있는 글자들이다.
export function coverage(family = 'Outfit') {
  try {
    const file = execFileSync('fc-list', [`:family=${family}`, 'file'], { encoding: 'utf8' }).split('\n').map(l => l.replace(/:\s*$/, '').trim()).find(Boolean);
    if (!file) throw new Error('설치된 글꼴이 없다');
    return { ranges: cmapRanges(readFileSync(file)), from: file };
  } catch (e) {
    return { ranges: FALLBACK, from: `기본 목록 (${e.message})` };
  }
}

if (process.argv[1] && process.argv[1].endsWith('font-cover.mjs')) {
  const c = coverage(process.argv[2] || 'Outfit');
  const fmt = v => 'U+' + v.toString(16).toUpperCase().padStart(4, '0');
  console.log(c.from, '·', c.ranges.length, '구간');
  console.log(c.ranges.map(([a, b]) => a === b ? fmt(a) : `${fmt(a)}–${fmt(b)}`).join(' '));
}
