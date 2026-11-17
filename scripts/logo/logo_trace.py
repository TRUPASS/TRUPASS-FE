# 래스터 그림의 한 색 영역을 벡터 경로로 옮긴다 (make-logo.py 가 쓴다). numpy 만 쓴다.
#
#   1. 윤곽선: 덮임 정도(0–1)가 0.5 인 선을 칸마다 이어 붙인다(marching squares). 가장자리의 반투명 픽셀 덕에 1픽셀보다 잘게 놓인다.
#   2. 곧은 변: 선에서 벗어나는 정도가 EPS_LINE 안이고 휘지 않은 구간을 찾는다. 수평 · 수직에 가까우면 딱 맞춘다.
#   3. 꼭짓점: 이웃한 두 곧은 변은 두 선이 만나는 점에서 꺾는다. 곡선 사이의 뾰족한 점은 꺾이는 각으로 찾는다.
#   4. 곡선: 나머지 구간은 3차 베지에로 맞춘다(Schneider, Graphics Gems 1990). 곧은 변과는 접선이 이어지게 한다.
#
# 좌표는 그림의 픽셀 좌표다(왼쪽 위가 0,0, 픽셀 하나가 1×1).
import numpy as np

H_STEP = 0.5        # 윤곽선을 다시 찍는 간격(px)
EPS_LINE = 0.30     # 곧은 변으로 볼 때 허용하는 벗어남(px)
TURN_MAX = 0.6      # 곧은 변의 앞 절반과 뒤 절반이 이루는 각의 한도(도). 완만한 호를 선분 여러 개로 쪼개지 않기 위한 것
MIN_LINE = 14.0     # 곧은 변의 최소 길이(px)
SHORT_LINE = 24.0   # 이보다 짧은 변은 양 끝이 꼭짓점일 때만 변으로 친다
LONG_LINE = 60.0    # 이보다 긴 변은 이웃을 따지지 않고 변으로 친다
GENTLE_DEG = 8.0    # 그 사이 길이의 변: 끝에서 12px 더 간 곳의 방향이 이만큼도 안 바뀌면 완만한 곡선의 일부로 본다
EPS_CURVE = 0.50    # 곡선을 맞출 때 허용하는 벗어남(px)
CORNER_WIN = 3.0    # 꺾이는 각을 재는 팔 길이(px)
CORNER_DEG = 38.0   # 이보다 크게 꺾이면 꼭짓점
CORNER_TRIM = 1.5   # 꼭짓점 둘레에서 곡선 맞춤에 쓰지 않는 길이(px). 뾰족한 끝은 래스터에서 살짝 뭉개져 있다
SNAP_DEG = 0.7      # 수평 · 수직으로 맞추는 각


# ---------- 1. 윤곽선 ----------
# 칸의 네 귀퉁이 중 안쪽(값 >= level)인 것에 따라 칸을 지나는 선분이 정해진다. T R B L 은 칸의 위 · 오른쪽 · 아래 · 왼쪽 변.
_SEG = {
    1: [('L', 'B')], 2: [('B', 'R')], 3: [('L', 'R')], 4: [('T', 'R')], 6: [('T', 'B')], 7: [('T', 'L')],
    8: [('T', 'L')], 9: [('T', 'B')], 11: [('T', 'R')], 12: [('L', 'R')], 13: [('R', 'B')], 14: [('L', 'B')],
}


