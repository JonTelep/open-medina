# Builds per-page Open Graph images from public/og-image.png. Run: python3 scripts/make-og.py
from PIL import Image, ImageDraw, ImageFont
B = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
R = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
NAVY, GOLD, WHITE, BLUE = (11, 31, 77), (234, 179, 8), (255, 255, 255), (219, 234, 254)
PAGES = {
    "og-ballot.png": ("What's on my ballot", ["November 3, 2026 general election.", "Races and issues from official", "sample ballots, by community."]),
    "og-local.png": ("Local government", ["Every city, village and township.", "Census data and officials, each", "linked to its official source."]),
    "og-legislation.png": ("State legislation", ["Ohio bills from Medina County's", "legislators, linked to LegiScan", "and legislature.ohio.gov."]),
}
base = Image.open("public/og-image.png").convert("RGB")
for name, (title, lines) in PAGES.items():
    im = base.copy()
    ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    d.rectangle([490, 0, 1200, 611], fill=NAVY + (255,))
    im = Image.alpha_composite(im.convert("RGBA"), ov)
    d = ImageDraw.Draw(im)
    d.text((520, 140), "OPENMEDINA  ·  MEDINA COUNTY, OHIO", font=ImageFont.truetype(B, 24), fill=GOLD)
    d.text((516, 180), title, font=ImageFont.truetype(B, 62), fill=WHITE)
    for i, l in enumerate(lines):
        d.text((520, 280 + i * 46), l, font=ImageFont.truetype(R, 34), fill=BLUE)
    d.text((520, 440), "openmedina.org", font=ImageFont.truetype(B, 30), fill=GOLD)
    im.convert("RGB").save("public/" + name, optimize=True)
    print(name)
