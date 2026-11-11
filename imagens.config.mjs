// Larguras e qualidades das imagens: o next.config.ts monta o srcset com elas e scripts/otimizar-imagens.mjs gera um
// WebP para cada combinação (os mesmos valores padrão do Next, mais as duas qualidades usadas no site).
export const LARGURAS_TELA = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
export const LARGURAS_IMAGEM = [32, 48, 64, 96, 128, 256, 384];
export const QUALIDADES = [60, 75];
