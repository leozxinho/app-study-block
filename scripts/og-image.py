# Gera public/og-image.png (arte original):  python3 scripts/og-image.py public/og-image.png
# Arte original do og-image do MineLearn: céu, sol, blocos com letras e números, nome em pixel.
import sys
from PIL import Image, ImageDraw, ImageFont
W, H = 1200, 630
out = sys.argv[1]
img = Image.new('RGB', (W, H))
d = ImageDraw.Draw(img)
# céu em degradê
for y in range(H):
    t = y / H
    d.line([(0, y), (W, y)], fill=(int(120 + 60 * t), int(190 + 40 * t), int(240 + 10 * t)))
# sol quadrado
d.rectangle([1010, 50, 1110, 150], fill=(255, 214, 64)); d.rectangle([1025, 65, 1095, 135], fill=(255, 232, 120))
# nuvens de blocos
def cloud(x, y, w):
    for i in range(w):
        d.rectangle([x + i * 30, y, x + i * 30 + 30, y + 30], fill=(255, 255, 255))
    for i in range(1, w - 1):
        d.rectangle([x + i * 30, y - 30, x + i * 30 + 30, y], fill=(255, 255, 255))
cloud(80, 90, 5); cloud(640, 60, 4)
# chão liso (gramado claro e faixa mais escura), sem textura de blocos
d.rectangle([0, H - 150, W, H], fill=(120, 200, 110))
d.rectangle([0, H - 110, W, H], fill=(96, 176, 92))
# texto em pixel: desenha pequeno e amplia sem suavizar
def pixel_text(text, size, scale, color, shadow):
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', size)
    box = font.getbbox(text)
    w, h = box[2] - box[0] + 4, box[3] - box[1] + 4
    small = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(small).text((2 - box[0], 2 - box[1]), text, font=font, fill=color)
    small = small.point(lambda v: 255 if v > 110 else 0) if False else small
    alpha = small.split()[3].point(lambda v: 255 if v > 110 else 0)
    small.putalpha(alpha)
    big = small.resize((w * scale, h * scale), Image.NEAREST)
    sh = Image.new('RGBA', big.size, shadow + (0,)); sh.putalpha(big.split()[3])
    return big, sh
title, tsh = pixel_text('MineLearn', 22, 6, (255, 255, 255), (40, 40, 40))
tx = (W - title.width) // 2
img.paste(tsh, (tx + 10, 105 + 10), tsh); img.paste(title, (tx, 105), title)
sub, ssh = pixel_text('aprender jogando', 13, 4, (34, 58, 120), (255, 255, 255))
sx = (W - sub.width) // 2
img.paste(ssh, (sx + 4, 268 + 4), ssh); img.paste(sub, (sx, 268), sub)
# blocos com letras e números em cima do chão
blocks = [('1', (230, 80, 70)), ('A', (70, 130, 220)), ('+', (250, 190, 40)), ('B', (150, 90, 200)), ('3', (60, 170, 110))]
B = 96
total = len(blocks) * B + (len(blocks) - 1) * 24
x0 = (W - total) // 2
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 56)
for i, (ch, c) in enumerate(blocks):
    x = x0 + i * (B + 24); y = H - 150 - B
    d.rectangle([x, y, x + B, y + B], fill=c)
    dark = tuple(int(v * 0.7) for v in c); light = tuple(min(255, int(v * 1.25)) for v in c)
    d.rectangle([x, y + B - 10, x + B, y + B], fill=dark); d.rectangle([x + B - 10, y, x + B, y + B], fill=dark)
    d.rectangle([x, y, x + B, y + 8], fill=light)
    bb = d.textbbox((0, 0), ch, font=font)
    d.text((x + (B - (bb[2] - bb[0])) / 2 - bb[0], y + (B - (bb[3] - bb[1])) / 2 - bb[1] - 4), ch, font=font, fill=(255, 255, 255))
img.save(out, optimize=True)
print(out, img.size)
