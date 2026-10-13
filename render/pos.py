"""Pós-processo dos quadros renderizados: luz de amanhecer, vinheta e grão (Pillow + numpy).
Uso: python render/pos.py <entrada.png> <saida.jpg>"""
import sys
import numpy as np
from PIL import Image

ent, sai = sys.argv[1], sys.argv[2]
img = np.asarray(Image.open(ent).convert("RGB"), dtype=np.float32) / 255
h, w, _ = img.shape
lum = img @ np.array([0.2126, 0.7152, 0.0722])
t = np.clip(lum, 0, 1)[..., None]
tom = np.array([0.36, 0.38, 0.55]) * (1 - t) + np.array([1.0, 0.84, 0.74]) * t
suave = (1 - 2 * tom) * img * img + 2 * tom * img
img = img * 0.62 + suave * 0.38
yy, xx = np.mgrid[0:h, 0:w]
r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h * 0.55) / (h / 2)) ** 2)
img *= (1 - 0.28 * np.clip(r - 0.55, 0, 1) ** 1.5)[..., None]
rng = np.random.default_rng(7)
img += rng.normal(0, 0.012, img.shape[:2])[..., None]
Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(sai, quality=92)
print(sai)
