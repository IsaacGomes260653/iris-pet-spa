// Capturas das seções da Fase 5 (pacotes, raio-x, rede, especialistas, clientes, guia, agendar e rodapé).
// node scripts/capturar-secoes.mjs <pasta> [url]   (CHROMIUM_PATH opcional)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [pasta = "secoes", url = "http://localhost:3100/"] = process.argv.slice(2);
const saida = `capturas/${pasta}`;
mkdirSync(saida, { recursive: true });

const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-gpu-rasterization"],
});
const telas = { desktop: { viewport: { width: 1440, height: 900 } }, celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
const ir = async (pagina, seletor, deslocar = 0) => {
  await pagina.evaluate(
    ([s, d]) => {
      const el = document.querySelector(s);
      scrollTo({ top: el.getBoundingClientRect().top + scrollY + d * innerHeight, behavior: "instant" });
    },
    [seletor, deslocar],
  );
  await pagina.waitForTimeout(2200);
};
for (const [nome, opcoes] of Object.entries(telas)) {
  const pagina = await navegador.newPage(opcoes);
  await pagina.goto(url, { waitUntil: "networkidle" });
  const foto = (n) => pagina.screenshot({ path: `${saida}/${nome}-${n}.png` });
  await ir(pagina, "#pacotes");
  await foto("01-pacotes");
  await ir(pagina, "#pacotes", 1);
  await foto("02-pacotes-fotos");
  await ir(pagina, "#pacotes table, #pacotes [role=tablist]", -0.15);
  await foto("03-ficha");
  await ir(pagina, "#raio-x");
  await foto("04-raio-x");
  await pagina.getByRole("switch", { name: "Raio-X" }).click();
  await pagina.getByRole("radio", { name: "Spa Premium" }).click();
  await pagina.waitForTimeout(1200);
  await foto("05-raio-x-ligado");
  await ir(pagina, "#rede");
  await pagina.waitForTimeout(1500);
  await foto("06-rede");
  await ir(pagina, "#especialistas");
  await foto("07-especialistas");
  await ir(pagina, "#clientes");
  await foto("08-clientes");
  await pagina.locator("#clientes summary").first().click();
  await ir(pagina, "#clientes details", -0.3);
  await foto("09-perguntas");
  await ir(pagina, "#guia");
  await foto("10-guia");
  await ir(pagina, "#agendar");
  await foto("11-agendar");
  await ir(pagina, "footer");
  await foto("12-rodape");
  await pagina.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await pagina.waitForTimeout(1500);
  await foto("13-fim");
  await pagina.close();
}
await navegador.close();
console.log("ok");
