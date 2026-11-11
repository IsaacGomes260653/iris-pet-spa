import type { ImageLoaderProps } from "next/image";
import { QUALIDADES } from "../imagens.config.mjs";

/**
 * As fotos do site em WebP, geradas depois do build por scripts/otimizar-imagens.mjs ao lado da original:
 * foto.abc123.jpg → foto.abc123.w828q75.webp. A qualidade vai para a mais próxima das geradas (como o otimizador do
 * Next faria: o fechamento pede 70 e recebe 75). No dev (onde as versões não existem) e fora de /_next/static/media
 * (os arquivos de public/), fica a original.
 */
export default function carregarImagem({ src, width, quality = 75 }: ImageLoaderProps) {
  if (process.env.NODE_ENV === "development" || !/\/_next\/static\/media\/[^/]+\.(jpe?g|png)$/i.test(src)) return src;
  const q = QUALIDADES.reduce((perto, v) => (Math.abs(v - quality) < Math.abs(perto - quality) ? v : perto));
  return src.replace(/\.(jpe?g|png)$/i, `.w${width}q${q}.webp`);
}
