// Prova dos cards do passeio: quadros em sequência rolando devagar, rápido e para trás (desktop e celular), e o estado
// de cada card em cada ponto. Como os cards são função só da rolagem, a volta tem de dar exatamente o mesmo que a ida.
// node scripts/capturar-cards.mjs <pasta> [url]   (CHROMIUM_PATH opcional)
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const [pasta = "cards", url = "http://localhost:3100/"] = process.argv.slice(2);
const saida = `capturas/${pasta}`;
mkdirSync(saida, { recursive: true });
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ATE = 0.42; // os dois primeiros cenários e o começo do terceiro

for (const [nome, opcoes, passo, cada] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }, 0.004, 7],
  ["celular", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }, 0.006, 5],
]) {
  const ctx = await nav.newContext(opcoes);
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "networkidle" });
  // a primeira rolagem libera as fotos dos cards; espera elas chegarem
  await p.evaluate(() => scrollTo(0, 2));
  await p.waitForTimeout(2500);
  // vai a uma fração p da rolagem do passeio e devolve o p real e o estado de cada card visível
  const ir = (f) =>
    p.evaluate(async (f) => {
      const s = document.querySelector("#passeio");
      scrollTo(0, s.offsetTop + f * (s.offsetHeight - innerHeight));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const real = (scrollY - s.offsetTop) / (s.offsetHeight - innerHeight);
      const cards = [...document.querySelectorAll("[data-card]")]
        .filter((c) => c.style.visibility === "visible")
        .map((c) => {
          const foto = c.firstElementChild;
          return [c.dataset.card, c.style.transform, c.style.opacity, foto.style.transform, foto.firstElementChild?.style.filter ?? ""].join(" | ");
        });
      return { p: Math.round(real * 1e4) / 1e4, cards };
    }, f);

  const ida = [];
  const n = Math.round(ATE / passo);
  for (let k = 0; k <= n; k++) {
    ida.push(await ir(k * passo));
    if (k % cada === 0) await p.screenshot({ path: `${saida}/${nome}-devagar-${String(k / cada).padStart(2, "0")}.png` });
  }
  // rápido: saltos grandes (o estado em cada ponto não depende de como se chegou nele)
  for (let k = 0; k <= 7; k++) {
    await ir((k * ATE) / 7);
    await p.screenshot({ path: `${saida}/${nome}-rapido-${k}.png` });
  }
  // para trás, nos mesmos pontos da ida
  const volta = [];
  for (let k = n; k >= 0; k--) {
    volta.unshift(await ir(k * passo));
    if (k % cada === 0) await p.screenshot({ path: `${saida}/${nome}-volta-${String(k / cada).padStart(2, "0")}.png` });
  }
  const diferentes = ida.filter((a, k) => a.p === volta[k].p && a.cards.join() !== volta[k].cards.join()).length;
  const comparados = ida.filter((a, k) => a.p === volta[k].p).length;
  writeFileSync(`${saida}/${nome}-estados.json`, JSON.stringify({ ida, volta }, null, 1));
  console.log(nome, `${comparados} pontos com a mesma rolagem na ida e na volta; ${diferentes} com cards diferentes`);
  await ctx.close();
}
await nav.close();
console.log("ok");
