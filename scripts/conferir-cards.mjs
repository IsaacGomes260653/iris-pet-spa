// Confere os cards do passeio (src/components/passeio/cards.ts) sem navegador: em três palcos típicos, percorre a vida
// de um card em passos finos e falha se algo saltar, se a foto subir sobre a lista de frases ou se entrar na zona da
// cachorra (no desktop largo e no celular; em telas baixas vale a foto inteira na tela). node --no-warnings scripts/conferir-cards.mjs   (Node 23.6+ lê o .ts direto)
import assert from "node:assert/strict";
import { quadroDoCard } from "../src/components/passeio/cards.ts";

const palcos = {
  desktop: { w: 1440, h: 900, cardW: 420, cardH: 262.5, topo: 274, caoTopo: 468, caoMeia: 120, cao: true },
  baixo: { w: 1280, h: 600, cardW: 384, cardH: 240, topo: 252, caoTopo: 312, caoMeia: 90, cao: false },
  celular: { w: 390, h: 844, cardW: 171.6, cardH: 107, topo: 233, caoTopo: 490, caoMeia: 95, cao: true },
};
const PASSOS = 20000;
const LIMITE = { x: 8, y: 8, escala: 0.01, longe: 0.05, perto: 0.05, nevoa: 0.01, opacidade: 0.01, etiqueta: 0.02 };

for (const [nome, palco] of Object.entries(palcos)) {
  for (const lado of [-1, 1]) {
    let antes = null;
    const maior = Object.fromEntries(Object.keys(LIMITE).map((c) => [c, 0]));
    for (let n = 1; n < PASSOS; n++) {
      const u = n / PASSOS;
      const q = quadroDoCard(u, lado, palco, 150);
      assert.ok(q, `${nome}: card some no meio da vida (u=${u})`);
      const w = palco.cardW * q.escala;
      const h = palco.cardH * q.escala;
      const topo = q.y + palco.h / 2 - h / 2;
      const base = topo + h;
      const dentro = Math.abs(q.x) - w / 2; // a borda da foto mais perto do centro
      // nunca sobre a lista de frases
      assert.ok(topo >= palco.topo - 0.5, `${nome}: topo ${topo.toFixed(1)} acima de ${palco.topo} (u=${u})`);
      // nunca na zona da cachorra
      if (palco.cao && base > palco.caoTopo && q.opacidade > 0.01)
        assert.ok(dentro >= palco.caoMeia - 0.5, `${nome}: cruza a cachorra (borda a ${dentro.toFixed(1)} px, u=${u})`);
      // sem saltos enquanto aparece (algum pedaço na tela): cada passo de 1/20000 da vida muda pouco
      const naTela = dentro < palco.w / 2 && topo < palco.h;
      if (antes && naTela) for (const c of Object.keys(LIMITE)) maior[c] = Math.max(maior[c], Math.abs(q[c] - antes[c]));
      antes = q;
    }
    for (const c of Object.keys(LIMITE)) assert.ok(maior[c] <= LIMITE[c], `${nome}: ${c} saltou ${maior[c].toFixed(3)} num passo`);
    // nasce pequeno e transparente; no fim, já saiu da tela ou apagou
    const nasce = quadroDoCard(0.005, lado, palco, 150);
    assert.ok(nasce.escala < 0.2 && nasce.opacidade < 0.05, `${nome}: nasce grande ou visível`);
    const sai = quadroDoCard(0.999, lado, palco, 150);
    const fora = Math.abs(sai.x) - (palco.cardW * sai.escala) / 2 >= palco.w / 2;
    assert.ok(fora || sai.opacidade < 0.01, `${nome}: não sai no fim`);
    // em algum momento a foto inteira fica na tela, grande o bastante para a etiqueta
    let inteira = false;
    for (let n = 1; n < 1000 && !inteira; n++) {
      const q = quadroDoCard(n / 1000, lado, palco, 150);
      const w = palco.cardW * q.escala;
      inteira = q.etiqueta > 0.99 && Math.abs(q.x) + w / 2 <= palco.w / 2;
    }
    assert.ok(inteira, `${nome}: a foto nunca fica inteira na tela com a etiqueta`);
    if (lado === 1) console.log(nome, "maior passo:", Object.entries(maior).map(([c, v]) => `${c} ${v.toFixed(3)}`).join(", "));
  }
}
console.log("cards ok");