def contours(field, level=0.5, min_area=12.0):
    """닫힌 윤곽선들의 목록. 각 윤곽선은 (N, 2) 배열(x, y)."""
    h, w = field.shape
    p = np.zeros((h + 2, w + 2))
    p[1:-1, 1:-1] = field
    ins = p >= level
    case = ins[:-1, :-1] * 8 + ins[:-1, 1:] * 4 + ins[1:, 1:] * 2 + ins[1:, :-1] * 1
    link = {}

    def add(a, b):
        link.setdefault(a, []).append(b)
        link.setdefault(b, []).append(a)

    for i, j in np.argwhere((case > 0) & (case < 15)):
        i, j, c = int(i), int(j), int(case[i, j])
        key = {'T': ('h', i, j), 'B': ('h', i + 1, j), 'L': ('v', i, j), 'R': ('v', i, j + 1)}
        if c in (5, 10):
            mid = (p[i, j] + p[i, j + 1] + p[i + 1, j + 1] + p[i + 1, j]) / 4 >= level
            if c == 5:   # 오른쪽 위와 왼쪽 아래가 안쪽
                segs = [('T', 'L'), ('R', 'B')] if mid else [('T', 'R'), ('L', 'B')]
            else:        # 왼쪽 위와 오른쪽 아래가 안쪽
                segs = [('T', 'R'), ('L', 'B')] if mid else [('T', 'L'), ('R', 'B')]
        else:
            segs = _SEG[c]
        for a, b in segs:
            add(key[a], key[b])

    def point(k):
        kind, i, j = k
        if kind == 'h':
            a, b = p[i, j], p[i, j + 1]
            return (j + (level - a) / (b - a) - 0.5, i - 0.5)
        a, b = p[i, j], p[i + 1, j]
        return (j - 0.5, i + (level - a) / (b - a) - 0.5)

    out, seen = [], set()
    for start in link:
        if start in seen:
            continue
        loop, prev, cur = [], None, start
        while cur not in seen:
            seen.add(cur)
            loop.append(point(cur))
            nxt = [k for k in link[cur] if k != prev]
            if not nxt:
                break
            prev, cur = cur, (nxt[0] if nxt[0] not in seen or len(nxt) == 1 else nxt[1])
        poly = np.array(loop)
        if len(poly) >= 8 and abs(area(poly)) >= min_area:
            out.append(poly)
    return out


def area(poly):
    x, y = poly[:, 0], poly[:, 1]
    return 0.5 * float(np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y))


def resample(poly, step=H_STEP):
    """닫힌 꺾은선을 같은 간격으로 다시 찍는다."""
    q = np.vstack([poly, poly[:1]])
    s = np.concatenate([[0.0], np.cumsum(np.linalg.norm(np.diff(q, axis=0), axis=1))])
    n = max(16, int(round(s[-1] / step)))
    t = np.arange(n) * (s[-1] / n)
    return np.stack([np.interp(t, s, q[:, 0]), np.interp(t, s, q[:, 1])], 1), s[-1] / n


# ---------- 2. 곧은 변 ----------
def fit_line(pts):
    """점들에 가장 잘 맞는 직선: (지나는 점, 진행 방향 단위벡터, 각 점의 벗어남)."""
    c = pts.mean(0)
    d = np.linalg.svd(pts - c, full_matrices=False)[2][0]
    if d @ (pts[-1] - pts[0]) < 0:
        d = -d
    return c, d, (pts - c) @ np.array([-d[1], d[0]])


def _bend(pts):
    """구간의 앞 절반과 뒤 절반이 이루는 각(도). 양 끝 10% 는 빼고 잰다. 곧은 변이면 0 에 가깝고 호이면 길이/반지름에 비례한다."""
    m = max(1, int(0.1 * len(pts)))
    p = pts[m:len(pts) - m]
    k = len(p) // 2
    d1, d2 = fit_line(p[:k])[1], fit_line(p[k:])[1]
    return float(np.degrees(np.arctan2(abs(d1[0] * d2[1] - d1[1] * d2[0]), d1 @ d2)))


def turning(q, k):
    """각 점에서 앞뒤 k 칸 팔 사이의 꺾이는 각(도)."""
    a = q - np.roll(q, k, 0)
    b = np.roll(q, -k, 0) - q
    return np.degrees(np.arctan2(a[:, 0] * b[:, 1] - a[:, 1] * b[:, 0], (a * b).sum(1)))


