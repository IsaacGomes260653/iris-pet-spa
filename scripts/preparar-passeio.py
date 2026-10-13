"""Prepara as camadas do passeio a partir dos originais em media-src/ (requer Pillow e numpy).

- cachorra.png: a cachorra recortada (fundo transparente), limpa e com a mesma luz de amanhecer.
- fundo-5-loja.jpg: montagem da fachada real com o letreiro Íris e a porta verde-sálvia.

Os fundos (fundo-1 a fundo-4) passam só pela correção de cor de scripts/gradear.py.
Uso: python scripts/preparar-passeio.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "media-src"
DESTINO = RAIZ / "src" / "assets" / "passeio"
SALVIA, SALVIA_ESCURO = (143, 163, 139), (95, 117, 92)


def maior_regiao(alfa: Image.Image, semente: tuple[int, int]) -> Image.Image:
    """Mantém só a região conectada à semente (tira galhos e pontos soltos do recorte)."""
    marca = alfa.point(lambda v: 255 if v > 90 else 0)
    ImageDraw.floodfill(marca, semente, 128)
    regiao = marca.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(5))
    return Image.fromarray(np.minimum(np.asarray(alfa), np.asarray(regiao)).astype(np.uint8))


def cachorra():
    im = Image.open(ORIGEM / "recorte" / "cachorra-isnet.png").convert("RGBA")
    r, g, b, a = im.split()
    caixa = a.getbbox()
    centro = ((caixa[0] + caixa[2]) // 2, (caixa[1] + caixa[3]) // 2)
    a = maior_regiao(a, centro)
    im = Image.merge("RGBA", (r, g, b, a)).crop(a.getbbox())
    # luz de amanhecer: pretos levemente azulados, brilhos do pelo em pêssego (o sol vem de frente)
    rgb = np.asarray(im.convert("RGB"), dtype=np.float32) / 255
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722])
    t = np.clip(lum / 0.6, 0, 1)[..., None]
    tom = np.array([0.20, 0.21, 0.30]) * (1 - t) + np.array([1.0, 0.86, 0.76]) * t
    rgb = np.clip(rgb * 0.82 + tom * rgb * 0.3, 0, 1)
    saida = Image.fromarray((rgb * 255).astype(np.uint8)).convert("RGBA")
    saida.putalpha(im.getchannel("A"))
    saida.thumbnail((900, 2000), Image.LANCZOS)
    saida.save(DESTINO / "cachorra.png", optimize=True)
    print("cachorra.png", saida.size)


def tingir(img: np.ndarray, caixa, cor, forca=0.85):
    """Pinta uma área clara (porta, painel) mantendo a luz e as sombras da foto."""
    x0, y0, x1, y1 = caixa
    area = img[y0:y1, x0:x1]
    lum = area @ np.array([0.2126, 0.7152, 0.0722])
    tinta = (np.array(cor) / 255) * (0.35 + 0.75 * lum[..., None])
    img[y0:y1, x0:x1] = area * (1 - forca) + tinta * forca


def loja():
    foto = Image.open(ORIGEM / "fundo-5-loja.jpg").convert("RGB")
    W, H = foto.size  # 3000 x 2000
    img = np.asarray(foto, dtype=np.float32) / 255
    # porta e painel sob a vitrine em verde-sálvia (coordenadas da foto original 3000x2000)
    tingir(img, (296, 830, 866, 1812), SALVIA)
    tingir(img, (1050, 1560, 2850, 1830), SALVIA, 0.75)
    tingir(img, (176, 330, 2890, 380), SALVIA_ESCURO, 0.7)  # beiral
    foto = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))

    # letreiro em letras de volume na faixa de parede acima do beiral
    serifa = ImageFont.truetype(str(ORIGEM / "fontes" / "Literata.ttf"), 205)
    serifa.set_variation_by_axes([72, 300])  # opsz, wght
    mono = ImageFont.truetype(str(ORIGEM / "fontes" / "MartianMono.ttf"), 46)
    mono.set_variation_by_axes([87.5, 450])  # wdth, wght
    camada = Image.new("RGBA", foto.size, (0, 0, 0, 0))
    sombra = Image.new("RGBA", foto.size, (0, 0, 0, 0))
    cx = (220 + 2920) // 2 - 60  # centro da fachada depois do recorte das bordas
    for alvo, deslocamento, cor in ((sombra, (14, 18), (60, 50, 40, 120)), (camada, (0, 0), SALVIA_ESCURO + (255,))):
        d = ImageDraw.Draw(alvo)
        d.text((cx + deslocamento[0], 262 + deslocamento[1]), "Íris", font=serifa, fill=cor, anchor="ms")
        d.text((cx + 250 + deslocamento[0], 262 + deslocamento[1]), "PET SPA", font=mono, fill=cor, anchor="ls")
    foto = Image.alpha_composite(foto.convert("RGBA"), sombra.filter(ImageFilter.GaussianBlur(9)))
    foto = Image.alpha_composite(foto, camada).convert("RGB")
    # tira os números da casa nas bordas
    foto = foto.crop((220, 0, 2920, H))
    foto.save(ORIGEM / "fundo-5-loja-montada.jpg", quality=92)
    print("fundo-5-loja-montada.jpg", foto.size)


if __name__ == "__main__":
    DESTINO.mkdir(parents=True, exist_ok=True)
    cachorra()
    loja()
