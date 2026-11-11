import type { NextConfig } from "next";
import { LARGURAS_IMAGEM, LARGURAS_TELA, QUALIDADES } from "./imagens.config.mjs";

// Site estático (pasta out/) para o GitHub Pages, onde ele fica em /iris-pet-spa: o workflow passa esse caminho em
// PAGES_BASE_PATH. Sem a variável (no computador), o site fica na raiz.
const base = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: base,
  env: { NEXT_PUBLIC_BASE_PATH: base },
  devIndicators: false,
  images: {
    // sem servidor não há o otimizador do Next: as versões em WebP são geradas depois do build
    // (scripts/otimizar-imagens.mjs) e o loader aponta para elas
    loader: "custom",
    loaderFile: "./src/carregar-imagem.ts",
    deviceSizes: LARGURAS_TELA,
    imageSizes: LARGURAS_IMAGEM,
    qualities: QUALIDADES,
  },
};

export default nextConfig;
