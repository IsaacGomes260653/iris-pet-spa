// Capturas do rodapé: o nome gigante em vários tamanhos de janela (cabe inteiro?), a entrada das letras e quadros
// da silhueta da brincadeira ao longo do loop. node scripts/capturar-rodape.mjs <pasta> [url]   (CHROMIUM_PATH opcional)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [pasta = "rodape", url = "http://localhost:3100/"] = process.argv.slice(2);
const saida = `capturas/${pasta}`;
mkdirSync(saida, { recursive: true });
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

// até o fim de verdade: as seções com content-visibility mudam de altura quando aparecem, então rola até estabilizar
const fim = async (p) => {
  for (let k = 0, antes = -1; k < 8; k++) {
    const altura = await p.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      return document.documentElement.scrollHeight;
    });
    if (altura === antes) break;
    antes = altura;
    await p.waitForTimeout(400);
  }
};
// a caixa do nome (o SVG medido na fonte, com o acento e até a linha de base): tem de caber inteira na janela
const caixaNome = (p) =>
  p.evaluate(() => {
    const svg = [...document.querySelectorAll("footer svg")].find((s) => s.querySelector("text"));
    const r = svg.getBoundingClientRect();
    // com "meet", o desenho ocupa só parte do elemento: calcula a área real a partir do viewBox
    const vb = svg.viewBox.baseVal;
    const esc = Math.min(r.width / vb.width, r.height / vb.height);
    const w = vb.width * esc;
    const h = vb.height * esc;
    const l = r.left + (r.width - w) / 2;
    const t = r.bottom - h;
    return { l: Math.round(l), t: Math.round(t), r: Math.round(l + w), b: Math.round(t + h), largura: Math.round(w), janela: `${innerWidth}x${innerHeight}`, cabe: l >= 0 && l + w <= innerWidth && t >= 0 && t + h <= innerHeight };
  });

for (const [nome, w, h] of [["desktop", 1440, 900], ["largo", 2560, 1080], ["baixo", 1280, 600], ["tablet", 768, 1024], ["celular", 390, 844], ["estreito", 320, 640]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  await p.goto(url, { waitUntil: "networkidle" });
  await fim(p);
  await p.waitForTimeout(2600);
  console.log(nome, JSON.stringify(await caixaNome(p)));
  await p.screenshot({ path: `${saida}/${nome}.png` });
  await p.close();
}

// entrada das letras e a brincadeira ao longo do loop (desktop)
{
  const p = await nav.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(url, { waitUntil: "networkidle" });
  // para antes do rodapé e marca o instante em que a primeira letra começa a subir
  await p.evaluate(() => document.querySelector("#agendar").scrollIntoView());
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    new MutationObserver((ms, o) => {
      if (ms.some((m) => m.target.getAttribute("style")?.includes("translateY(0px)"))) {
        window.__subiu = performance.now();
        o.disconnect();
      }
    }).observe(document.querySelector("footer"), { subtree: true, attributes: true, attributeFilter: ["style"] });
  });
  for (let k = 0; k < 8; k++) {
    const ms = await p.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      return window.__subiu ? Math.round(performance.now() - window.__subiu) : -1;
    });
    await p.screenshot({ path: `${saida}/entrada-${k + 1}-${ms}ms.png` });
    await p.waitForTimeout(120);
  }
  await fim(p);
  // o recorte da brincadeira: a caixa do SVG da silhueta (o primeiro do rodapé sem <text>)
  const cena = await p.evaluate(() => {
    const r = [...document.querySelectorAll("footer svg")].find((s) => !s.querySelector("text")).getBoundingClientRect();
    return { x: 0, y: Math.max(0, r.top - 20), width: innerWidth, height: Math.min(innerHeight, r.bottom + 10) - Math.max(0, r.top - 20) };
  });
  for (let k = 0; k < 12; k++) {
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${saida}/brincadeira-${String(k).padStart(2, "0")}.png`, clip: cena });
  }
  await p.close();
}
// celular: a faixa da brincadeira acima do nome, ao longo do loop
{
  const p = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await p.goto(url, { waitUntil: "networkidle" });
  await fim(p);
  await p.waitForTimeout(1200);
  for (let k = 0; k < 10; k++) {
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${saida}/celular-brincadeira-${String(k).padStart(2, "0")}.png` });
  }
  await p.close();
}
// movimento reduzido: nome inteiro e silhueta parada
for (const [nome, w, h] of [["reduzido", 1440, 900], ["reduzido-celular", 390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  await p.goto(url, { waitUntil: "networkidle" });
  await fim(p);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${saida}/${nome}.png` });
  await p.close();
}
await nav.close();
console.log("ok");
