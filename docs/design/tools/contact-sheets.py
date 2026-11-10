"""preview/<bp>/*.png 을 폭별 한 장(JPEG)으로 모은다 → preview/sheet-<bp>.jpg (README · PR 에서 한눈에 보는 용도).
사용: python3 tools/contact-sheets.py"""
import json, os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
screens = json.load(open(os.path.join(ROOT, "dist", "screens.json"), encoding="utf-8"))
FONT = None
for p in [os.path.expanduser("~/.fonts/IBMPlexSansKR-Medium.ttf"), "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"]:
    if os.path.exists(p):
        FONT = ImageFont.truetype(p, 22)
        break
FONT = FONT or ImageFont.load_default()
CFG = {"d": (5, 560, "desktop"), "t": (5, 400, "tablet"), "m": (7, 280, "mobile")}   # 열 수, 칸 폭
PAD, LABEL, BG = 32, 44, (234, 237, 241)

for bp, (cols, cw, name) in CFG.items():
    items = []
    for s in screens:
        f = os.path.join(ROOT, "preview", bp, s["id"] + ".png")
        if s["id"] == "00-foundations" or bp not in s["bps"] or not os.path.exists(f):
            continue
        im = Image.open(f).convert("RGB")
        items.append((f'{s["no"]} {s["name"]}', im.resize((cw, round(im.height * cw / im.width)), Image.LANCZOS)))
    rows = [items[i:i + cols] for i in range(0, len(items), cols)]
    W = PAD + cols * (cw + PAD)
    H = PAD + sum(LABEL + max(i.height for _, i in r) + PAD for r in rows)
    sheet = Image.new("RGB", (W, H), BG)
    dr = ImageDraw.Draw(sheet)
    y = PAD
    for r in rows:
        for c, (label, im) in enumerate(r):
            x = PAD + c * (cw + PAD)
            dr.text((x, y + 6), label if len(label) < cw // 13 else label[: cw // 13 - 1] + "…", fill=(55, 62, 71), font=FONT)
            sheet.paste(im, (x, y + LABEL))
        y += LABEL + max(i.height for _, i in r) + PAD
    out = os.path.join(ROOT, "preview", f"sheet-{name}.jpg")
    sheet.save(out, quality=80, optimize=True)
    print(os.path.basename(out), sheet.size, os.path.getsize(out) // 1024, "KB")
