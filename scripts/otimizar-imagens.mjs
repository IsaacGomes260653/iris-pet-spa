// Faz o que o otimizador de imagens do Next faria no servidor, para o site estático: para cada foto de
// out/_next/static/media, um WebP por largura e qualidade de imagens.config.mjs, com o nome que src/carregar-imagem.ts
// pede (foto.abc123.w828q75.webp). Roda sozinho depois do build (postbuild).
import { copyFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { LARGURAS_IMAGEM, LARGURAS_TELA, QUALIDADES } from "../imagens.config.mjs";

const PASTA = path.join(import.meta.dirname, "..", "out", "_next", "static", "media");
const LARGURAS = [...new Set([...LARGURAS_IMAGEM, ...LARGURAS_TELA])].sort((a, b) => a - b);
const POR_VEZ = 4; // fotos ao mesmo tempo (as grandes ocupam bastante memória decodificadas)

const fotos = (await readdir(PASTA)).filter((n) => /\.(jpe?g|png)$/i.test(n) && !/\.w\d+q\d+\./.test(n));
let gerados = 0;
let bytes = 0;

async function versoes(nome) {
  const origem = path.join(PASTA, nome);
  const { width: original } = await sharp(origem).metadata();
  for (const q of QUALIDADES) {
    // acima da largura original não há o que ganhar: as larguras maiores repetem a versão do tamanho original
    const feitas = new Map();
    for (const w of LARGURAS) {
      const efetiva = Math.min(w, original);
      const destino = path.join(PASTA, nome.replace(/\.(jpe?g|png)$/i, `.w${w}q${q}.webp`));
      if (feitas.has(efetiva)) {
        await copyFile(feitas.get(efetiva), destino);
        continue;
      }
      const info = await sharp(origem).resize({ width: efetiva }).webp({ quality: q }).toFile(destino);
      feitas.set(efetiva, destino);
      gerados++;
      bytes += info.size;
    }
  }
}

for (let i = 0; i < fotos.length; i += POR_VEZ) await Promise.all(fotos.slice(i, i + POR_VEZ).map(versoes));
console.log(`imagens: ${fotos.length} fotos, ${gerados} versões em WebP (${(bytes / 2 ** 20).toFixed(1)} MB)`);