def find_lines(q, h):
    """곧은 변들의 목록 [(시작 번호, 끝 번호, 지나는 점, 방향)]. 번호는 q 의 번호다.
    q 는 가장 뾰족한 점에서 시작하므로(vectorize 참고) 곧은 변이 시작점을 넘어 이어지는 경우는 없다."""
    n = len(q)
    min_n = int(np.ceil(MIN_LINE / h))
    if n < min_n * 2:
        return []
    get = lambda i, j: q[np.arange(i, j + 1) % n]
    ok = lambda i, j: np.abs(fit_line(get(i, j))[2]).max() <= EPS_LINE
    runs, scan = [], 0
    while scan < n - min_n:
        i, j = scan, scan + min_n
        if not ok(i, j):
            scan += 1
            continue
        step = max(1, int(4 / h))
        while j + step < n and ok(i, j + step):        # 성큼성큼 늘린 뒤
            j += step
        while j + 1 < n and ok(i, j + 1):              # 한 칸씩 마저 늘린다
            j += 1
        # 가운데 구간으로 다시 맞춘 선에서 양쪽으로 벗어나지 않는 데까지를 변으로 잡는다 (끝에 묻어 온 곡선을 떼어 낸다)
        for _ in range(4):
            m = max(1, int(0.15 * (j - i)))
            c, d, _ = fit_line(get(i + m, j - m))
            lo, hi = max(i - int(8 / h), runs[-1][1] + 1 if runs else 0), min(j + int(8 / h), n - 1)
            good = np.abs((get(lo, hi) - c) @ np.array([-d[1], d[0]])) <= EPS_LINE
            a = b = (i + j) // 2 - lo
            while a > 0 and good[a - 1]:
                a -= 1
            while b < len(good) - 1 and good[b + 1]:
                b += 1
            if (lo + a, lo + b) == (i, j):
                break
            i, j = lo + a, lo + b
        if (j - i) * h >= MIN_LINE and _bend(get(i, j)) <= TURN_MAX:
            runs.append((i, j))
            scan = j + 1
            continue
        scan += max(1, min_n // 4)
    # 한 줄로 이어지는 이웃 구간은 합친다 (긴 변이 살짝 휘어 둘로 나뉜 경우)
    out = []
    for i, j in runs:
        if out and i - out[-1][1] <= int(3 / h) and _bend(get(out[-1][0], j)) <= TURN_MAX \
                and np.abs(fit_line(get(out[-1][0], j))[2]).max() <= EPS_LINE * 1.6:
            out[-1] = (out[-1][0], j)
        else:
            out.append((i, j))
    res = []
    for i, j in out:
        m = max(1, int(0.1 * (j - i)))                     # 양 끝 10% 는 빼고 선을 정한다
        c, d, _ = fit_line(get(i + m, j - m))
        res.append((i, j, c, d))
    return res


def snap(d):
    """수평 · 수직에 가까운 방향은 딱 맞춘다. (방향, 'h' | 'v' | None)"""
    ang = np.degrees(np.arctan2(d[1], d[0]))
    for base, kind in ((0, 'h'), (180, 'h'), (-180, 'h'), (90, 'v'), (-90, 'v')):
        if abs(ang - base) <= SNAP_DEG:
            r = np.radians(base)
            return np.array([round(np.cos(r)), round(np.sin(r))], float), kind
    return d, None


# ---------- 4. 곡선 맞춤 ----------
def bez(b, u):
    u = np.asarray(u, float)[:, None]
    return (1 - u) ** 3 * b[0] + 3 * (1 - u) ** 2 * u * b[1] + 3 * (1 - u) * u ** 2 * b[2] + u ** 3 * b[3]


def _solve(p0, p3, pts, u, t1, t2):
    """끝점을 고정하고 가운데 두 조절점을 최소제곱으로 구한다. t1 · t2 가 있으면 조절점은 그 접선 위에 놓인다."""
    b0, b1, b2, b3 = (1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u ** 2 * (1 - u), u ** 3
    r = pts - np.outer(b0 + b1, p0) - np.outer(b2 + b3, p3)
    z = np.zeros_like(u)
    cols = []
    cols += [np.concatenate([b1 * t1[0], b1 * t1[1]])] if t1 is not None else [np.concatenate([b1, z]), np.concatenate([z, b1])]
    cols += [np.concatenate([b2 * t2[0], b2 * t2[1]])] if t2 is not None else [np.concatenate([b2, z]), np.concatenate([z, b2])]
    sol = np.linalg.lstsq(np.stack(cols, 1), np.concatenate([r[:, 0], r[:, 1]]), rcond=None)[0]
    chord = np.linalg.norm(p3 - p0)
    k = 0
    if t1 is not None:
        a1 = sol[0]; k = 1
        p1 = p0 + t1 * (a1 if a1 > chord * 1e-3 else chord / 3)
    else:
        p1 = p0 + sol[0:2]; k = 2
    if t2 is not None:
        a2 = sol[k]
        p2 = p3 + t2 * (a2 if a2 > chord * 1e-3 else chord / 3)
    else:
        p2 = p3 + sol[k:k + 2]
    return np.array([p0, p1, p2, p3])


def _reparam(b, pts, u):
    d1 = 3 * (b[1:] - b[:-1])
    d2 = 2 * (d1[1:] - d1[:-1])
    uu = u[:, None]
    p = bez(b, u) - pts
    v1 = (1 - uu) ** 2 * d1[0] + 2 * (1 - uu) * uu * d1[1] + uu ** 2 * d1[2]
    v2 = (1 - uu) * d2[0] + uu * d2[1]
    den = (v1 * v1).sum(1) + (p * v2).sum(1)
    out = u - np.where(np.abs(den) > 1e-12, (p * v1).sum(1) / np.where(den == 0, 1, den), 0)
    return np.clip(out, 0, 1)


def fit_curve(p0, p3, pts, t1=None, t2=None, eps=EPS_CURVE, depth=0):
    """p0 에서 p3 까지, 사이의 점 pts 를 지나는 3차 베지에들의 목록. t1 은 p0 에서 나가는 방향, t2 는 p3 에서 되돌아오는 방향."""
    if len(pts) < 3:
        c = np.linalg.norm(p3 - p0) / 3
        return [np.array([p0, p0 + (t1 * c if t1 is not None else (p3 - p0) / 3), p3 + (t2 * c if t2 is not None else (p0 - p3) / 3), p3])]
    full = np.vstack([p0, pts, p3])
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(full, axis=0), axis=1))])
    u = (s / s[-1])[1:-1]
    b = _solve(p0, p3, pts, u, t1, t2)
    err = np.linalg.norm(bez(b, u) - pts, axis=1)
    for _ in range(8):
        if err.max() <= eps:
            return [b]
        if err.max() > eps * 6:
            break
        u = _reparam(b, pts, u)
        b = _solve(p0, p3, pts, u, t1, t2)
        err = np.linalg.norm(bez(b, u) - pts, axis=1)
    if err.max() <= eps or depth > 12:
        return [b]
    k = int(np.clip(np.argmax(err), 2, len(pts) - 3)) if len(pts) >= 6 else len(pts) // 2
    w = min(4, k, len(pts) - 1 - k)
    tan = pts[k - w] - pts[k + w] if w else p0 - p3
    tan = tan / np.linalg.norm(tan)
    return fit_curve(p0, pts[k], pts[:k], t1, tan, eps, depth + 1) + fit_curve(pts[k], p3, pts[k + 1:], -tan, t2, eps, depth + 1)


