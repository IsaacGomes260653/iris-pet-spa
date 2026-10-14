// Capturas da seção das lojas (globo, filtro, lista e card).
// node scripts/capturar-lojas.mjs <pasta> [url]   (CHROMIUM_PATH opcional)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [pasta = "lojas", url = "http://localhost:3100/"] = process.argv.slice(2);
const saida = `capturas/${pasta}`;
mkdirSync(saida, { recursive: true });

const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-gpu-rasterization"],
});
const telas = { desktop: { viewport: { width: 1440, height: 900 } }, celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
for (const [nome, opcoes] of Object.entries(telas)) {
  const pagina = await navegador.newPage(opcoes);
  await pagina.goto(url, { waitUntil: "networkidle" });
  const foto = (n) => pagina.screenshot({ path: `${saida}/${nome}-${n}.png` });
  const topo = await pagina.evaluate(() => document.querySelector("#lojas").getBoundingClientRect().top + scrollY);
  // um pouco antes (a entrada sobre a tinta) e com a seção inteira na tela
  await pagina.evaluate((y) => scrollTo({ top: y - innerHeight * 0.3, behavior: "instant" }), topo);
  await pagina.waitForTimeout(5000);
  await foto("01-entrada");
  await pagina.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), topo);
  await pagina.waitForTimeout(5000);
  await foto("02-globo");
  await pagina.getByRole("button", { name: "Táxi Dog", exact: true }).click();
  await pagina.waitForTimeout(1500);
  await foto("03-filtro-taxi");
  await pagina.getByRole("button", { name: "Todas", exact: true }).click();
  await pagina.getByRole("button", { name: "Ver em lista" }).click();
  await pagina.waitForTimeout(800);
  await foto("04-lista");
  await pagina.getByLabel("Buscar por cidade").fill("recife");
  await pagina.waitForTimeout(500);
  await foto("05-busca");
  await pagina.getByRole("button", { name: /Íris Boa Viagem/ }).click();
  await pagina.waitForTimeout(2500);
  await foto("06-card");
  await pagina.close();
}
await navegador.close();
console.log("ok");
