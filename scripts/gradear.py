"""Correção de cor "amanhecer" aplicada a todas as fotos, para o passeio parecer um só.

Uso: python scripts/gradear.py   (requer Pillow e numpy)
Lê media-src/*.jpg e grava em src/assets/{passeio,cards}/. Rode antes scripts/preparar-passeio.py. Os parâmetros abaixo são o
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
    "fundo-": ("passeio", 2560, 0.46, 0.64, 0.36, 0.03),
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

# ajustes por foto: menos verde na alameda e no gramado e menos contraste na loja (sol duro)
AJUSTES = {"fundo-2-alameda.jpg": {"verde": 0.5}, "fundo-4-gramado.jpg": {"verde": 0.6}, "fundo-5-loja-montada.jpg": {"contraste": 0.8}}

def ajustar(img, verde=1.0, contraste=1.0):
    if verde != 1.0:
        excesso = np.clip(img[..., 1] - np.maximum(img[..., 0], img[..., 2]), 0, 1)[..., None]
        img = img - excesso * (1 - verde) * np.array([-0.3, 1.0, -0.3])
    if contraste != 1.0:
        img = img.mean() + (img - img.mean()) * contraste
    return np.clip(img, 0, 1)

# a loja usa a montagem com o letreiro (scripts/preparar-passeio.py), não a foto crua
IGNORAR = {"fundo-5-loja.jpg", "fundo-5-loja-b.jpg"}
NOME_FINAL = {"fundo-5-loja-montada.jpg": "fundo-5-loja.jpg"}

for arquivo in sorted(ORIGEM.glob("*.jpg")):
    prefixo = next((p for p in GRUPOS if arquivo.name.startswith(p)), None)
    if not prefixo or arquivo.name in IGNORAR:
        continue
    pasta, lado, *params = GRUPOS[prefixo]
    im = Image.open(arquivo).convert("RGB")
    im.thumbnail((lado, lado), Image.LANCZOS)
    saida = gradear(ajustar(np.asarray(im, dtype=np.float32) / 255, **AJUSTES.get(arquivo.name, {})), *params)
    destino = RAIZ / "src" / "assets" / pasta / NOME_FINAL.get(arquivo.name, arquivo.name)
    Image.fromarray((saida * 255 + 0.5).astype(np.uint8)).save(destino, quality=84, optimize=True, progressive=True)
    print(f"{destino.relative_to(RAIZ)}  {im.width}x{im.height}  {destino.stat().st_size // 1024} KB")
