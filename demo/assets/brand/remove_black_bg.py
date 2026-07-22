"""Matte logo for cream UI: keep ribbon+orb; kill outer dark glow plate."""
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent
src = ROOT / "logo-with-black-bg.png"
if not src.exists():
    src = ROOT / "logo.png"

base = Image.open(src).convert("RGBA")
w, h = base.size
px = base.load()

# Pass 1: build core mask (bright / saturated icon body)
core = Image.new("L", (w, h), 0)
cp = core.load()
for y in range(h):
    for x in range(w):
        r, g, b, _ = px[x, y]
        mx = max(r, g, b)
        chroma = mx - min(r, g, b)
        is_gold = r >= 130 and g >= 95 and (r + g) > b * 2
        if is_gold or (chroma >= 28 and mx >= 88) or (chroma >= 45 and mx >= 70):
            cp[x, y] = 255

# Dilate core so dark ribbon folds near body are kept; glow far away is not
keep = core.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.MaxFilter(31))
keep = keep.filter(ImageFilter.GaussianBlur(radius=6))
kp = keep.load()

out_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
op = out_img.load()

for y in range(h):
    for x in range(w):
        r, g, b, _ = px[x, y]
        mx = max(r, g, b)
        chroma = mx - min(r, g, b)
        luma = 0.299 * r + 0.587 * g + 0.114 * b
        support = kp[x, y]  # 0..255 soft keep field

        is_gold = r >= 130 and g >= 95 and (r + g) > b * 2
        is_body = is_gold or (chroma >= 26 and mx >= 70)

        if support < 8:
            alpha = 0
        elif is_body:
            # Soften if we're only on the fringe of support
            alpha = 255 if support >= 40 else int(255 * support / 40)
            # Kill muddy near-black even on fringe
            if luma < 40 and chroma < 35 and not is_gold:
                alpha = 0
        else:
            # residual plate
            alpha = 0

        op[x, y] = (r, g, b, max(0, min(255, alpha)))

out_img.save(ROOT / "logo.png", "PNG")
out_img.save(ROOT / "logo-transparent.png", "PNG")

cream = Image.new("RGBA", (w, h), (255, 248, 240, 255))
comp = Image.alpha_composite(cream, out_img)
comp.convert("RGB").save(ROOT / "logo-on-cream-preview.png")

opx = out_img.load()
cpx = comp.load()
z = sum(1 for y in range(h) for x in range(w) if opx[x, y][3] == 0)
hi = sum(1 for y in range(h) for x in range(w) if opx[x, y][3] >= 200)
print(f"alpha0={z} alpha_hi={hi}")
print(f"corner={opx[0,0]} center={opx[w//2,h//2]}")
print(f"cream_corner={cpx[0,0]} cream_center={cpx[w//2,h//2]}")
print("ok")
