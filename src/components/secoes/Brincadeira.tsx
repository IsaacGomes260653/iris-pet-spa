"use client";

import { useCallback, useRef } from "react";
import { useAnimacaoPerto } from "@/components/useAnimacaoPerto";

// cena em unidades do SVG; o chão fica em y = 248
const CHAO = 248;
const PESSOA_X = 150;
const BOLA_R = 8;
const QUADRIL = 94; // altura do quadril da pessoa; coxa 46 + canela 44 + sola
const CAO_X = PESSOA_X + 150; // onde a cachorra espera, ao lado da pessoa (sem encostar nela)
const CAO_X_COMPACTA = 340; // no celular a pessoa está fora do quadro: a cachorra espera inteira na faixa

// pernas da cachorra: pivô, comprimentos de cima e de baixo, defasagem e amplitude do passo, e o ângulo parado
// (as traseiras de pastora: coxa para a frente, jarrete para trás). Pares defasados: galope, não trote.
const PERNAS = [
  { id: "df", px: 34, py: -50, a: 24, b: 26, fase: 0.3 * Math.PI, amp: 48, frente: true, coxa: 0, jarrete: 0 }, // dianteira do fundo
  { id: "tf", px: -40, py: -54, a: 26, b: 32, fase: 1.3 * Math.PI, amp: 44, frente: false, coxa: -22, jarrete: 44 }, // traseira do fundo
  { id: "dp", px: 34, py: -50, a: 24, b: 26, fase: 0, amp: 48, frente: true, coxa: 0, jarrete: 0 }, // dianteira da frente
  { id: "tp", px: -40, py: -54, a: 26, b: 32, fase: Math.PI, amp: 44, frente: false, coxa: -22, jarrete: 44 }, // traseira da frente
];
// pernas da pessoa: quadril (x) e o ângulo parado; a da frente dá o passo do arremesso
const PERNAS_PESSOA = [
  { id: "tras", hx: -4, base: 7, frente: false },
  { id: "frente", hx: 4, base: -9, frente: true },
];

type Estado = {
  braco: number; // ombro da pessoa (graus): 10 = solto, 160 = armando, −110 = soltando a bola
  antebraco: number;
  tronco: number; // inclinação do tronco: para trás ao armar, para a frente ao soltar e ao pegar a bola
  joelho: number; // 0 em pé … 1 joelhos dobrados (a pessoa se abaixa)
  passo: number; // a perna da frente avança no arremesso (graus)
  caoX: number;
  lado: number; // 1 = olhando para a direita, −1 = para a esquerda
  corre: number; // 0 parada … 1 a toda
  cabeca: number; // inclinação da cabeça (graus, positivo = para baixo)
  abaixa: number; // 0 em pé … 1 frente abaixada ("reverência") para pegar a bola do chão
  bola: "mao" | "voo" | "chao" | "boca";
  voo: number; // 0 → 1 no arco do arremesso
  quique: number; // 0 → 1 no quique e na rolagem até parar
};

/**
 * Silhueta ao lado do nome gigante, em loop: uma pessoa arremessa a bola, a cachorra corre, pega e traz de volta.
 * Tudo em SVG, numa cor só (uma sombra); o GSAP só é baixado quando o rodapé chega perto. `compacta` (celular) é uma
 * faixa mais baixa e mais curta: a pessoa fica fora do quadro, à esquerda, e só a cachorra aparece buscando a bola.
 * `ativa` vem do nome gigante: a cena aparece e o loop começa depois que as letras sobem. Com movimento reduzido, a
 * cena fica parada (a cachorra em pé ao lado da pessoa, a bola na mão).
 */
