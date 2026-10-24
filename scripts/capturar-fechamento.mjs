// Capturas do fechamento ("Hora do banho."): entrada, meio e passagem para o rodapé; desktop, celular e movimento reduzido.
// node scripts/capturar-fechamento.mjs <pasta> [url]   (CHROMIUM_PATH opcional)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [pasta = "fechamento", url = "http://localhost:3100/"] = process.argv.slice(2);
const saida = `capturas/${pasta}`;
mkdirSync(saida, { recursive: true });
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

for (const [nome, opcoes] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["celular", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }],
  ["reduzido", { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }],
]) {
  const ctx = await nav.newContext(opcoes);
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "networkidle" });
  // da metade da seção de cima até o rodapé, em passos (o GSAP acompanha a rolagem)
  const pontos = [-0.35, 0, 0.35, 0.7, 1.05];
  for (const [k, f] of pontos.entries()) {
    await p.evaluate((f) => {
      const s = document.querySelector("#agendar");
      const topo = s.getBoundingClientRect().top + scrollY;
      scrollTo(0, topo + f * s.offsetHeight - innerHeight * 0.1);
    }, f);
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${saida}/${nome}-0${k + 1}-${f}.png` });
  }
  await ctx.close();
}
await nav.close();
console.log("ok");
