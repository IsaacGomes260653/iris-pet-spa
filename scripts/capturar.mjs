// Capturas de tela por fase: node scripts/capturar.mjs <pasta> [url-base] [rotas...]
// Ex.: node scripts/capturar.mjs fase-1 http://localhost:3100 / /estilo
// CHROMIUM_PATH aponta para um Chromium já instalado, se o do Playwright não estiver.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [pasta = "atual", base = "http://localhost:3100", ...rotas] = process.argv.slice(2);
const telas = { desktop: { width: 1440, height: 900 }, celular: { width: 390, height: 844 } };
const saida = `capturas/${pasta}`;
mkdirSync(saida, { recursive: true });

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const [nomeTela, viewport] of Object.entries(telas)) {
  const pagina = await navegador.newPage({ viewport, deviceScaleFactor: nomeTela === "celular" ? 2 : 1 });
  for (const rota of rotas.length ? rotas : ["/"]) {
    await pagina.goto(base + rota, { waitUntil: "networkidle" });
    await pagina.evaluate(() => document.fonts.ready);
    const altura = await pagina.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const nome = rota === "/" ? "inicio" : rota.replaceAll("/", "");
    const pontos = altura > 0 ? [0, 0.25, 0.5, 0.75, 1] : [0];
    for (const [i, p] of pontos.entries()) {
      await pagina.evaluate((y) => scrollTo(0, y), Math.round(altura * p));
      await pagina.waitForLoadState("networkidle");
      await pagina.waitForTimeout(1700); // crossfade do fundo (1,4 s) + imagens
      await pagina.screenshot({ path: `${saida}/${nome}-${nomeTela}-${i + 1}.png` });
    }
    console.log(`${nome} ${nomeTela}: ${pontos.length} capturas`);
  }
  await pagina.close();
}
await navegador.close();
