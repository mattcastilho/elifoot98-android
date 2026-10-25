"""Desenha o icone do app (arte propria): gramado listrado, bola e "98".
Uso: python3 gerar_icone.py icone.png   (precisa do Pillow)
"""
import math, sys
from PIL import Image, ImageDraw, ImageFont

N = 768                      # desenha grande e reduz para 192 (antisserrilhado)
img = Image.new("RGBA", (N, N), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# fundo: quadrado arredondado com listras de gramado
mask = Image.new("L", (N, N), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, N - 1, N - 1], radius=150, fill=255)
campo = Image.new("RGBA", (N, N))
dc = ImageDraw.Draw(campo)
for i in range(8):
    dc.rectangle([0, i * N // 8, N, (i + 1) * N // 8], fill=(30, 140, 50) if i % 2 else (40, 160, 60))
# linhas do campo
dc.line([0, N // 2, N, N // 2], fill=(235, 245, 235), width=10)
dc.ellipse([N / 2 - 170, N / 2 - 170, N / 2 + 170, N / 2 + 170], outline=(235, 245, 235), width=10)
img.paste(campo, (0, 0), mask)
d = ImageDraw.Draw(img)

# bola
cx, cy, r = N * 0.40, N * 0.42, 215
bola = Image.new("RGBA", (N, N), (0, 0, 0, 0))
db = ImageDraw.Draw(bola)
db.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255))

def pent(x, y, s, rot):
    return [(x + s * math.cos(rot + k * 2 * math.pi / 5), y + s * math.sin(rot + k * 2 * math.pi / 5)) for k in range(5)]

PRETO = (25, 25, 25)
db.polygon(pent(cx, cy, r * 0.30, -math.pi / 2), fill=PRETO)
for k in range(5):
    a = -math.pi / 2 + k * 2 * math.pi / 5
    vx, vy = cx + r * 0.30 * math.cos(a), cy + r * 0.30 * math.sin(a)
    px, py = cx + r * 0.95 * math.cos(a), cy + r * 0.95 * math.sin(a)
    db.line([vx, vy, px, py], fill=PRETO, width=12)
    db.polygon(pent(cx + r * 1.08 * math.cos(a), cy + r * 1.08 * math.sin(a), r * 0.27, a + math.pi), fill=PRETO)
mb = Image.new("L", (N, N), 0)
ImageDraw.Draw(mb).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
sombra = Image.new("RGBA", (N, N), (0, 0, 0, 0))
ImageDraw.Draw(sombra).ellipse([cx - r + 14, cy - r + 18, cx + r + 14, cy + r + 18], fill=(0, 0, 0, 90))
img.alpha_composite(sombra)
img.paste(bola, (0, 0), mb)
d = ImageDraw.Draw(img)
d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=PRETO, width=10)

# "98"
fonte = ImageFont.truetype("DejaVuSans-Bold.ttf", 270)
x, y = N * 0.40, N * 0.55
d.text((x, y), "98", font=fonte, fill=(255, 215, 0), stroke_width=18, stroke_fill=(20, 20, 20))

img.resize((192, 192), Image.LANCZOS).save(sys.argv[1] if len(sys.argv) > 1 else "icone.png", optimize=True)
