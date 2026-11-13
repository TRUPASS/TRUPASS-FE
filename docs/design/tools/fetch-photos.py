"""장소·숙소·음식 예시 사진을 Wikimedia Commons 에서 받아 4:3(400x300, 후기 썸네일은 200x150)으로 잘라 넣는다.
무엇을 쓰는지는 assets/photos/manifest.json 에 적혀 있고(제목·작성자·라이선스), 이 스크립트는
그 목록대로 내려받아 assets/photos/*.jpg 와 assets/CREDITS.md 를 만든다.
목업용 예시 사진이며 실제 서비스에서는 장소 API가 주는 이미지로 대체한다.

사용: python3 tools/fetch-photos.py [원본 캐시 폴더]
"""
import json, os, sys, time, urllib.request, urllib.error
from PIL import Image

UA = "design-mock-asset-fetch/0.1"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "photos")
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", ".photo-cache")
SIZE = (400, 300)


def fetch(url):
    delay = 6
    for _ in range(7):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):  # 요청 제한: 간격을 늘려 다시 시도
                time.sleep(delay)
                delay = min(delay * 2, 90)
                continue
            raise
    raise RuntimeError("gave up: " + url)


os.makedirs(CACHE, exist_ok=True)
manifest = json.load(open(os.path.join(OUT, "manifest.json"), encoding="utf-8"))
for m in manifest:
    raw = os.path.join(CACHE, m["file"])
    if not os.path.exists(raw):
        with open(raw, "wb") as f:
            f.write(fetch(m["thumb"]))
        time.sleep(1.5)
    im = Image.open(raw).convert("RGB")
    w, h = im.size
    W, H = m.get("size", SIZE)   # 후기 썸네일처럼 작게 쓰는 사진은 manifest 에 size 를 적는다
    if w / h > W / H:   # 가로가 남으면 좌우를 자른다
        nw = round(h * W / H)
        im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:               # 세로가 남으면 위아래를 자른다
        nh = round(w * H / W)
        im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    t = m.get("trim")   # 간판처럼 빼야 할 것이 가장자리에 있으면 그만큼(비율) 잘라 낸다. 위아래와 좌우를 같은 만큼 줄여 비율을 지킨다
    if t:
        w, h = im.size
        im = im.crop((round(w * t.get("left", 0)), round(h * t.get("top", 0)), round(w * (1 - t.get("right", 0))), round(h * (1 - t.get("bottom", 0)))))
    im.resize((W, H), Image.LANCZOS).save(os.path.join(OUT, m["file"]), quality=82, optimize=True)

# assets/CREDITS.md 는 손으로 관리한다. 여기서는 그 안의 사진 표("## 사진 (Wikimedia Commons)" 구획)만 목록대로 고쳐 쓴다.
HEAD = "## 사진 (Wikimedia Commons)"
lines = [
    HEAD,
    "",
    "모두 4:3으로 잘라 400×300(후기 썸네일은 200×150)으로 줄였다(변경 있음). 음식점·숙소는 가상의 이름이며 사진은 예시다.",
    "후기 썸네일은 화면에서 '웹 검색으로 찾은 후기'의 자리를 보여 주기 위한 예시이며 실제 후기 사진이 아니다.",
    "",
    "| 파일 | 쓰임 | 원본 | 작성자 | 라이선스 |",
    "| --- | --- | --- | --- | --- |",
]
for m in manifest:
    title = m["title"].replace("File:", "").replace("|", "\\|")
    lic = f"[{m['license']}]({m['license_url']})" if m.get("license_url") else m["license"]
    lines.append(f"| `photos/{m['file']}` | {m['use']} | [{title}]({m['page']}) | {(m['artist'] or '미상').replace('|', '/')} | {lic} |")
path = os.path.join(OUT, "..", "CREDITS.md")
text = open(path, encoding="utf-8").read() if os.path.exists(path) else "# 이미지 · 아이콘 · 지도 출처\n"
i = text.find(HEAD)
if i < 0:
    text = text.rstrip("\n") + "\n\n" + "\n".join(lines) + "\n"
else:
    j = text.find("\n## ", i + len(HEAD))
    text = text[:i] + "\n".join(lines) + "\n" + (text[j:] if j >= 0 else "")
with open(path, "w", encoding="utf-8") as f:
    f.write(text)
print("photos:", len(manifest))
