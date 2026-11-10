"""랜딩 배경 사진을 화면용으로 가공한다 (원본은 Wikimedia Commons 의 자유 라이선스 사진, 출처는 assets/CREDITS.md).
사용: python3 -I tools/make-bg.py <원본 폴더> [만들 것 ...]
  원본 폴더에는 sky_above_sun.jpg · sky_cream_deck.jpg · wing_cirrus.jpg · (있으면) room.jpg · exp.jpg 가 있어야 한다.
만드는 파일(assets/bg/):
  hero.jpg   구름 위 하늘. 첫 화면의 바탕.
  deck.webp  구름층(투명 배경). 스크롤하면 아래에서 올라와 가까워진다.
  stats.jpg  파란 하늘. 숫자 구간의 바탕.
  flight.jpg · hotel.jpg · exp.jpg  항공 · 숙소 · 체험 구간의 바탕."""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

SRC = sys.argv[1]
ONLY = set(sys.argv[2:])
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'bg')
os.makedirs(OUT, exist_ok=True)
want = lambda k: not ONLY or k in ONLY
src = lambda n: os.path.join(SRC, n)

def load(n):
    return Image.open(src(n)).convert('RGB')
def fit(im, w, h=None):
    """가로 w 로 줄인다. h 를 주면 가운데 기준으로 잘라 w×h 로 맞춘다."""
    if h is None:
        return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    s = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))
def grade(im, lift=0.0, gain=1.0, gamma=1.0, tint=None, mix=0.0, sat=1.0):
    a = np.asarray(im).astype(np.float32) / 255
    a = np.clip(lift + a * gain, 0, 1) ** gamma
    if sat != 1.0:
        l = a @ np.array([0.299, 0.587, 0.114], np.float32)
        a = np.clip(l[..., None] + (a - l[..., None]) * sat, 0, 1)
    if tint is not None and mix:
        a = a * (1 - mix) + np.array(tint, np.float32) / 255 * mix
    return Image.fromarray((np.clip(a, 0, 1) * 255 + .5).astype(np.uint8))
def save(im, name, q=82):
    p = os.path.join(OUT, name)
    if name.endswith('.webp'):
        im.save(p, 'WEBP', quality=q, method=6)
    else:
        im.save(p, 'JPEG', quality=q, optimize=True, progressive=True)
    print(name, im.size, f'{os.path.getsize(p) // 1024}KB')
smooth = lambda x, a, b: np.clip((x - a) / (b - a), 0, 1) ** 2 * (3 - 2 * np.clip((x - a) / (b - a), 0, 1))

if want('hero'):
    # 필름 입자를 살짝 눌러 주고(확대해도 거칠지 않게) 그늘을 조금 들어 올린다.
    im = fit(load('sky_above_sun.jpg'), 2400).filter(ImageFilter.GaussianBlur(0.6))
    save(grade(im, lift=0.03, gain=1.02, gamma=0.92), 'hero.jpg', 80)

if want('deck'):
    # 구름층: 아래쪽 구름 부분만 잘라 위쪽 가장자리를 밝기에 따라 불규칙하게 녹인다.
    im = load('sky_cream_deck.jpg')
    W, H = im.size
    im = im.crop((0, round(H * 0.40), W, round(H * 0.93)))
    im = fit(im, 2200).filter(ImageFilter.GaussianBlur(1.2))
    a = np.asarray(im).astype(np.float32) / 255
    h, w = a.shape[:2]
    lum = a @ np.array([0.299, 0.587, 0.114], np.float32)
    # 밝은 흰 구름으로: 그늘을 들어 올리고 흰색을 섞는다. 아래로 갈수록 페이지 바탕색(흰색)에 가까워진다.
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    paper = np.array([255, 255, 255], np.float32) / 255        # 페이지 바탕(흰색)
    a = np.clip(0.30 + a * 0.86, 0, 1) ** 0.80
    l2 = a @ np.array([0.299, 0.587, 0.114], np.float32)
    a = l2[..., None] + (a - l2[..., None]) * 0.55             # 누런 기를 덜어 낸다
    a = a * 0.70 + paper * 0.30
    k = smooth(y, 0.55, 1.0)[..., None]
    a = a * (1 - k * 0.9) + paper * (k * 0.9)
    # 투명도: 위에서 아래로 차오르되 밝은 덩어리가 먼저 드러난다.
    lb = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))).astype(np.float32) / 255
    alpha = smooth(y * 2.6 + (lb - 0.5) * 1.5, 0.25, 1.15)
    alpha = np.clip(alpha * smooth(y, 0.0, 0.16), 0, 1)
    rgba = np.dstack([a, alpha])
    save(Image.fromarray((rgba * 255 + .5).astype(np.uint8), 'RGBA'), 'deck.webp', 86)

if want('stats') or want('flight'):
    wing = load('wing_cirrus.jpg')
    if want('flight'):
        save(grade(fit(wing, 2400), gamma=0.97), 'flight.jpg', 80)
    if want('stats'):
        # 날개가 없는 왼쪽 위 하늘만 쓴다.
        W, H = wing.size
        sky = wing.crop((0, 0, round(W * 0.47), round(H * 0.66)))
        save(grade(fit(sky, 2000), gain=1.04, gamma=0.95, sat=1.08), 'stats.jpg', 80)

for key, name, kw in (('hotel', 'room.jpg', dict(gamma=0.98)), ('exp', 'exp.jpg', dict(gamma=0.98))):
    if want(key) and os.path.exists(src(name)):
        im = load(name)
        save(grade(fit(im, min(2400, max(1920, im.width))), **kw), key + '.jpg', 80)
    elif want(key):
        print('없음(건너뜀):', name)
