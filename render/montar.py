"""Monta os quadros renderizados do passeio para o site: gradação de amanhecer, recortes e WebP.

Uso: python render/montar.py   (requer Pillow e numpy; rode depois de render/parque.py)
Lê media-src/passeio-render/{fundo,cao-desktop,cao-celular} e grava public/passeio/{desktop,celular} + manifesto.json.
O quadro renderizado é quadrado: o desktop usa a faixa 16:9 do meio e o celular a faixa 9:16 do meio.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "media-src" / "passeio-render"
DESTINO = RAIZ / "public" / "passeio"
FAIXA = (1 - 9 / 16) / 2  # margem cortada de cada lado do quadrado (0,21875)

# mapa de gradiente da marca: azul-acinzentado → lavanda → malva → pêssego → creme (o mesmo de scripts/gradear.py)
MAPA_POS = np.array([0.0, 0.32, 0.58, 0.80, 1.0])
MAPA_COR = np.array([[0x26, 0x30, 0x42], [0x66, 0x6E, 0x91], [0xC0, 0xA4, 0xB0], [0xF2, 0xC2, 0xA0], [0xFF, 0xF1, 0xE4]]) / 255
FORCA, SATURACAO, PISO = 0.24, 0.86, 0.025  # botão de calibração da cor


def gradear(rgb):
    """Leve: não normaliza a exposição (o preto da cachorra continua preto), só puxa a cor para a manhã da marca."""
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722])
    rgb = lum[..., None] + SATURACAO * (rgb - lum[..., None])
    mapa = np.stack([np.interp(lum, MAPA_POS, MAPA_COR[:, c]) for c in range(3)], -1)
    rgb = rgb * (1 - FORCA) + mapa * FORCA
    return np.clip(PISO + (1 - PISO) * rgb, 0, 1)


def recortar(im, tela):
    lado = im.width
    a, b = round(lado * FAIXA), round(lado * (1 - FAIXA))
    return im.crop((0, a, lado, b)) if tela == "desktop" else im.crop((a, 0, b, lado))


def carregar(arq, alfa=False):
    im = Image.open(arq).convert("RGBA")
    px = np.asarray(im, dtype=np.float32) / 255
    rgb = gradear(px[..., :3])
    return Image.fromarray((np.dstack([rgb, px[..., 3:]]) * 255 + 0.5).astype(np.uint8), "RGBA" if alfa else None).convert("RGBA" if alfa else "RGB")


def main():
    manifesto = {"telas": {}}
    fundos = sorted((ORIGEM / "fundo").glob("fundo-*.png"))
    for tela in ("desktop", "celular"):
        pasta = DESTINO / tela
        pasta.mkdir(parents=True, exist_ok=True)
        for k, arq in enumerate(fundos):
            recortar(carregar(arq), tela).save(pasta / f"fundo-{k:03d}.webp", quality=74, method=6)
        # a cachorra: todos os quadros de uma tela num só recorte (a menor caixa que contém todos)
        cao = ORIGEM / f"cao-{tela}"
        quadros = {t: sorted(cao.glob(f"{t}-*.png")) for t in ("andar", "parada", "entrada")}
        imgs = {t: [recortar(carregar(a, alfa=True), tela) for a in lista] for t, lista in quadros.items()}
        caixa = None
        for lista in imgs.values():
            for im in lista:
                b = im.getchannel("A").point(lambda v: 255 if v > 3 else 0).getbbox()
                if b:
                    caixa = b if caixa is None else (min(caixa[0], b[0]), min(caixa[1], b[1]), max(caixa[2], b[2]), max(caixa[3], b[3]))
        for t, lista in imgs.items():
            for k, im in enumerate(lista):
                im.crop(caixa).save(pasta / f"cao-{t}-{k:02d}.webp", quality=82, method=6)
        # imagens paradas (pôster e movimento reduzido): o fundo de cada frase com a cachorra em pé; a chegada com ela na porta
        q_frases = [0, 32, 63, 95]
        for k, q in enumerate(q_frases):
            base = recortar(carregar(fundos[q]), tela).convert("RGBA")
            base.alpha_composite(imgs["parada"][0])
            base.convert("RGB").save(pasta / f"chave-{k}.webp", quality=80, method=6)
        base = recortar(carregar(fundos[-1]), tela).convert("RGBA")
        base.alpha_composite(imgs["entrada"][-1])
        base.convert("RGB").save(pasta / "chave-chegada.webp", quality=80, method=6)
        info = json.loads((cao / f"camada-{tela}.json").read_text())
        mao_u, mao_v = info["mao"]
        largura, altura = recortar(Image.new("RGB", (100, 100)), tela).size
        # a mão em coordenadas do quadro da tela (0..1)
        mao = [mao_u, (mao_v - FAIXA) / (1 - 2 * FAIXA)] if tela == "desktop" else [(mao_u - FAIXA) / (1 - 2 * FAIXA), mao_v]
        w, h = imgs["andar"][0].size
        manifesto["telas"][tela] = {
            "largura": w, "altura": h, "cao": [caixa[0] / w, caixa[1] / h, (caixa[2] - caixa[0]) / w, (caixa[3] - caixa[1]) / h],
            "mao": [round(mao[0], 4), round(mao[1], 4)],
        }
        manifesto.update({
            "fundo": len(fundos), "andar": len(imgs["andar"]), "parada": len(imgs["parada"]), "entrada": len(imgs["entrada"]),
            "passo_m": info["passo_m"], "q_entrada": info["q_entrada"], "camera_y": info["camera_y"],
        })
        print(tela, "ok", caixa)
    (DESTINO / "manifesto.json").write_text(json.dumps(manifesto, separators=(",", ":")))


if __name__ == "__main__":
    main()
