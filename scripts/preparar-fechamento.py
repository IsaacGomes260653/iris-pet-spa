"""Fundo do fechamento ("Hora do banho."): a mesma alameda do passeio, clara e enevoada, recortada para desktop e celular.

Uso: python scripts/preparar-fechamento.py   (requer Pillow e numpy; rode depois de render/parque.py)
Lê um quadro de media-src/passeio-render/fundo/ e grava src/assets/fechamento/{desktop,celular}.jpg.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "render"))
from montar import gradear, recortar  # noqa: E402  (a mesma cor do passeio)

QUADRO = RAIZ / "media-src" / "passeio-render" / "fundo" / "fundo-012.png"
DESTINO = RAIZ / "src" / "assets" / "fechamento"
NEVOA = np.array([0.98, 0.95, 0.92])  # creme do site: o quadro some numa névoa clara, sem brigar com o texto escuro
FORCA_NEVOA = 0.55

DESTINO.mkdir(parents=True, exist_ok=True)
quadro = Image.open(QUADRO).convert("RGB")
for tela, tamanho in (("desktop", (1920, 1080)), ("celular", (900, 1600))):
    im = recortar(quadro, tela).resize(tamanho, Image.LANCZOS).filter(ImageFilter.GaussianBlur(4))
    px = gradear(np.asarray(im, dtype=np.float32) / 255)
    px = px * (1 - FORCA_NEVOA) + NEVOA * FORCA_NEVOA
    Image.fromarray((px * 255 + 0.5).astype(np.uint8)).save(DESTINO / f"{tela}.jpg", quality=80)
    print(tela, tamanho)
