"""장소·숙소·음식 예시 사진을 Wikimedia Commons 에서 받아 4:3(400x300)으로 잘라 넣는다.
무엇을 쓰는지는 assets/photos/manifest.json 에 적혀 있고(제목·작성자·라이선스), 이 스크립트는
그 목록대로 내려받아 assets/photos/*.jpg 와 assets/CREDITS.md 를 만든다.
목업용 예시 사진이며 실제 서비스에서는 장소 API가 주는 이미지로 대체한다.

사용: python3 tools/fetch-photos.py [원본 캐시 폴더]
"""
import json, os, sys, time, urllib.request, urllib.error
from PIL import Image

UA = "TrupassDesignMock/0.1 (static design mockup; asset fetch)"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "photos")
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", ".photo-cache")
W, H = 400, 300


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
    if w / h > W / H:   # 가로가 남으면 좌우를 자른다
        nw = round(h * W / H)
        im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:               # 세로가 남으면 위아래를 자른다
        nh = round(w * H / W)
        im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im.resize((W, H), Image.LANCZOS).save(os.path.join(OUT, m["file"]), quality=82, optimize=True)

lines = [
    "# 이미지 · 아이콘 · 지도 출처",
    "",
    "목업에 쓴 외부 자료의 출처와 라이선스다. 실제 서비스에서는 연동 API가 주는 자료로 대체한다.",
    "",
    "## 지도",
    "",
    "- `assets/map/*.jpg` — 지도 데이터 © OpenStreetMap contributors (ODbL), 타일 그림 CC BY-SA 2.0.",
    "  `tools/fetch-map.py` 가 표준 타일을 이어 붙이고 채도를 낮췄다. 화면에도 저작자 표시를 넣었다.",
    "",
    "## 아이콘 · 글꼴",
    "",
    "- 아이콘: IBM Carbon Icons (`@carbon/icons`), Apache License 2.0. `src/lib/icons.mjs` 에 쓰는 것만 담았다.",
    "- 글꼴: IBM Plex Sans KR, SIL Open Font License 1.1 (Google Fonts 제공).",
    "- Google 로그인 버튼의 G 마크는 Google 의 상표이며 로그인 버튼 용도로만 썼다.",
    "",
    "## 사진 (Wikimedia Commons)",
    "",
    "모두 4:3으로 잘라 400×300으로 줄였다(변경 있음). 음식점·숙소는 가상의 이름이며 사진은 예시다.",
    "",
    "| 파일 | 쓰임 | 원본 | 작성자 | 라이선스 |",
    "| --- | --- | --- | --- | --- |",
]
for m in manifest:
    title = m["title"].replace("File:", "").replace("|", "\\|")
    lic = f"[{m['license']}]({m['license_url']})" if m.get("license_url") else m["license"]
    lines.append(f"| `photos/{m['file']}` | {m['use']} | [{title}]({m['page']}) | {(m['artist'] or '미상').replace('|', '/')} | {lic} |")
with open(os.path.join(OUT, "..", "CREDITS.md"), "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
print("photos:", len(manifest))
