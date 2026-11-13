#!/usr/bin/env python3
"""브랜드 로고(팀이 만든 그림)를 벡터로 옮기고, 사이트와 앱이 쓰는 로고 · 파비콘 파일을 만든다.

  입력  assets/logo/source/trupass-logo.webp   2000×432, 투명 배경, 남색 + 하늘색 두 색
  출력  assets/logo/trupass-logo.svg           마크 + 워드마크
        assets/logo/trupass-mark.svg           마크만
        assets/logo/favicon.svg                마크, 정사각. 어두운 테마에서는 남색이 흰색으로 바뀐다
        assets/logo/favicon.ico                16 · 32 · 48 px
        assets/logo/apple-touch-icon.png       180 px, 흰 바탕
        src/lib/logo.mjs                       화면에 넣는 경로 자료 (lib/ui.mjs 의 mark · logo 가 쓴다)
  --app <저장소 루트> 를 주면 앱의 public/ (파비콘) 과 src/shared/ui/ (로고) 에도 같은 파일을 쓴다.

옮기는 방법은 logo_trace.py 에 있다. 끝에 원본과 견준 값(윤곽선이 벗어난 거리, 다시 그렸을 때 달라진 픽셀)을 출력한다.
사용: python3 tools/make-logo.py [--app ../..]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
import logo_trace as T  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets/logo/source/trupass-logo.webp'
OUT = ROOT / 'assets/logo'
WHITE = (255, 255, 255)


def load(path):
    """그림을 남색 · 하늘색 영역의 덮임 정도(0–1)로 나눈다. 반투명 가장자리는 가까운 영역의 색을 따른다."""
    a = np.asarray(Image.open(path).convert('RGBA')).astype(np.float64)
    alpha = np.clip(a[..., 3] / a[..., 3].max(), 0, 1)
    rgb, solid = a[..., :3], alpha >= 0.98
    blue = solid & (rgb[..., 1] > 80)                       # 하늘색은 초록 성분이 크다 (남색 26, 하늘색 133)
    navy, sky = np.median(rgb[solid & ~blue], 0), np.median(rgb[blue], 0)
    axis = sky - navy
    t = ((rgb - navy) @ axis) / (axis @ axis)
    lab = np.zeros(alpha.shape, np.int8)
    lab[(alpha >= 0.5) & (t < 0.5)] = 1
    lab[(alpha >= 0.5) & (t >= 0.5)] = 2
    for _ in range(8):
        todo = (lab == 0) & (alpha > 0)
        if not todo.any():
            break
        near = np.zeros_like(lab)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                near = np.maximum(near, np.roll(np.roll(lab, dy, 0), dx, 1))
        lab[todo] = near[todo]
    return alpha * (lab == 1), alpha * (lab == 2), tuple(int(round(v)) for v in navy), tuple(int(round(v)) for v in sky)


def trace(fields):
    """색 영역들의 윤곽선을 경로로 옮긴다. 수평 변의 높이가 거의 같은 것들은 한 값으로 모은다(글자의 밑선 · 윗선)."""
    polys = [(k, c) for k, f in enumerate(fields) for c in T.contours(f)]
    seen = []
    for _, c in polys:
        T.vectorize(c, seen=seen)
    groups = []
    for y, w in sorted(seen):
        if groups and y - groups[-1][-1][0] <= 0.75:
            groups[-1].append((y, w))
        else:
            groups.append([(y, w)])
    levels = [sum(y * w for y, w in g) / sum(w for _, w in g) for g in groups]
    snap_y = lambda y: min(levels, key=lambda v: abs(v - y)) if levels and min(abs(v - y) for v in levels) <= 0.75 else y
    return [(k, c, T.vectorize(c, snap_y=snap_y)) for k, c in polys]


def shift(path, dx, dy):
    d = np.array([dx, dy])
    return [(s[0],) + tuple(p + d for p in s[1:]) for s in path]


def path_d(paths):
    """경로들을 SVG path 의 d 로. 좌표는 소수 첫째 자리까지, 상대 좌표로 적는다(반올림한 절대 좌표의 차이라 오차가 쌓이지 않는다)."""
    q = lambda p: (int(round(p[0] * 10)), int(round(p[1] * 10)))

    def num(v):
        s = ('%d' % (v // 10)) if v % 10 == 0 else ('%.1f' % (v / 10))
        return s.replace('0.', '.', 1) if s.startswith(('0.', '-0.')) else s

    def join(cmd, vals):
        out = cmd
        for i, v in enumerate(vals):
            s = num(v)
            out += s if i == 0 or s.startswith('-') else ' ' + s
        return out

    out = []
    for path in paths:
        cur = q(path[0][1])
        out.append('M' + num(cur[0]) + ' ' + num(cur[1]))
        for seg in path[1:]:
            pts = [q(p) for p in seg[1:]]
            end = pts[-1]
            if seg[0] == 'L':
                dx, dy = end[0] - cur[0], end[1] - cur[1]
                if dx or dy:
                    out.append(join('h', [dx]) if dy == 0 else join('v', [dy]) if dx == 0 else join('l', [dx, dy]))
            else:
                out.append(join('c', [v for p in pts for v in (p[0] - cur[0], p[1] - cur[1])]))
            cur = end
        out.append('z')
    return ''.join(out)


def bounds(paths):
    pts = np.vstack([T.flatten(p) for p in paths])
    return pts[:, 0].min(), pts[:, 1].min(), pts[:, 0].max(), pts[:, 1].max()


def coverage(paths, size, scale=1.0, off=(0, 0), ss=8):
    """경로들이 덮는 정도를 그린다(0–255). 바깥 윤곽선을 칠한 뒤 구멍을 지운다. size 는 (폭, 높이)."""
    m = Image.new('L', (size[0] * ss, size[1] * ss), 0)
    d = ImageDraw.Draw(m)
    flats = [T.flatten(p) for p in paths]
    for hole in (False, True):
        for f in flats:
            if (T.area(f) < 0) == hole:
                d.polygon([((x * scale + off[0]) * ss, (y * scale + off[1]) * ss) for x, y in f], fill=0 if hole else 255)
    return m.resize(size, Image.BOX)


def paint(layers, size, bg=None):
    """[(색, 덮임 그림)] 을 한 장으로 합친다. bg 가 없으면 투명 배경."""
    out = Image.new('RGBA', size, (bg or WHITE) + (255 if bg else 0,))
    for rgb, cov in layers:
        out = Image.composite(Image.new('RGBA', size, rgb + (255,)), out, cov) if bg else Image.alpha_composite(out, Image.merge('RGBA', [Image.new('L', size, v) for v in rgb] + [cov]))
    return out


def icon(mark, size, margin, bg=None):
    """마크를 정사각 size 안에 가운데로 놓은 그림. mark 는 [(색, 경로들)], 좌표는 마크의 왼쪽 위가 0,0."""
    x0, y0, x1, y1 = bounds([p for _, ps in mark for p in ps])
    s = size * (1 - 2 * margin) / (x1 - x0)
    off = (size * margin - x0 * s, (size - (y1 - y0) * s) / 2 - y0 * s)
    return paint([(rgb, coverage(ps, (size, size), s, off)) for rgb, ps in mark], (size, size), bg)


def main():
    app = Path(sys.argv[sys.argv.index('--app') + 1]).resolve() if '--app' in sys.argv else None
    f_navy, f_sky, navy, sky = load(SRC)
    traced = trace([f_navy, f_sky])

    # 마크와 워드마크를 가른다: 마크는 하늘색이 닿는 데까지, 그 오른쪽은 글자
    mark_end = max(c[:, 0].max() for k, c, _ in traced if k == 1)
    x0, y0, _, _ = bounds([p for _, _, p in traced])
    part = lambda k, mark: [shift(p, -x0, -y0) for kk, c, p in sorted(traced, key=lambda t: t[1][:, 0].min()) if kk == k and (c[:, 0].min() < mark_end) == mark]
    m_navy, m_sky, word = part(0, True), part(1, True), part(0, False)
    _, _, w, h = bounds(m_navy + m_sky + word)
    mw = bounds(m_navy + m_sky)[2]
    r1 = lambda v: ('%.1f' % (np.ceil(v * 10) / 10)).rstrip('0').rstrip('.')
    W, H, MW = r1(w), r1(h), r1(mw)
    d_a, d_b, d_t = path_d(m_navy), path_d(m_sky), path_d(word)
    hexc = lambda c: '#%02x%02x%02x' % c
    NAVY, SKY = hexc(navy), hexc(sky)

    OUT.mkdir(parents=True, exist_ok=True)
    note = '<!-- Trupass 로고. tools/make-logo.py 가 assets/logo/source/trupass-logo.webp 에서 옮겨 만든 파일 -->'
    svg = lambda vb, body, extra='': f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"{extra}>{note}{body}</svg>\n'
    files = {
        'trupass-logo.svg': svg(f'0 0 {W} {H}', f'<title>Trupass</title><path fill="{NAVY}" d="{d_a}{d_t}"/><path fill="{SKY}" d="{d_b}"/>', f' width="{W}" height="{H}" role="img"'),
        'trupass-mark.svg': svg(f'0 0 {MW} {H}', f'<title>Trupass</title><path fill="{NAVY}" d="{d_a}"/><path fill="{SKY}" d="{d_b}"/>', f' width="{MW}" height="{H}" role="img"'),
    }
    # 파비콘: 마크를 정사각 틀 가운데에. 어두운 테마의 탭에서는 남색이 묻히므로 흰색으로 바꾼다
    side = float(MW) * 1.06
    fx, fy = (side - float(MW)) / 2, (side - float(H)) / 2
    files['favicon.svg'] = svg(f'{r1(-fx)} {r1(-fy)} {r1(side)} {r1(side)}',
        f'<style>.a{{fill:{NAVY}}}.b{{fill:{SKY}}}@media (prefers-color-scheme:dark){{.a{{fill:#fff}}}}</style><path class="a" d="{d_a}"/><path class="b" d="{d_b}"/>')
    for name, text in files.items():
        (OUT / name).write_text(text, encoding='utf-8')

    mark = [(navy, m_navy), (sky, m_sky)]
    ico = [icon(mark, s, 0.03) for s in (48, 32, 16)]
    ico[0].save(OUT / 'favicon.ico', format='ICO', sizes=[(48, 48), (32, 32), (16, 16)], append_images=ico[1:])
    icon(mark, 180, 0.17, bg=WHITE).convert('RGB').save(OUT / 'apple-touch-icon.png', optimize=True)

    (ROOT / 'src/lib/logo.mjs').write_text(
        '// Trupass 로고의 경로 자료. tools/make-logo.py 가 만든 파일이므로 직접 고치지 않는다.\n'
        '// w · h 는 전체(마크 + 워드마크)의 크기, mw 는 마크의 폭. a 는 마크의 남색, b 는 마크의 하늘색, t 는 워드마크(TRUPASS).\n'
        f"export const LOGO = {{\n  w: {W}, h: {H}, mw: {MW},\n  a: '{d_a}',\n  b: '{d_b}',\n  t: '{d_t}',\n}};\n", encoding='utf-8')

    if app:
        for name in ('favicon.svg', 'favicon.ico', 'apple-touch-icon.png'):
            (app / 'public' / name).write_bytes((OUT / name).read_bytes())
        (app / 'src/shared/ui/trupass-logo.svg').write_bytes((OUT / 'trupass-logo.svg').read_bytes())

    # ---- 원본과 견준다 ----
    devs = [T.deviation(c, p) for _, c, p in traced]
    segs = [s for _, _, p in traced for s in p[1:]]
    print(f'색: 남색 {NAVY}, 하늘색 {SKY} / 크기 {W} × {H}, 마크 폭 {MW}')
    print(f'도형 {len(traced)}개, 선분 {sum(s[0] == "L" for s in segs)}개 + 곡선 {sum(s[0] == "C" for s in segs)}개, 경로 {len(d_a) + len(d_b) + len(d_t)}자')
    print(f'윤곽선이 벗어난 거리: 평균 {np.mean([m for m, _ in devs]):.2f}px, 최대 {max(x for _, x in devs):.2f}px (원본 폭 2000px 기준)')
    size = Image.open(SRC).size
    diff = total = 0
    for k, f in enumerate((f_navy, f_sky)):
        again = np.asarray(coverage([p for kk, _, p in traced if kk == k], size, ss=4)).astype(np.float64) / 255
        diff += int((np.abs(again - f) > 0.25).sum())
        total += int(((again > 0.5) | (f > 0.5)).sum())
    print(f'다시 그렸을 때 덮임이 25% 넘게 달라진 픽셀: {diff}개 (로고가 덮는 {total}개의 {diff / total * 100:.2f}%)')
    for name in sorted(p.name for p in OUT.iterdir() if p.is_file()):
        print(f'  assets/logo/{name}  {(OUT / name).stat().st_size} B')


if __name__ == '__main__':
    main()
