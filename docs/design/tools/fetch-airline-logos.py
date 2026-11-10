"""항공사 로고를 Wikimedia Commons 에서 받아 assets/brands/*.svg 로 정리해 넣는다.
무엇을 쓰는지는 아래 LOGOS 에 적혀 있다(원본 주소 · sha1 · 화면에 놓는 크기). 원본이 바뀌면 sha1 이 달라져 멈춘다.
정리: 화면에 필요 없는 정의(mask · id · class · 편집기 흔적)를 걷어 내고, 모양(path · polygon)과 색은 그대로 둔다.
Commons 에는 퍼블릭 도메인(저작권 보호 대상이 아닌 단순한 로고)으로 올라 있고, 상표권은 각 회사에 있다.

사용: python3 tools/fetch-airline-logos.py [원본 캐시 폴더]     (캐시 폴더에 <키>.svg 가 있으면 내려받지 않는다)
"""
import hashlib, json, os, re, sys, time, urllib.error, urllib.request
import xml.etree.ElementTree as ET

UA = "design-mock-asset-fetch/0.1"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "brands")
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", ".logo-cache")
SVG = "{http://www.w3.org/2000/svg}"

# 키: [화면에 적는 이름, Commons 파일, 원본 주소, 원본 sha1, 만든 곳, 화면 높이(px)]
# 높이는 글자 크기가 서로 비슷해 보이도록 로고마다 따로 정한다 (대한항공은 심벌 + 작은 글자, 제주항공은 글자뿐이다).
LOGOS = {
    "koreanair": ["대한항공", "File:Korean Air 2025.svg", "https://upload.wikimedia.org/wikipedia/commons/6/63/Korean_Air_2025.svg",
                  "b82d6a12088689dd39789facd4c34d7fd16b3baf", "Korean Air (Lippincott 디자인)", 16],
    "jejuair": ["제주항공", "File:Jeju Air Logo.svg", "https://upload.wikimedia.org/wikipedia/commons/f/f2/Jeju_Air_Logo.svg",
                "e63ca25788456b11889ec721979432b6f38fd648", "Jeju Air (벡터화: Jeromi Mikhael)", 12],
}
KEEP = {"g": ["transform", "fill", "fill-rule"], "path": ["d", "transform", "fill", "fill-rule"], "polygon": ["points", "transform", "fill", "fill-rule"]}


def fetch(url):
    delay = 8
    for _ in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=40) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):  # 요청 제한: 간격을 늘려 다시 시도
                time.sleep(delay)
                delay = min(delay * 2, 90)
                continue
            raise
    raise RuntimeError("gave up: " + url)


def clean(raw):
    text = raw.decode("utf-8")
    if "<!DOCTYPE" in text or "<!ENTITY" in text or "<script" in text.lower():
        raise SystemExit("예상하지 못한 내용이 든 SVG 다")
    root = ET.fromstring(text)
    # <style> 의 .이름{…} 규칙에서 fill · fill-rule 만 읽어 요소에 직접 적는다
    rules = {}
    for st in root.iter(SVG + "style"):
        for name, body in re.findall(r"\.([\w-]+)\s*\{([^}]*)\}", st.text or ""):
            rules[name] = dict(p.split(":", 1) for p in body.split(";") if ":" in p)

    def props(el):
        p = {}
        for c in (el.get("class") or "").split():
            p.update(rules.get(c, {}))
        p.update(dict(x.split(":", 1) for x in (el.get("style") or "").split(";") if ":" in x))
        return {k.strip(): v.strip() for k, v in p.items() if k.strip() in ("fill", "fill-rule")}

    def walk(el):
        tag = el.tag.replace(SVG, "")
        if tag not in KEEP:
            return ""
        at = {k: el.get(k) for k in KEEP[tag] if el.get(k)}
        at.update(props(el))
        if "fill" in at:
            at["fill"] = at["fill"].lower()
        if "transform" in at:
            at["transform"] = re.sub(r"\s*,\s*", " ", at["transform"])
        attrs = "".join(f' {k}="{re.sub(chr(10), " ", " ".join(v.split()))}"' for k, v in at.items())
        if tag == "g":
            inner = "".join(walk(c) for c in el)
            return f"<g{attrs}>{inner}</g>" if attrs and inner else inner   # 속성 없는 묶음은 푼다
        return f"<{tag}{attrs}/>"

    body = "".join(walk(c) for c in root)
    vb = root.get("viewBox")
    x, y, w, h = (float(v) for v in vb.split())
    if not body or x or y or w <= 0 or h <= 0:
        raise SystemExit("예상과 다른 SVG 다")
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}">{body}</svg>\n', w, h


os.makedirs(CACHE, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
meta = {}
for key, (label, title, url, sha1, by, height) in LOGOS.items():
    raw_path = os.path.join(CACHE, key + ".svg")
    if not os.path.exists(raw_path):
        with open(raw_path, "wb") as f:
            f.write(fetch(url))
        time.sleep(3)
    raw = open(raw_path, "rb").read()
    if hashlib.sha1(raw).hexdigest() != sha1:
        raise SystemExit(f"{key}: 원본이 적어 둔 것과 다르다 (sha1). Commons 의 파일이 바뀌었는지 확인한다.")
    svg, w, h = clean(raw)
    with open(os.path.join(OUT, key + ".svg"), "w", encoding="utf-8") as f:
        f.write(svg)
    meta[key] = {"label": label, "w": round(height * w / h), "h": height, "source": "https://commons.wikimedia.org/wiki/" + title.replace(" ", "_"), "by": by}
    print(f"{key}.svg  {len(raw)} → {len(svg)} bytes  {meta[key]['w']}x{height}")
# 화면이 읽는 크기 표 (src/lib/ui.mjs 의 airlineLogo 가 쓴다)
with open(os.path.join(OUT, "airlines.json"), "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=1)
    f.write("\n")
