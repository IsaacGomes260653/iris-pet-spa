// Capturas do passeio real em vários pontos da rolagem.
// node scripts/capturar-passeio.mjs <pasta> [url]   (CHROMIUM_PATH opcional)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [pasta = "passeio", url = "http://localhost:3100/"] = process.argv.slice(2);
const pontos = [0, 0.05, 0.15, 0.27, 0.4, 0.52, 0.64, 0.76, 0.88, 0.97, 1.0];
const telas = { desktop: { width: 1440, height: 900, dpr: 1 }, celular: { width: 390, height: 844, dpr: 2 } };
const saida = `capturas/${pasta}`;
mkdirSync(saida, { recursive: true });

const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-gpu-rasterization"],
});
for (const [nome, t] of Object.entries(telas)) {
  const pagina = await navegador.newPage({ viewport: { width: t.width, height: t.height }, deviceScaleFactor: t.dpr });
  await pagina.goto(url, { waitUntil: "networkidle" });
  await pagina.screenshot({ path: `${saida}/${nome}-00-poster.png` }); // o que aparece antes do 3D
  await pagina.waitForFunction(() => document.querySelector("section[data-tema='amanhecer'] img")?.complete, null, { timeout: 60000 });
  await pagina.waitForTimeout(2500);
  for (const [i, p] of pontos.entries()) {
    await pagina.evaluate((p) => {
      const s = document.querySelector("section[data-tema='amanhecer']");
      const topo = s.getBoundingClientRect().top + scrollY;
      scrollTo({ top: p > 1 ? topo + s.offsetHeight : topo + p * (s.offsetHeight - innerHeight), behavior: "instant" });
    }, p);
    await pagina.waitForTimeout(4200); // a câmera alcança o ponto com amortecimento
    await pagina.screenshot({ path: `${saida}/${nome}-${String(i + 1).padStart(2, "0")}-p${p}.png` });
  }
  // depois do passeio: a próxima seção (creme)
  await pagina.evaluate(() => scrollBy({ top: innerHeight * 0.9, behavior: "instant" }));
  await pagina.waitForTimeout(2500);
  await pagina.screenshot({ path: `${saida}/${nome}-99-depois.png` });
  console.log(nome, "ok");
  await pagina.close();
}
await navegador.close();
