# Gera os ícones do app (arte original: bloco azul com "M" em pixel, no céu):
#   python3 scripts/app-icons.py public/icons
import sys
from PIL import Image, ImageDraw

OUT = sys.argv[1]
SKY = (135, 206, 235)
BLUE, DARK, LIGHT = (70, 130, 220), (46, 90, 160), (120, 170, 240)
# "M" em grade 7x7 (1 = pixel branco)
M = ['1000001', '1100011', '1010101', '1001001', '1000001', '1000001', '1000001']

def icon(size: int, block_ratio: float) -> Image.Image:
    img = Image.new('RGB', (size, size), SKY)
    d = ImageDraw.Draw(img)
    b = int(size * block_ratio)
    x0 = y0 = (size - b) // 2
    edge = max(2, b // 12)
    d.rectangle([x0, y0, x0 + b - 1, y0 + b - 1], fill=BLUE)
    d.rectangle([x0, y0, x0 + b - 1, y0 + edge - 1], fill=LIGHT)
    d.rectangle([x0, y0 + b - edge, x0 + b - 1, y0 + b - 1], fill=DARK)
    d.rectangle([x0 + b - edge, y0, x0 + b - 1, y0 + b - 1], fill=DARK)
    px = b // 11
    mx = x0 + (b - 7 * px) // 2
    my = y0 + (b - 7 * px) // 2
    for r, row in enumerate(M):
        for c, v in enumerate(row):
            if v == '1':
                d.rectangle([mx + c * px, my + r * px, mx + (c + 1) * px - 1, my + (r + 1) * px - 1], fill=(255, 255, 255))
    return img

icon(192, 0.84).save(f'{OUT}/icon-192.png', optimize=True)
icon(512, 0.84).save(f'{OUT}/icon-512.png', optimize=True)
icon(180, 0.84).save(f'{OUT}/apple-touch-icon.png', optimize=True)
icon(512, 0.6).save(f'{OUT}/maskable-512.png', optimize=True)  # área segura do ícone adaptável
print('ok')
