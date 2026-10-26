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

QUADRO = RAIZ / "media-src" / "passeio-render" / "fundo" / "fundo-000.png"  # o começo da alameda: copas e luz, sem a cachorra
DESTINO = RAIZ / "src" / "assets" / "fechamento"
NEVOA = np.array([0.98, 0.95, 0.92])  # creme do site: o quadro some numa névoa clara, sem brigar com o texto escuro
FORCA_NEVOA = 0.3  # clareia sem apagar: o quadro guarda uns 70% do contraste
# os postes do caminho (x0, x1, y0, y1 no quadro de 1280): somem preenchidos com as colunas vizinhas
POSTES = [(760, 797, 320, 628), (566, 589, 428, 572), (602, 617, 470, 552), (671, 690, 458, 552)]

DESTINO.mkdir(parents=True, exist_ok=True)
px = np.asarray(Image.open(QUADRO).convert("RGB"), dtype=np.float32).copy()
for x0, x1, y0, y1 in POSTES:
    t = np.linspace(0, 1, x1 - x0)[None, :, None]
    px[y0:y1, x0:x1] = px[y0:y1, x0 - 1 : x0] * (1 - t) + px[y0:y1, x1 : x1 + 1] * t
quadro = Image.fromarray(px.clip(0, 255).astype(np.uint8))
for tela, tamanho in (("desktop", (1920, 1080)), ("celular", (900, 1600))):
    # no desktop, a faixa sobe para mostrar mais copa (o recorte do passeio é centrado)
    faixa = quadro.crop((0, 140, 1280, 860)) if tela == "desktop" else recortar(quadro, tela)
    im = faixa.resize(tamanho, Image.LANCZOS).filter(ImageFilter.GaussianBlur(3))
    px = gradear(np.asarray(im, dtype=np.float32) / 255)
    px = px * (1 - FORCA_NEVOA) + NEVOA * FORCA_NEVOA
    Image.fromarray((px * 255 + 0.5).astype(np.uint8)).save(DESTINO / f"{tela}.jpg", quality=80)
    print(tela, tamanho)
