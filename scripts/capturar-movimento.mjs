// Sequências de quadros durante a rolagem real (roda do mouse), para avaliar movimento e transições.
// node scripts/capturar-movimento.mjs <pasta> [url]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [pasta = "movimento", url = "http://localhost:3100/"] = process.argv.slice(2);
const saida = `capturas/${pasta}`;
mkdirSync(saida, { recursive: true });
const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-gpu-rasterization"],
});
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
await pagina.goto(url, { waitUntil: "networkidle" });
await pagina.waitForFunction(() => document.querySelector("canvas")?.closest("div.opacity-100"), null, { timeout: 60000 });
const irPara = (p) =>
  pagina.evaluate((p) => {
    const s = document.querySelector("section[data-tema='amanhecer']");
    scrollTo({ top: s.getBoundingClientRect().top + scrollY + p * (s.offsetHeight - innerHeight), behavior: "instant" });
  }, p);
await pagina.mouse.move(720, 450);
for (const [nome, inicio] of [["caminhada", 0.33], ["chegada", 0.9]]) {
  await irPara(inicio);
  await pagina.waitForTimeout(4000);
  for (let i = 0; i < 12; i++) {
    await pagina.mouse.wheel(0, 260);
    await pagina.waitForTimeout(180);
    await pagina.screenshot({ path: `${saida}/${nome}-${String(i).padStart(2, "0")}.png` });
  }
}
console.log("ok");
await navegador.close();
