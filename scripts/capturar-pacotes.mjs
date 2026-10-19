// Capturas dos pacotes: cursor se aproximando, resumo no hover, detalhes abertos, toque no celular e movimento reduzido.
// node scripts/capturar-pacotes.mjs <pasta> [url]   (CHROMIUM_PATH opcional)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [pasta = "pacotes", url = "http://localhost:3100/"] = process.argv.slice(2);
const saida = `capturas/${pasta}`;
mkdirSync(saida, { recursive: true });
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

const irPara = async (p, seletor, bloco = "start") => {
  await p.evaluate(([s, b]) => document.querySelector(s).scrollIntoView({ block: b, behavior: "instant" }), [seletor, bloco]);
  await p.waitForTimeout(900);
};
const transformada = (p, k) => p.evaluate((k) => { const m = document.querySelectorAll("#pacotes ul > li > div:first-child")[k]; return [getComputedStyle(m).transform, getComputedStyle(m.firstElementChild.firstElementChild).transform].join(" | "); }, k);

// desktop
{
  const p = await nav.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(url, { waitUntil: "networkidle" });
  await irPara(p, "#pacotes ul", "center");
  await p.screenshot({ path: `${saida}/desktop-01-parado.png` });
  const caixa = await p.locator("#pacotes ul > li > div:first-child").nth(1).boundingBox();
  // o cursor vem de longe até o centro do card do meio
  for (const [k, f] of [[2, 1.6], [3, 0.9], [4, 0.25]].entries()) {
    await p.mouse.move(caixa.x + caixa.width * (0.5 + f[1]), caixa.y + caixa.height * 0.4, { steps: 8 });
    await p.waitForTimeout(700);
    console.log("transform", f[1], await transformada(p, 1));
    await p.screenshot({ path: `${saida}/desktop-0${k + 2}-cursor-${f[1]}.png` });
  }
  await p.locator("#pacotes summary").nth(1).click();
  await p.waitForTimeout(700);
  await p.mouse.move(10, 10);
  await p.waitForTimeout(700);
  await irPara(p, "#pacotes ul", "start");
  await p.screenshot({ path: `${saida}/desktop-05-detalhes.png` });
  await p.close();
}
// celular: toque inclina; detalhes abertos no carrossel
{
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "networkidle" });
  await irPara(p, "#pacotes ul", "center");
  const caixa = await p.locator("#pacotes ul > li > div:first-child").nth(0).boundingBox();
  const cdp = await ctx.newCDPSession(p);
  const ponto = { x: caixa.x + caixa.width * 0.8, y: caixa.y + caixa.height * 0.3 };
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [ponto] });
  await p.waitForTimeout(700);
  console.log("toque", await transformada(p, 0));
  await p.screenshot({ path: `${saida}/celular-01-toque.png` });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await p.waitForTimeout(800);
  console.log("solto", await transformada(p, 0));
  await p.locator("#pacotes summary:visible").first().click();
  await p.waitForTimeout(700);
  await irPara(p, "#pacotes ul", "start");
  await p.screenshot({ path: `${saida}/celular-02-detalhes.png`, fullPage: false });
  await p.evaluate(() => scrollBy(0, 500));
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${saida}/celular-03-detalhes-2.png` });
  await ctx.close();
}
// movimento reduzido: nada se move
{
  const p = await nav.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await p.goto(url, { waitUntil: "networkidle" });
  await irPara(p, "#pacotes ul", "center");
  const caixa = await p.locator("#pacotes ul > li > div:first-child").nth(1).boundingBox();
  await p.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2, { steps: 6 });
  await p.waitForTimeout(700);
  console.log("reduzido", await transformada(p, 1));
}
await nav.close();
console.log("ok");