export function Brincadeira({ className = "", compacta = false, ativa = false }: { className?: string; compacta?: boolean; ativa?: boolean }) {
  const svg = useRef<SVGSVGElement>(null);
  const casa = compacta ? CAO_X_COMPACTA : CAO_X;
  // até onde a bola vai: no desktop a cena divide a linha com o nome, então a corrida é curta e as figuras, grandes
  const fim = compacta ? 1000 : 860;

  const montar = useCallback<Parameters<typeof useAnimacaoPerto>[1]>(
    (gsap, ScrollTrigger) => {
      const raiz = svg.current!;
      const pega = (sel: string) => raiz.querySelector<SVGGElement>(sel)!;
      // no modo compacto a pessoa não é desenhada (só a mão dela conta, fora do quadro, para a bola)
      const pessoa = compacta ? null : { braco: pega("[data-braco]"), antebraco: pega("[data-antebraco]"), tronco: pega("[data-tronco]") };
      const pernasPessoa = compacta ? [] : PERNAS_PESSOA.map((p) => ({ ...p, coxa: pega(`[data-coxa='${p.id}']`), canela: pega(`[data-canela='${p.id}']`) }));
      const cao = { raiz: pega("[data-cao]"), corpo: pega("[data-corpo]"), cabeca: pega("[data-cabeca]"), rabo: pega("[data-rabo]") };
      const pernas = PERNAS.map((p) => ({ ...p, cima: pega(`[data-perna='${p.id}']`), baixo: pega(`[data-joelho='${p.id}']`) }));
      const bola = raiz.querySelector<SVGCircleElement>("[data-bola]")!;

      const e: Estado = { braco: 10, antebraco: -10, tronco: 0, joelho: 0, passo: 0, caoX: casa, lado: 1, corre: 0, cabeca: 0, abaixa: 0, bola: "mao", voo: 0, quique: 0 };
      let fase = 0;
      let rabo = 0;

      // pontos derivados: a mão da pessoa e a boca da cachorra, em coordenadas da cena (as mesmas rotações do desenho)
      const gira = (x: number, y: number, graus: number) => {
        const r = (graus * Math.PI) / 180;
        return { x: x * Math.cos(r) - y * Math.sin(r), y: x * Math.sin(r) + y * Math.cos(r) };
      };
      // ao dobrar os joelhos, o quadril desce: coxa e canela abrem 30° cada uma
      const desce = () => 90 * (1 - Math.cos((30 * e.joelho * Math.PI) / 180));
      const mao = () => {
        const ombro = gira(4, -56, e.tronco); // o ombro gira com o tronco, em torno do quadril
        const a = gira(0, 30, e.braco + e.tronco);
        const b = gira(0, 28, e.braco + e.antebraco + e.tronco);
        return { x: PESSOA_X + ombro.x + a.x + b.x, y: CHAO - 90 + desce() + ombro.y + a.y + b.y };
      };
      const inclinacao = () => 25 * e.abaixa + 4 * e.corre * Math.sin(fase);
      const boca = (sobe: number) => {
        // boca na cabeça (30, 6) → cabeça em (66, −100) → corpo inclinado em torno do quadril (−40, −52)
        const naCabeca = gira(30, 6, e.cabeca + 4 * e.corre * Math.sin(fase * 2));
        const noCorpo = gira(66 + naCabeca.x + 40, -100 + naCabeca.y + 52, inclinacao());
        return { x: e.caoX + e.lado * (noCorpo.x - 40), y: CHAO + noCorpo.y - 52 + sobe };
      };
      // o arremesso: sai da mão (guardada no momento em que solta) e cai longe, num arco
      const saida = { x: 0, y: 0 };
      const queda = { x: fim - 200, y: CHAO - BOLA_R };
      const parada = { x: fim - 115, y: CHAO - BOLA_R };

      const quadro = (_t: number, dtMs: number) => {
        const dt = Math.min(0.05, dtMs / 1000);
        // passo: a fase anda com a velocidade; parada, a cachorra fica em pé e o rabo abana
        fase += dt * (4 + 10 * e.corre) * (e.corre > 0.02 ? 1 : 0);
        rabo += dt * 9;
        const sobe = -12 * e.corre * Math.abs(Math.sin(fase));
        cao.raiz.setAttribute("transform", `translate(${e.caoX.toFixed(1)} ${CHAO}) scale(${e.lado} 1)`);
        cao.corpo.setAttribute("transform", `translate(0 ${sobe.toFixed(2)}) rotate(${inclinacao().toFixed(2)} -40 -52)`);
        cao.cabeca.setAttribute("transform", `translate(66 -100) rotate(${(e.cabeca + 4 * e.corre * Math.sin(fase * 2)).toFixed(2)})`);
        cao.rabo.setAttribute("transform", `translate(-58 -68) rotate(${(-10 + (e.corre > 0.3 ? 30 * e.corre : 14 * Math.sin(rabo))).toFixed(2)})`);
        for (const p of pernas) {
          const s = Math.sin(fase + p.fase);
          // na reverência as dianteiras dobram: o antebraço deita no chão
          const curva = p.frente ? e.abaixa : 0;
          const cima = -p.amp * e.corre * s - 60 * curva;
          // no passo, o joelho dobra quando a pata volta para a frente (dianteiras para trás, traseiras para a frente)
          const dobra = e.corre * 48 * Math.max(0, Math.cos(fase + p.fase)) * (p.frente ? 1 : -0.8) + 120 * curva;
          p.cima.setAttribute("transform", `translate(${p.px} ${p.py}) rotate(${(p.coxa + cima).toFixed(2)})`);
          p.baixo.setAttribute("transform", `translate(0 ${p.a}) rotate(${(p.jarrete + dobra).toFixed(2)})`);
        }
        const d = desce();
        for (const p of pernasPessoa) {
          p.coxa.setAttribute("transform", `translate(${PESSOA_X + p.hx} ${(CHAO - QUADRIL + d).toFixed(2)}) rotate(${(p.base - 30 * e.joelho + (p.frente ? e.passo : 0)).toFixed(2)})`);
          p.canela.setAttribute("transform", `translate(0 46) rotate(${(60 * e.joelho).toFixed(2)})`);
        }
        if (pessoa) {
          pessoa.tronco.setAttribute("transform", `translate(0 ${d.toFixed(2)}) rotate(${e.tronco.toFixed(2)} ${PESSOA_X} ${CHAO - 90})`);
          pessoa.braco.setAttribute("transform", `translate(${PESSOA_X + 4} ${CHAO - 146}) rotate(${e.braco.toFixed(2)})`); // dentro do tronco
          pessoa.antebraco.setAttribute("transform", `translate(0 30) rotate(${e.antebraco.toFixed(2)})`);
        }

        let b = mao();
        if (e.bola === "voo") {
          const t = e.voo;
          b = { x: saida.x + (queda.x - saida.x) * t, y: saida.y + (queda.y - saida.y) * t - 230 * 4 * t * (1 - t) };
        } else if (e.bola === "chao") {
          const t = e.quique;
          b = { x: queda.x + (parada.x - queda.x) * t, y: queda.y - 40 * Math.max(0, Math.sin(Math.min(1, t * 2.2) * Math.PI)) };
        } else if (e.bola === "boca") b = boca(sobe);
        bola.setAttribute("cx", b.x.toFixed(1));
        bola.setAttribute("cy", b.y.toFixed(1));
      };
      gsap.ticker.add(quadro);

      const soltar = () => {
        const m = mao();
        saida.x = m.x;
        saida.y = m.y;
        e.bola = "voo";
      };
      const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.6, defaults: { ease: "power2.inOut" } });
      tl.set(e, { bola: "mao", voo: 0, quique: 0, lado: 1, caoX: casa })
        // armar (o tronco vai para trás, a perna da frente avança) e arremessar (o tronco vem junto)
        .to(e, { braco: 160, antebraco: 30, tronco: -8, passo: -12, duration: 0.7 })
        .to(e, { braco: -110, antebraco: -20, tronco: 10, duration: 0.22, ease: "power3.in" })
        .call(soltar)
        .to(e, { braco: -40, antebraco: -5, tronco: 4, duration: 0.4, ease: "power2.out" })
        .addLabel("voo", "<")
        .to(e, { voo: 1, duration: 1.15, ease: "none" }, "voo")
        .set(e, { bola: "chao" })
        .to(e, { quique: 1, duration: 0.9, ease: "power2.out" })
        .to(e, { braco: 10, antebraco: -10, tronco: 0, passo: 0, duration: 0.6 }, "voo+=0.4")
        // a cachorra dispara atrás da bola, freia, abaixa e pega; vira ali embaixo, já com a bola (sem achatar no giro)
        .to(e, { corre: 1, duration: 0.45, ease: "power2.out" }, "voo+=0.15")
        .to(e, { caoX: parada.x - 98, duration: 2.0, ease: "power1.inOut" }, "voo+=0.15")
        .to(e, { corre: 0, duration: 0.45, ease: "power2.in" }, "voo+=1.7")
        .to(e, { cabeca: 40, abaixa: 1, duration: 0.35 })
        .set(e, { bola: "boca", lado: -1 })
        .to(e, { cabeca: 0, abaixa: 0, duration: 0.35 })
        // volta com a bola na boca
        .to(e, { corre: 0.85, duration: 0.4, ease: "power2.out" }, "<0.2")
        .to(e, { caoX: CAO_X, duration: 2.0, ease: "power1.inOut" }, "<")
        .to(e, { corre: 0, duration: 0.45, ease: "power2.in" }, "<1.55")
        // entrega: a pessoa dobra os joelhos, se abaixa e pega a bola da boca dela; a cachorra se vira de novo
        .to(e, { tronco: 18, joelho: 1, braco: -40, antebraco: -10, duration: 0.6 })
        .set(e, { bola: "mao" })
        .to(e, { tronco: 0, joelho: 0, braco: 10, antebraco: -10, duration: 0.6 })
        .set(e, { lado: 1 }, "<0.25");
      // no celular, ela volta trotando para o meio da faixa (a entrega acontece na borda, que se apaga)
      if (compacta) tl.to(e, { corre: 0.4, duration: 0.2 }).to(e, { caoX: casa, duration: 0.8, ease: "none" }, "<").to(e, { corre: 0, duration: 0.2 }, ">-0.2");

      // só anda quando o rodapé está na tela e depois que as letras subiram (+1,2 s do disparo); fora dela, pausa
      if (!ativa) return () => gsap.ticker.remove(quadro);
      let primeira = true;
      ScrollTrigger.create({
        trigger: raiz,
        start: "top bottom",
        end: "bottom top",
        onToggle: (s) => {
          if (!s.isActive) tl.pause();
          else if (!primeira) tl.play();
          else {
            primeira = false;
            gsap.delayedCall(1.2, () => void tl.play());
          }
        },
      });
      return () => gsap.ticker.remove(quadro);
    },
    [fim, compacta, casa, ativa],
  );
  useAnimacaoPerto(svg, montar);

  // pose parada (a mesma do começo do loop): também é o que aparece sem JavaScript e com movimento reduzido
  return (
    <svg
      ref={svg}
      viewBox={compacta ? "205 96 700 164" : `115 0 ${fim - 215} 250`}
      preserveAspectRatio={compacta ? "xMidYMax meet" : "xMinYMax meet"}
      aria-hidden
      // aparece depois que as letras sobem; no celular, a borda esquerda (para onde ela leva a bola) se apaga
      className={`${className} transition-[opacity,translate] delay-900 duration-700 motion-reduce:transition-none`}
      style={{
        opacity: ativa ? 1 : 0,
        translate: ativa ? "0 0" : "0 12px",
        maskImage: compacta ? "linear-gradient(90deg, transparent, #000 18%)" : undefined,
      }}
      fill="currentColor"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* a pessoa, olhando para a direita: pernas com joelho, jaqueta, rabo de cavalo (fora do quadro no celular) */}
      {!compacta && PERNAS_PESSOA.map((p) => (
        <g key={p.id} data-coxa={p.id} transform={`translate(${PESSOA_X + p.hx} ${CHAO - QUADRIL}) rotate(${p.base})`} strokeWidth={6}>
          <path d="M-8 -2 L8 -2 L6 46 L-6 46 Z" />
          <g data-canela={p.id} transform="translate(0 46)">
            <path d="M-6 0 L6 0 L4.5 44 L-4.5 44 Z" />
            <ellipse cx={6} cy={45} rx={11} ry={4} stroke="none" transform={`rotate(${-p.base} 0 44)`} />
          </g>
        </g>
      ))}
      {!compacta && (
      <g data-tronco>
        <g transform={`translate(${PESSOA_X} ${CHAO})`}>
          <path d="M-14 -149 C-3 -156 10 -156 19 -148 L15 -97 C6 -91 -6 -91 -12 -95 Z" strokeWidth={6} />
          <line x1={4} y1={-162} x2={3} y2={-148} strokeWidth={11} />
          <circle cx={4} cy={-176} r={15} stroke="none" />
          <path d="M18 -180 L23 -172 L17 -170 Z" stroke="none" />
          <path d="M-6 -186 C-20 -186 -26 -168 -20 -152 C-15 -160 -12 -170 -4 -176 Z" stroke="none" />
          {/* o outro braço, solto */}
          <path d="M-4 -144 L-11 -118 L-7 -93" fill="none" strokeWidth={10} />
          <circle cx={-7} cy={-90} r={5.5} stroke="none" />
        </g>
        <g data-braco transform={`translate(${PESSOA_X + 4} ${CHAO - 146}) rotate(10)`}>
          <line x1={0} y1={0} x2={0} y2={30} strokeWidth={11} />
          <g data-antebraco transform="translate(0 30) rotate(-10)">
            <line x1={0} y1={0} x2={0} y2={28} strokeWidth={9} />
            <circle cx={0} cy={28} r={5.5} stroke="none" />
          </g>
        </g>
      </g>
      )}

      {/* a cachorra (pastora): dorso caindo da cernelha para a garupa, peito fundo, pescoço cheio, focinho longo com o
          "stop" marcado, orelhas em pé, rabo peludo e baixo, quatro pernas articuladas */}
      <g data-cao transform={`translate(${casa} ${CHAO}) scale(1 1)`}>
        <g data-corpo>
          {PERNAS.slice(0, 2).map((p) => (
            <Perna key={p.id} {...p} />
          ))}
          <g data-rabo transform="translate(-58 -68) rotate(-10)">
            <path d="M3 -5 C-14 -1 -32 14 -41 37 C-44 45 -39 50 -34 46 C-27 36 -16 18 3 6 Z" strokeWidth={3} />
          </g>
          <path
            d="M-64 -66 C-56 -78 -20 -80 22 -84 C42 -86 58 -80 60 -64 C62 -46 50 -30 32 -30 C10 -38 -12 -50 -30 -48 C-50 -46 -66 -52 -64 -66 Z"
            strokeWidth={4}
          />
          <path d="M26 -80 C36 -96 46 -108 58 -112 L78 -100 C76 -86 70 -70 60 -56 Z" strokeWidth={4} />
          <g data-cabeca transform="translate(66 -100) rotate(0)">
            <ellipse cx={1} cy={-1} rx={19} ry={14} stroke="none" />
            <path d="M10 -9 L30 -2 C34 0 34 6 31 9 L6 12 Z" strokeWidth={3} />
            <path d="M-12 -8 L-8 -24 L3 -11 Z" strokeWidth={3} />
            <path d="M-3 -10 L3 -25 L10 -9 Z" strokeWidth={3} />
          </g>
          {PERNAS.slice(2).map((p) => (
            <Perna key={p.id} {...p} />
          ))}
        </g>
      </g>
      <circle data-bola cx={PESSOA_X - 7} cy={CHAO - 90} r={BOLA_R} stroke="none" />
    </svg>
  );
}

// pernas afinando até a pata; a traseira com a coxa larga
function Perna({ id, px, py, a, b, frente, coxa, jarrete }: (typeof PERNAS)[number]) {
  return (
    <g data-perna={id} transform={`translate(${px} ${py}) rotate(${coxa})`} strokeWidth={3}>
      <path d={frente ? `M-7 -4 L7 -4 L5 ${a} L-5 ${a} Z` : `M-13 -6 L13 -8 L5 ${a} L-4 ${a} Z`} />
      <g data-joelho={id} transform={`translate(0 ${a}) rotate(${jarrete})`}>
        <path d={`M-5 0 L5 0 L3.5 ${b} L-3.5 ${b} Z`} />
        <ellipse cx={3} cy={b} rx={6.5} ry={3.5} stroke="none" transform={`rotate(${-(coxa + jarrete)} 0 ${b})`} />
      </g>
    </g>
  );
}
