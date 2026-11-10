"""숙소 주변 지도 이미지를 만든다.
OpenStreetMap 표준 타일을 몇 장 받아 이어 붙인 뒤 채도를 낮춘다. (지도 데이터 © OpenStreetMap contributors, ODbL)
목업용 정적 이미지이며 실제 서비스에서는 지도 SDK로 대체한다.

사용: python3 tools/fetch-map.py [타일 캐시 폴더]
출력: assets/map/<name>.jpg, assets/map/meta.json (핀 좌표 계산에 쓰는 투영 정보)
"""
import json, math, os, sys, time, urllib.request
from PIL import Image, ImageEnhance

UA = "TrupassDesignMock/0.1 (static design mockup; few tiles, one-off)"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "map")
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", ".tile-cache")

# name, 중심 위도, 중심 경도, 줌, 폭, 높이
VIEWS = [
    ("ueno", 35.7151, 139.7748, 16, 880, 480),
    ("ueno_m", 35.7151, 139.7761, 16, 560, 480),   # 모바일: 같은 확대 수준에서 핀이 모인 구간만 잘라 쓴다
]


def deg2px(lat, lon, z):
    n = 2 ** z * 256
    x = (lon + 180.0) / 360.0 * n
    y = (1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * n
    return x, y


def tile(z, x, y):
    fn = os.path.join(CACHE, f"{z}_{x}_{y}.png")
    if not os.path.exists(fn):
        delay = 5
        for _ in range(6):
            try:
                req = urllib.request.Request(f"https://tile.openstreetmap.org/{z}/{x}/{y}.png", headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=40) as r:
                    data = r.read()
                with open(fn, "wb") as f:
                    f.write(data)
                break
            except Exception as e:  # 요청 제한에 걸리면 간격을 늘려 다시 시도
                print("retry", fn, e)
                time.sleep(delay)
                delay *= 2
        time.sleep(0.6)
    return Image.open(fn).convert("RGB")


def build(name, lat, lon, z, w, h):
    cx, cy = deg2px(lat, lon, z)
    x0, y0 = cx - w / 2, cy - h / 2
    img = Image.new("RGB", (w, h), (240, 240, 240))
    for tx in range(int(x0 // 256), int((x0 + w) // 256) + 1):
        for ty in range(int(y0 // 256), int((y0 + h) // 256) + 1):
            img.paste(tile(z, tx, ty), (int(round(tx * 256 - x0)), int(round(ty * 256 - y0))))
    img = ImageEnhance.Color(img).enhance(0.42)       # 핀과 목록이 지도보다 먼저 읽히게
    img = ImageEnhance.Brightness(img).enhance(1.035)
    img = ImageEnhance.Contrast(img).enhance(0.94)
    img.save(os.path.join(OUT, name + ".jpg"), quality=84, optimize=True)
    return {"z": z, "w": w, "h": h, "x0": x0, "y0": y0}


os.makedirs(OUT, exist_ok=True)
os.makedirs(CACHE, exist_ok=True)
meta = {v[0]: build(*v) for v in VIEWS}
with open(os.path.join(OUT, "meta.json"), "w") as f:
    json.dump(meta, f, indent=1)
print("maps:", ", ".join(meta))
