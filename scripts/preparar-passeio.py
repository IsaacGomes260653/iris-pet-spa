"""Prepara as camadas do passeio a partir dos originais em media-src/ (requer Pillow e numpy).

- cachorra.png: a cachorra recortada (fundo transparente), limpa e com a mesma luz de amanhecer.
- mao.png: a mão segurando a alça da guia, na base da tela.
- fundo-5-loja.jpg: montagem da fachada real, sem pessoas, com o nome Íris no toldo verde-sálvia.

Os fundos (fundo-1 a fundo-4) passam só pela correção de cor de scripts/gradear.py.
Uso: python scripts/preparar-passeio.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "media-src"
DESTINO = RAIZ / "src" / "assets" / "passeio"


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
    # pelo fosco: o brilho especular da foto original não combina com a luz difusa dos fundos
    lum = (rgb @ np.array([0.2126, 0.7152, 0.0722]))[..., None]
    joelho = 0.3
    alvo = np.where(lum > joelho, joelho + (lum - joelho) * 0.5, lum)
    rgb = np.clip(rgb * alvo / np.maximum(lum, 1e-4), 0, 1)
    rgb = rgb ** 1.25 * 0.88  # médios do pelo mais fundos: lê como pastora preta, não cinza
    saida = Image.fromarray((rgb * 255).astype(np.uint8)).convert("RGBA")
    saida.putalpha(im.getchannel("A"))
    saida.thumbnail((900, 2000), Image.LANCZOS)
    saida.save(DESTINO / "cachorra.png", optimize=True)
    print("cachorra.png", saida.size)


def mao():
    """A mão segurando a alça da guia (foto de POV), girada para a alça subir reta até a guia da cachorra."""
    im = Image.open(ORIGEM / "mao-1.jpg").convert("RGB").crop((80, 520, 1180, 1333))
    a = np.asarray(im, dtype=np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    pele = (r > g * 1.08) & (r > b * 1.05)  # a pele contra a grama verde
    alca = np.asarray(Image.open(ORIGEM / "recorte" / "mao-isnet.png").getchannel("A")) > 128  # a alça preta (rembg)
    m = Image.fromarray(((pele | alca) * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(7))
    ImageDraw.floodfill(m, (300, 780), 128)
    m = np.asarray(m.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(3)), dtype=np.float32)
    # some o que passa da alça para cima (patas do cão da foto) e a alça se dissolve na guia
    m *= np.clip((np.arange(m.shape[0])[:, None] - 330) / 110, 0, 1)
    alfa = Image.fromarray(m.astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    rgb = a * 0.8 + a * (np.array([0.72, 0.7, 0.86]) - 0.5) * 0.35  # mesma manhã fria dos fundos
    rgb = np.clip(rgb * 0.82, 0, 1)
    saida = Image.fromarray((rgb * 255).astype(np.uint8)).convert("RGBA")
    saida.putalpha(alfa)
    saida = saida.rotate(17, resample=Image.BICUBIC, expand=True)
    saida = saida.crop(saida.getchannel("A").getbbox())
    saida.thumbnail((900, 900), Image.LANCZOS)
    saida.save(DESTINO / "mao.png", optimize=True)
    print("mao.png", saida.size)


def colar(img: np.ndarray, origem, destino, espelhar=False, borda=4):
    """Cola um retalho da própria foto sobre outro ponto, com a borda esfumada (tira pessoas e textos)."""
    x0, y0, x1, y1 = origem
    retalho = img[y0:y1, x0:x1]
    if espelhar:
        retalho = retalho[:, ::-1]
    dx, dy = destino
    mascara = np.zeros(img.shape[:2], np.uint8)
    mascara[dy:dy + retalho.shape[0], dx:dx + retalho.shape[1]] = 255
    m = np.asarray(Image.fromarray(mascara).filter(ImageFilter.GaussianBlur(borda)), dtype=np.float32)[..., None] / 255
    copia = img.copy()
    copia[dy:dy + retalho.shape[0], dx:dx + retalho.shape[1]] = retalho
    return img * (1 - m) + copia * m


def loja():
    """Fachada vista da rua (foto de Robert Bye), com o toldo verde-sálvia levando o nome Íris Pet Spa."""
    foto = Image.open(ORIGEM / "fundo-5-loja-b.jpg").convert("RGB")
    img = np.asarray(foto, dtype=np.float32) / 255  # 3200 x 2133
    img = colar(img, (624, 536, 1424, 1395), (1824, 536), espelhar=True)  # vitrine da direita sem a pessoa no banco
    img = colar(img, (900, 1380, 1776, 1428), (1824, 1380), borda=6)  # calçada sem a sombra dela
    img = colar(img, (400, 395, 1064, 500), (1288, 395), borda=6)  # toldo liso no lugar do nome antigo
    # sol de meio-dia vira manhã difusa: sombras duras abertas pela média local
    lum = img @ np.array([0.2126, 0.7152, 0.0722])
    media = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(60)), dtype=np.float32) / 255
    img = np.clip(img * ((media + 0.25) / (lum + 0.25))[..., None] ** 0.4, 0, 1)
    foto = Image.fromarray((img * 255).astype(np.uint8))

    # nome no toldo em verde-escuro, pintado como as letras do original (branco some na névoa)
    serifa = ImageFont.truetype(str(ORIGEM / "fontes" / "Literata.ttf"), 150)
    serifa.set_variation_by_axes([72, 500])  # opsz, wght
    mono = ImageFont.truetype(str(ORIGEM / "fontes" / "MartianMono.ttf"), 50)
    mono.set_variation_by_axes([87.5, 600])  # wdth, wght
    d = ImageDraw.Draw(foto)
    base, cx = 488, 1600
    largura = d.textlength("Íris", font=serifa) + 44 + d.textlength("PET SPA", font=mono)
    x = cx - largura / 2
    d.text((x, base), "Íris", font=serifa, fill=(34, 52, 48), anchor="ls")
    d.text((x + d.textlength("Íris", font=serifa) + 44, base), "PET SPA", font=mono, fill=(34, 52, 48), anchor="ls")
    foto.save(ORIGEM / "fundo-5-loja-montada.jpg", quality=92)
    print("fundo-5-loja-montada.jpg", foto.size)


if __name__ == "__main__":
    DESTINO.mkdir(parents=True, exist_ok=True)
    cachorra()
    mao()
    loja()
