// Capturas da seção de banho e tosa em vários pontos da rolagem.
// node scripts/capturar-banho.mjs <pasta> [url]   (CHROMIUM_PATH opcional)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [pasta = "banho", url = "http://localhost:3100/"] = process.argv.slice(2);
const pontos = [-0.04, 0, 0.06, 0.13, 0.2, 0.3, 0.38, 0.47, 0.58, 0.66, 0.76, 0.86, 0.93, 1];
const saida = `capturas/${pasta}`;
mkdirSync(saida, { recursive: true });

const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-gpu-rasterization", "--autoplay-policy=no-user-gesture-required"],
});
const ir = (pagina, y) => pagina.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
const topo = (pagina) => pagina.evaluate(() => document.querySelector("#banho-e-tosa").getBoundingClientRect().top + scrollY);

// desktop: a seção fixada, do título à tinta verde-água
{
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
  await pagina.goto(url, { waitUntil: "networkidle" });
  const t = await topo(pagina);
  const altura = await pagina.evaluate(() => document.querySelector("#banho-e-tosa").offsetHeight - innerHeight);
  for (const [i, p] of pontos.entries()) {
    await ir(pagina, t + p * altura);
    await pagina.waitForTimeout(3200);
    await pagina.screenshot({ path: `${saida}/desktop-${String(i + 1).padStart(2, "0")}-p${p}.png` });
  }
  await pagina.close();
}

// celular: cards empilhados; abre os detalhes do segundo passo
{
  const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await pagina.goto(url, { waitUntil: "networkidle" });
  const t = await topo(pagina);
  const fim = await pagina.evaluate(() => document.querySelector("#banho-e-tosa").offsetHeight);
  let n = 1;
  for (let y = t; y < t + fim; y += 700) {
    await ir(pagina, y);
    await pagina.waitForTimeout(2200);
    await pagina.screenshot({ path: `${saida}/celular-${String(n++).padStart(2, "0")}.png` });
  }
  await pagina.locator("#banho-e-tosa button[aria-expanded]").nth(1).click();
  await pagina.locator("#detalhes-tosa").scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(2200);
  await pagina.screenshot({ path: `${saida}/celular-${String(n).padStart(2, "0")}-aberto.png` });
  await pagina.close();
}
await navegador.close();
console.log("ok");
