"""Correção de cor "amanhecer" aplicada a todas as fotos, para o passeio parecer um só.

Uso: python scripts/gradear.py   (requer Pillow e numpy)
Lê media-src/*.jpg e grava em src/assets/{passeio,cards}/. Os parâmetros abaixo são o
botão de calibração: mexa neles e rode de novo.
"""
from pathlib import Path
import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "media-src"

# mapa de gradiente por luminância: azul-acinzentado → lavanda → malva → pêssego → creme
MAPA_POS = np.array([0.0, 0.32, 0.58, 0.80, 1.0])
MAPA_COR = np.array([[0x26, 0x30, 0x42], [0x66, 0x6E, 0x91], [0xC0, 0xA4, 0xB0], [0xF2, 0xC2, 0xA0], [0xFF, 0xF1, 0xE4]]) / 255
GRUPOS = {
    # prefixo: (pasta, lado maior, luminância média alvo, saturação, força do tom, piso dos pretos)
    "passeio-": ("passeio", 2560, 0.47, 0.86, 0.24, 0.02),
    "alt-": ("passeio", 2560, 0.50, 0.64, 0.40, 0.04),
    "card-": ("cards", 1400, 0.52, 0.92, 0.12, 0.015),  # leve: preserva o contraste da foto
}

def luminancia(img):
    return img @ np.array([0.2126, 0.7152, 0.0722])

def gradear(img, alvo, sat, forca, piso):
    lum = luminancia(img)
    # exposição: gama que leva a média de luminância ao alvo (fotos de câmeras diferentes ficam no mesmo brilho)
    img = img ** (np.log(alvo) / np.log(max(lum.mean(), 1e-3)))
    lum = luminancia(img)[..., None]
    img = lum + sat * (img - lum)                       # menos saturação unifica céus e matas
    l = luminancia(img)
    mapa = np.stack([np.interp(l, MAPA_POS, MAPA_COR[:, c]) for c in range(3)], -1)
    img = img * (1 - forca) + mapa * forca              # sombras frias, luzes pêssego
    return np.clip(piso + (1 - piso - 0.03) * img, 0, 1)  # pretos levantados = névoa de manhã

for arquivo in sorted(ORIGEM.glob("*.jpg")):
    prefixo = next((p for p in GRUPOS if arquivo.name.startswith(p)), None)
    if not prefixo:
        continue
    pasta, lado, *params = GRUPOS[prefixo]
    im = Image.open(arquivo).convert("RGB")
    im.thumbnail((lado, lado), Image.LANCZOS)
    saida = gradear(np.asarray(im, dtype=np.float32) / 255, *params)
    destino = RAIZ / "src" / "assets" / pasta / arquivo.name
    Image.fromarray((saida * 255 + 0.5).astype(np.uint8)).save(destino, quality=84, optimize=True, progressive=True)
    print(f"{destino.relative_to(RAIZ)}  {im.width}x{im.height}  {destino.stat().st_size // 1024} KB")
