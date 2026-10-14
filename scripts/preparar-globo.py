"""Textura do globo das lojas a partir da Blue Marble da NASA (domínio público), com o mar no verde-água da marca.

Uso: python scripts/preparar-globo.py   (requer Pillow e numpy)
Lê media-src/globo/blue-marble-5400.jpg (world.topo.bathy.200412, Visible Earth) e grava public/globo/terra-{4096,2048}.webp.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "media-src" / "globo" / "blue-marble-5400.jpg"
DESTINO = RAIZ / "public" / "globo"

# mar: do fundo para o raso, dentro da paleta do tema 3
MAR_POS = np.array([0.0, 0.3, 0.6, 1.0])
MAR_COR = np.array([[0x18, 0x4E, 0x4B], [0x22, 0x6A, 0x63], [0x2E, 0x84, 0x78], [0x5F, 0xA5, 0x96]]) / 255


def preparar():
    im = Image.open(ORIGEM).convert("RGB")
    a = np.asarray(im, dtype=np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = a @ np.array([0.2126, 0.7152, 0.0722])
    # o mar da Blue Marble é azul e escuro; a máscara é suavizada para a costa não serrilhar
    # lagos escuros (o Titicaca vira um borrão preto) também ganham a cor do mar
    mar = (((b > r * 1.12) & (b > g * 0.98) & (lum < 0.5)) | (lum < 0.07)).astype(np.float32)
    mar = np.asarray(Image.fromarray((mar * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), dtype=np.float32)[..., None] / 255
    # batimetria mais suave: comprime o relevo do fundo do mar (a plataforma continental não vira contorno brilhante)
    profundo = np.clip(lum / 0.32, 0, 1) ** 0.75 * 0.85
    agua = np.stack([np.interp(profundo, MAR_POS, MAR_COR[:, c]) for c in range(3)], -1)
    # terra: um pouco menos saturada e mais quente, para combinar com o verde-água
    cinza = lum[..., None]
    terra = np.clip(cinza + 0.78 * (a - cinza), 0, 1) ** 0.72 * np.array([1.04, 1.0, 0.9])  # florestas menos pretas, tom cáqui
    saida = np.maximum(terra * (1 - mar) + agua * mar, 0.08)  # nada abaixo de ~20/255
    img = Image.fromarray((np.clip(saida, 0, 1) * 255).astype(np.uint8))
    DESTINO.mkdir(parents=True, exist_ok=True)
    for largura in (4096, 2048):
        v = img.resize((largura, largura // 2), Image.LANCZOS)
        caminho = DESTINO / f"terra-{largura}.webp"
        v.save(caminho, quality=82, method=6)
        print(caminho.relative_to(RAIZ), caminho.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    preparar()