# ---------- 3. 조립 ----------
def _cross(c1, d1, c2, d2):
    """두 직선이 만나는 점 (평행하면 None)."""
    den = d1[0] * d2[1] - d1[1] * d2[0]
    if abs(den) < 1e-9:
        return None
    t = ((c2[0] - c1[0]) * d2[1] - (c2[1] - c1[1]) * d2[0]) / den
    return c1 + d1 * t


def _dist_to_path(pts, path):
    """점들에서 꺾은선 path 까지의 거리."""
    best = np.full(len(pts), np.inf)
    for a, b in zip(path[:-1], path[1:]):
        ab = b - a
        t = np.clip(((pts - a) @ ab) / max(ab @ ab, 1e-12), 0, 1)
        best = np.minimum(best, np.linalg.norm(pts - (a + t[:, None] * ab), axis=1))
    return best


def vectorize(poly, snap_y=None, seen=None):
    """닫힌 윤곽선 하나를 [('M', p), ('L', p), ('C', c1, c2, p), ...] 로 옮긴다.
    snap_y 는 수평 변의 y 를 고쳐 주는 함수(글자의 밑선 · 윗선을 가지런히 하는 데 쓴다).
    seen 에 목록을 주면 찾은 수평 변의 (y, 길이) 를 담아 준다."""
    q, h = resample(poly)
    n = len(q)
    k = max(1, int(round(CORNER_WIN / h)))
    turn = np.abs(turning(q, k))
    q = np.roll(q, -int(np.argmax(turn)), 0)           # 가장 뾰족한 점에서 시작한다: 곧은 변이 시작점에 걸치지 않는다
    turn = np.abs(turning(q, k))

    def keep(i, j, d):
        """완만한 곡선 안에서 잠깐 곧게 잡힌 구간은 변으로 치지 않는다 (곡선으로 한 번에 맞추는 편이 매끄럽다)."""
        if (j - i) * h >= LONG_LINE:
            return True

        def far(end, sign):      # 끝에서 12px 더 간 곳의 방향이 변의 방향과 이루는 각
            a, b = sorted((end + sign * int(9 / h), end + sign * int(15 / h)))
            dd = fit_line(q[np.arange(a, b + 1) % n])[1]
            return np.degrees(np.arccos(np.clip(d @ dd, -1, 1)))

        def sharp(end, sign):    # 끝 바로 옆에 꼭짓점이 있는가
            return turn[np.arange(end, end + sign * int(4 / h), sign) % n].max() >= CORNER_DEG

        if (j - i) * h < SHORT_LINE:
            return sharp(i, -1) and sharp(j, 1)
        return far(i, -1) >= GENTLE_DEG and far(j, 1) >= GENTLE_DEG

    lines = []
    for i, j, c, d in find_lines(q, h):
        if not keep(i, j, d):
            continue
        d, kind = snap(d)
        if kind == 'h':
            if seen is not None:
                seen.append((float(c[1]), (j - i) * h))
            if snap_y:
                c = np.array([c[0], snap_y(c[1])])
        lines.append({'i': i, 'j': j, 'c': c, 'd': d, 'kind': kind})

    def corners(i, j):
        """번호 i..j 사이(양 끝 제외)의 뾰족한 점들."""
        idx = [m for m in range(i + 1, j) if turn[m % n] >= CORNER_DEG and turn[m % n] >= turn[(m - 1) % n] and turn[m % n] > turn[(m + 1) % n]]
        keep = []
        for m in sorted(idx, key=lambda m: -turn[m % n]):   # 가까이 붙은 것들은 가장 뾰족한 것만 남긴다
            if all(abs(m - o) > k for o in keep):
                keep.append(m)
        return sorted(keep)

    proj = lambda ln, p: ln['c'] + ln['d'] * ((p - ln['c']) @ ln['d'])
    trim = int(round(CORNER_TRIM / h))
    segs = []            # ('L', 끝점) | ('C', c1, c2, 끝점)

    def curve(i, j, p0, p3, t1, t2, c0, c1):
        """번호 i..j 구간을 곡선으로. c0 · c1 은 양 끝이 꼭짓점인지(그렇다면 그 둘레의 점은 쓰지 않는다)."""
        a, b = i + (trim if c0 else 1), j - (trim if c1 else 1)
        pts = q[np.arange(a, b + 1) % n] if b >= a else np.zeros((0, 2))
        if (j - i) * h <= 2 * CORNER_TRIM + 1 or len(pts) < 3:
            segs.append(('L', p3))
            return
        for bz in fit_curve(p0, p3, pts, t1, t2):
            flat = np.abs((bz[1:3] - bz[0]) @ np.array([-(bz[3] - bz[0])[1], (bz[3] - bz[0])[0]])) / max(np.linalg.norm(bz[3] - bz[0]), 1e-9)
            segs.append(('L', bz[3]) if flat.max() < 0.05 else ('C', bz[1], bz[2], bz[3]))

    if not lines:
        cs = corners(0, n + 1) or [0]
        cs = sorted(set(m % n for m in cs))
        start = q[cs[0]]
        for a, b in zip(cs, cs[1:] + [cs[0] + n]):
            closed = len(cs) == 1
            tan = None
            if closed:                               # 꼭짓점이 없는 닫힌 곡선: 시작점에서도 매끄럽게 잇는다
                tan = q[(a + 3) % n] - q[(a - 3) % n]
                tan = tan / np.linalg.norm(tan)
            curve(a, b, q[a % n], q[b % n], tan, None if tan is None else -tan, not closed, not closed)
        return [('M', start)] + segs

    # 변과 변 사이를 차례로 잇는다. 각 변의 시작점 · 끝점은 앞뒤 틈을 보고 정한다
    m = len(lines)
    gaps = []
    for a in range(m):
        la, lb = lines[a], lines[(a + 1) % m]
        i, j = la['j'], lb['i'] + (n if a == m - 1 else 0)
        x = _cross(la['c'], la['d'], lb['c'], lb['d'])
        ang = np.degrees(np.arccos(np.clip(la['d'] @ lb['d'], -1, 1)))
        pts = q[np.arange(i, j + 1) % n]
        if x is not None and ang >= 4 and (j - i) * h <= 12 and _dist_to_path(pts, [proj(la, pts[0]), x, proj(lb, pts[-1])]).max() <= 0.9:
            gaps.append({'kind': 'corner', 'x': x})
            continue
        cs = corners(i, j)
        # 변의 끝 바로 옆의 꼭짓점은 그 변의 끝으로 삼는다
        e0 = e1 = None
        if cs and (cs[0] - i) * h <= 2 * CORNER_TRIM:
            e0 = cs.pop(0)
        if cs and (j - cs[-1]) * h <= 2 * CORNER_TRIM:
            e1 = cs.pop()
        if e0 is not None and e1 is None and not cs and (j - e0) * h <= 2 * CORNER_TRIM and x is not None:
            gaps.append({'kind': 'corner', 'x': x})      # 꼭짓점 하나가 두 변 모두에 붙어 있다
            continue
        gaps.append({'kind': 'curve', 'i': i, 'j': j, 'cs': cs, 'e0': e0, 'e1': e1})

    def end_of(a):       # 변 a 의 끝점
        g = gaps[a]
        if g['kind'] == 'corner':
            return g['x']
        return proj(lines[a], q[(g['e0'] if g['e0'] is not None else g['i']) % n])

    def start_of(a):     # 변 a 의 시작점
        g = gaps[(a - 1) % m]
        if g['kind'] == 'corner':
            return g['x']
        return proj(lines[a], q[(g['e1'] if g['e1'] is not None else g['j']) % n])

    start = start_of(0)
    for a in range(m):
        la, lb, g = lines[a], lines[(a + 1) % m], gaps[a]
        segs.append(('L', end_of(a)))
        if g['kind'] == 'corner':
            continue
        i0 = g['e0'] if g['e0'] is not None else g['i']
        j1 = g['e1'] if g['e1'] is not None else g['j']
        stops = [i0] + g['cs'] + [j1]
        for s, e in zip(stops[:-1], stops[1:]):
            first, last = s == i0, e == j1
            p0 = end_of(a) if first else q[s % n]
            p3 = start_of((a + 1) % m) if last else q[e % n]
            t1 = la['d'] if first and g['e0'] is None else None          # 곧은 변에서 매끄럽게 이어지는 곡선
            t2 = -lb['d'] if last and g['e1'] is None else None
            curve(s, e, p0, p3, t1, t2, not (first and g['e0'] is None), not (last and g['e1'] is None))
    return [('M', start)] + segs


def flatten(path, per=24):
    """경로를 꺾은선으로 편다 (검증 · 래스터용)."""
    pts = [path[0][1]]
    for seg in path[1:]:
        if seg[0] == 'L':
            pts.append(seg[1])
        else:
            b = np.array([pts[-1], seg[1], seg[2], seg[3]])
            pts.extend(bez(b, np.linspace(0, 1, per + 1)[1:]))
    return np.array(pts)


def deviation(poly, path):
    """원래 윤곽선의 점들이 옮긴 경로에서 벗어난 거리(px): (평균, 최대)."""
    flat = flatten(path)
    d = _dist_to_path(resample(poly)[0], np.vstack([flat, flat[:1]]))
    return float(d.mean()), float(d.max())
