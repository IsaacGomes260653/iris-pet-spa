"""Pares de antes e depois (o mesmo cão, fotos reais) recortados em 4:5, alinhados e com a cor do site.

Uso: python scripts/preparar-antes-depois.py   (requer Pillow e numpy)
Lê media-src/antes-depois/ (originais do Flickr, CC BY 2.0; ver CREDITS.md) e grava src/assets/antes-depois/.
Os recortes deixam a cabeça na mesma posição no antes e no depois, para o slider comparar o mesmo enquadramento.
"""
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "media-src" / "antes-depois"
DESTINO = RAIZ / "src" / "assets" / "antes-depois"
SAIDA = (720, 900)

# a mesma correção de cor das fotos das seções (scripts/gradear.py, grupo "foto-")
MAPA_POS = np.array([0.0, 0.32, 0.58, 0.80, 1.0])
MAPA_COR = np.array([[0x26, 0x30, 0x42], [0x66, 0x6E, 0x91], [0xC0, 0xA4, 0xB0], [0xF2, 0xC2, 0xA0], [0xFF, 0xF1, 0xE4]]) / 255


def gradear(img, gama, sat=0.8, forca=0.18, piso=0.04):
    img = img ** gama
    lum = (img @ np.array([0.2126, 0.7152, 0.0722]))[..., None]
    img = lum + sat * (img - lum)
    l = img @ np.array([0.2126, 0.7152, 0.0722])
    mapa = np.stack([np.interp(l, MAPA_POS, MAPA_COR[:, c]) for c in range(3)], -1)
    img = img * (1 - forca) + mapa * forca
    return np.clip(piso + (1 - piso - 0.03) * img, 0, 1)


def metade(arq, lado):
    """As fotos do poodle e do shih-tzu vêm lado a lado num quadro só: antes à esquerda, depois à direita."""
    im = Image.open(ORIGEM / arq)
    w, h = im.size
    return im.crop((0, 0, w // 2, h) if lado == "antes" else (w // 2, 0, w, h))


# (fonte, recorte 4:5 em pixels da fonte) para cada lado
PARES = {
    "essencial": {"antes": (lambda: Image.open(ORIGEM / "aggie-antes.jpg"), (410, 0, 1024, 768)), "depois": (lambda: Image.open(ORIGEM / "aggie-depois.jpg"), (165, 0, 779, 768))},
    "banho-tosa": {"antes": (lambda: metade("poodle-par.jpg", "antes"), (20, 170, 500, 770)), "depois": (lambda: metade("poodle-par.jpg", "depois"), (20, 140, 490, 728))},  # sem a borda branca do meio da montagem
    "spa": {"antes": (lambda: metade("shih-par.jpg", "antes"), (0, 164, 506, 796)), "depois": (lambda: metade("shih-par.jpg", "depois"), (6, 87, 433, 621))},
}

DESTINO.mkdir(parents=True, exist_ok=True)
for pacote, lados in PARES.items():
    imgs = {lado: np.asarray(abrir().convert("RGB").crop(caixa).resize(SAIDA, Image.LANCZOS), dtype=np.float32) / 255 for lado, (abrir, caixa) in lados.items()}
    # a mesma exposição para o antes e o depois: a diferença entre eles é do serviço, não da correção
    media = np.mean([(px @ np.array([0.2126, 0.7152, 0.0722])).mean() for px in imgs.values()])
    gama = np.log(0.46) / np.log(max(media, 1e-3))
    for lado, px in imgs.items():
        Image.fromarray((gradear(px, gama) * 255 + 0.5).astype(np.uint8)).save(DESTINO / f"{pacote}-{lado}.jpg", quality=88)
        print(pacote, lado, round(float(gama), 2))
