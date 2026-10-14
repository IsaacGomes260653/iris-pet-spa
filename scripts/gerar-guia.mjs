// Gera public/guia-de-cuidados.pdf (o "Baixe o guia de cuidados" do site) imprimindo um HTML com o Chromium.
// node scripts/gerar-guia.mjs   (CHROMIUM_PATH opcional; as fontes vêm do Google Fonts)
import { chromium } from "playwright";

const secoes = [
  {
    titulo: "Banho na medida",
    itens: [
      ["Pelo curto", "A cada 3 ou 4 semanas. Banho demais tira a oleosidade que protege a pele."],
      ["Pelo longo ou duplo", "A cada 2 ou 3 semanas, sempre com secagem completa até a raiz do subpelo."],
      ["Pele sensível", "Shampoo hipoalergênico e água morna, nunca quente. Na dúvida, fale com o veterinário."],
    ],
  },
  {
    titulo: "Escova é carinho",
    itens: [
      ["Frequência", "Pelo curto: 1 vez por semana. Pelo longo ou duplo: 3 vezes por semana, e todo dia na troca de pelo."],
      ["Do jeito certo", "Da nuca para o rabo, a favor do pelo, sem puxar os nós. Nó difícil se desfaz com os dedos."],
    ],
  },
  {
    titulo: "Unhas, orelhas e dentes",
    itens: [
      ["Unhas", "Se fazem barulho no piso, passou da hora de cortar. Em média, a cada 3 semanas."],
      ["Orelhas", "Limpeza leve com algodão e solução própria a cada 15 dias. Cheiro forte ou vermelhidão pedem veterinário."],
      ["Dentes", "Escovação com pasta para cães 3 vezes por semana. Petisco não substitui escova."],
    ],
  },
  {
    titulo: "Passeio e patas",
    itens: [
      ["Asfalto quente", "Encoste o dorso da mão no chão por 5 segundos. Se não aguentar, as patas dele também não aguentam."],
      ["Depois da rua", "Pano úmido entre os dedos e almofadas secas, para evitar fungos."],
    ],
  },
  {
    titulo: "Sinais para não esperar",
    itens: [
      ["Coceira insistente", "Pode ser alergia, pulga ou fungo."],
      ["Falta de apetite por mais de um dia", "Ou vômito, diarreia, apatia: procure o veterinário."],
      ["Mancar ou lamber a pata sem parar", "Pode ter algo preso entre os dedos."],
    ],
  },
];

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600&family=Literata:opsz,wght@7..72,200;7..72,300&family=Martian+Mono:wdth,wght@87.5,400&display=block" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Hanken Grotesk", sans-serif; color: #22252b; font-size: 11pt; line-height: 1.5; }
  .pagina { width: 210mm; min-height: 297mm; padding: 20mm 18mm; page-break-after: always; position: relative; }
  .capa { background: linear-gradient(180deg, #b9bed4 0%, #d3c4d3 30%, #eccbbd 58%, #93a3b5 85%, #2c394a 100%); color: #fffdfb; display: flex; flex-direction: column; justify-content: space-between; }
  .rotulo { font-family: "Martian Mono", monospace; font-stretch: 87.5%; font-size: 8pt; text-transform: uppercase; letter-spacing: .02em; }
  .etiqueta { display: inline-block; background: #fffdfb; color: #22252b; padding: 2mm 3mm; }
  h1 { font-family: "Literata", serif; font-weight: 200; font-size: 52pt; line-height: .95; letter-spacing: -.02em; }
  h2 { font-family: "Literata", serif; font-weight: 300; font-size: 22pt; line-height: 1.1; margin: 9mm 0 4mm; }
  .marca { font-family: "Literata", serif; font-weight: 300; font-size: 22pt; }
  .creme { background: linear-gradient(180deg, #fbf6ee 0%, #fbf6ee 60%, #fde7d2 88%, #dff1e4 100%); }
  .item { display: grid; grid-template-columns: 52mm 1fr; gap: 6mm; padding: 3mm 0; border-top: .3mm solid rgba(34,37,43,.15); }
  .item b { font-weight: 600; }
  .rodape { position: absolute; left: 18mm; right: 18mm; bottom: 12mm; display: flex; justify-content: space-between; color: #4f5560; }
  .intro { max-width: 120mm; font-size: 13pt; margin-top: 6mm; }
</style></head><body>
<section class="pagina capa">
  <div class="marca">Íris <span class="rotulo">Pet Spa</span></div>
  <div>
    <span class="rotulo etiqueta">Guia de cuidados</span>
    <h1 style="margin-top:8mm">Pelo bonito.<br>Rotina simples.</h1>
    <p class="intro">O que dá para fazer em casa entre um banho e outro, do jeito que a gente faz no salão.</p>
  </div>
  <p class="rotulo">Marca fictícia · projeto de portfólio</p>
</section>
<section class="pagina creme">
  ${secoes
    .map(
      (s, i) => `<h2><span class="rotulo">0${i + 1}</span><br>${s.titulo}</h2>
      ${s.itens.map(([t, d]) => `<div class="item"><b>${t}</b><span>${d}</span></div>`).join("")}`,
    )
    .join("")}
  <div class="rodape rotulo"><span>Íris Pet Spa · guia de cuidados</span><span>Este guia não substitui a consulta veterinária.</span></div>
</section>
</body></html>`;

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();
await pagina.setContent(html, { waitUntil: "networkidle" });
await pagina.evaluate(() => document.fonts.ready);
await pagina.pdf({ path: "public/guia-de-cuidados.pdf", format: "A4", printBackground: true, preferCSSPageSize: true });
await navegador.close();
console.log("public/guia-de-cuidados.pdf");
