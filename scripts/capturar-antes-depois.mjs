// Capturas do antes e depois: posições do slider (teclado, arrasto e toque) e troca de pacote.
// node scripts/capturar-antes-depois.mjs <pasta> [url]   (CHROMIUM_PATH opcional)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [pasta = "antes-depois", url = "http://localhost:3100/"] = process.argv.slice(2);
const saida = `capturas/${pasta}`;
mkdirSync(saida, { recursive: true });
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const estado = (p) =>
  p.evaluate(() => {
    const r = document.querySelector("#antes-e-depois input[type=range]");
    const feitos = [...document.querySelectorAll("#antes-e-depois ol li")].filter((li) => li.textContent.includes("(feito)")).length;
    return `valor ${r.value} · ${r.getAttribute("aria-valuetext")} · feitos ${feitos}`;
  });

for (const [nome, opcoes] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["celular", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }],
]) {
  const ctx = await nav.newContext(opcoes);
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "networkidle" });
  await p.evaluate(() => document.querySelector("#antes-e-depois figure").scrollIntoView({ block: "center", behavior: "instant" }));
  await p.waitForTimeout(1000);
  await p.screenshot({ path: `${saida}/${nome}-01-meio.png` });
  console.log(nome, "início", await estado(p));
  // teclado: foco no slider, Home = tudo depois, End = tudo antes, setas andam de 1 em 1
  await p.focus("#antes-e-depois input[type=range]");
  await p.keyboard.press("Home");
  await p.waitForTimeout(300);
  console.log(nome, "Home", await estado(p));
  await p.screenshot({ path: `${saida}/${nome}-02-depois.png` });
  await p.keyboard.press("End");
  for (let k = 0; k < 10; k++) await p.keyboard.press("ArrowLeft");
  await p.waitForTimeout(300);
  console.log(nome, "End + 10 ←", await estado(p));
  await p.screenshot({ path: `${saida}/${nome}-03-antes.png` });
  // arrasto (mouse) ou toque: até 25% da largura
  const caixa = await p.locator("#antes-e-depois figure > div:first-child").boundingBox();
  const y = caixa.y + caixa.height / 2;
  if (nome === "desktop") {
    await p.mouse.move(caixa.x + caixa.width * 0.7, y);
    await p.mouse.down();
    await p.mouse.move(caixa.x + caixa.width * 0.25, y, { steps: 10 });
    await p.mouse.up();
  } else {
    await p.touchscreen.tap(caixa.x + caixa.width * 0.25, y);
  }
  await p.waitForTimeout(300);
  console.log(nome, "arrasto/toque 25%", await estado(p));
  await p.screenshot({ path: `${saida}/${nome}-04-arrasto.png` });
  // outro pacote: volta ao meio e troca a lista
  await p.locator("#antes-e-depois [aria-pressed]").nth(2).click();
  await p.waitForTimeout(500);
  console.log(nome, "Spa", await estado(p));
  await p.screenshot({ path: `${saida}/${nome}-05-spa.png` });
  await p.locator("#antes-e-depois [aria-pressed]").nth(0).click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${saida}/${nome}-06-essencial.png` });
  if (nome === "celular") {
    await p.evaluate(() => document.querySelector("#antes-e-depois").scrollIntoView({ block: "start", behavior: "instant" }));
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${saida}/${nome}-07-topo.png` });
  }
  await ctx.close();
}
await nav.close();
console.log("ok");
