"use client";

import { useCallback, useRef } from "react";
import { useAnimacaoPerto } from "@/components/useAnimacaoPerto";

// cena em unidades do viewBox (1200 × 260); o chão fica em y = 248
const CHAO = 248;
const PESSOA_X = 150;
const BOLA_R = 8;

// pernas da cachorra: pivô, comprimentos de cima e de baixo, defasagem e amplitude do passo, e o ângulo parado
// (as traseiras de pastora: coxa para a frente, jarrete para trás)
const PERNAS = [
  { id: "df", px: 34, py: -50, a: 24, b: 26, fase: 0.6, amp: 34, frente: true, coxa: 0, jarrete: 0 }, // dianteira do fundo
  { id: "tf", px: -40, py: -54, a: 26, b: 32, fase: Math.PI + 0.6, amp: 30, frente: false, coxa: -22, jarrete: 44 }, // traseira do fundo
  { id: "dp", px: 34, py: -50, a: 24, b: 26, fase: 0, amp: 34, frente: true, coxa: 0, jarrete: 0 }, // dianteira da frente
  { id: "tp", px: -40, py: -54, a: 26, b: 32, fase: Math.PI, amp: 30, frente: false, coxa: -22, jarrete: 44 }, // traseira da frente
];

type Estado = {
  braco: number; // ombro da pessoa (graus): 10 = solto, 160 = armando, −110 = soltando a bola
  antebraco: number;
  tronco: number; // a pessoa se abaixa para pegar a bola
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
 * Silhueta ao fundo do nome gigante, em loop: uma pessoa arremessa a bola, a cachorra corre, pega e traz de volta.
 * Tudo em SVG, numa cor só (uma sombra); o GSAP só é baixado quando o rodapé chega perto. Com movimento reduzido,
 * a cena fica parada (a cachorra em pé, a bola na mão).
 */
export function Brincadeira({ className = "" }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);

  const montar = useCallback<Parameters<typeof useAnimacaoPerto>[1]>((gsap, ScrollTrigger) => {
    const raiz = svg.current!;
    const pega = (sel: string) => raiz.querySelector<SVGGElement>(sel)!;
    const pessoa = { braco: pega("[data-braco]"), antebraco: pega("[data-antebraco]"), tronco: pega("[data-tronco]") };
    const cao = { raiz: pega("[data-cao]"), corpo: pega("[data-corpo]"), cabeca: pega("[data-cabeca]"), rabo: pega("[data-rabo]") };
    const pernas = PERNAS.map((p) => ({ ...p, cima: pega(`[data-perna='${p.id}']`), baixo: pega(`[data-joelho='${p.id}']`) }));
    const bola = raiz.querySelector<SVGCircleElement>("[data-bola]")!;

    const e: Estado = { braco: 10, antebraco: -10, tronco: 0, caoX: 300, lado: 1, corre: 0, cabeca: 0, abaixa: 0, bola: "mao", voo: 0, quique: 0 };
    let fase = 0;
    let rabo = 0;

    // pontos derivados: a mão da pessoa e a boca da cachorra, em coordenadas da cena (as mesmas rotações do desenho)
    const gira = (x: number, y: number, graus: number) => {
      const r = (graus * Math.PI) / 180;
      return { x: x * Math.cos(r) - y * Math.sin(r), y: x * Math.sin(r) + y * Math.cos(r) };
    };
    const mao = () => {
      const ombro = gira(4, -56, e.tronco); // o ombro gira com o tronco, em torno do quadril
      const a = gira(0, 30, e.braco + e.tronco);
      const b = gira(0, 28, e.braco + e.antebraco + e.tronco);
      return { x: PESSOA_X + ombro.x + a.x + b.x, y: CHAO - 90 + ombro.y + a.y + b.y };
    };
    const inclinacao = () => 25 * e.abaixa + 3 * e.corre * Math.sin(fase);
    const boca = (sobe: number) => {
      // boca na cabeça (30, 6) → cabeça em (66, −100) → corpo inclinado em torno do quadril (−40, −52)
      const naCabeca = gira(30, 6, e.cabeca + 4 * e.corre * Math.sin(fase * 2));
      const noCorpo = gira(66 + naCabeca.x + 40, -100 + naCabeca.y + 52, inclinacao());
      return { x: e.caoX + e.lado * (noCorpo.x - 40), y: CHAO + noCorpo.y - 52 + sobe };
    };
    // o arremesso: sai da mão (guardada no momento em que solta) e cai longe, num arco
    const saida = { x: 0, y: 0 };
    const queda = { x: 1000, y: CHAO - BOLA_R };
    const parada = { x: 1085, y: CHAO - BOLA_R };

    const quadro = (_t: number, dtMs: number) => {
      const dt = Math.min(0.05, dtMs / 1000);
      // passo: a fase anda com a velocidade; parada, a cachorra fica em pé e o rabo abana
      fase += dt * (4 + 10 * e.corre) * (e.corre > 0.02 ? 1 : 0);
      rabo += dt * 9;
      const sobe = -6 * e.corre * Math.abs(Math.sin(fase));
      cao.raiz.setAttribute("transform", `translate(${e.caoX.toFixed(1)} ${CHAO}) scale(${e.lado.toFixed(3)} 1)`);
      cao.corpo.setAttribute("transform", `translate(0 ${sobe.toFixed(2)}) rotate(${inclinacao().toFixed(2)} -40 -52)`);
      cao.cabeca.setAttribute("transform", `translate(66 -100) rotate(${(e.cabeca + 4 * e.corre * Math.sin(fase * 2)).toFixed(2)})`);
      cao.rabo.setAttribute("transform", `translate(-58 -68) rotate(${(-10 + (e.corre > 0.3 ? -25 * e.corre : 14 * Math.sin(rabo))).toFixed(2)})`);
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
      pessoa.tronco.setAttribute("transform", `rotate(${e.tronco.toFixed(2)} ${PESSOA_X} ${CHAO - 90})`);
      pessoa.braco.setAttribute("transform", `translate(${PESSOA_X + 4} ${CHAO - 146}) rotate(${e.braco.toFixed(2)})`); // dentro do tronco
      pessoa.antebraco.setAttribute("transform", `translate(0 30) rotate(${e.antebraco.toFixed(2)})`);

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
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, defaults: { ease: "power2.inOut" } });
    tl.set(e, { bola: "mao", voo: 0, quique: 0, lado: 1, caoX: 300 })
      // armar e arremessar
      .to(e, { braco: 160, antebraco: 30, duration: 0.7 })
      .to(e, { braco: -110, antebraco: -20, duration: 0.22, ease: "power3.in" })
      .call(soltar)
      .to(e, { braco: -40, antebraco: -5, duration: 0.4, ease: "power2.out" })
      .addLabel("voo", "<")
      .to(e, { voo: 1, duration: 1.15, ease: "none" }, "voo")
      .set(e, { bola: "chao" })
      .to(e, { quique: 1, duration: 0.9, ease: "power2.out" })
      .to(e, { braco: 10, antebraco: -10, duration: 0.6 }, "voo+=0.4")
      // a cachorra dispara atrás da bola, freia, abaixa a cabeça e pega
      .to(e, { corre: 1, duration: 0.45, ease: "power2.out" }, "voo+=0.15")
      .to(e, { caoX: parada.x - 98, duration: 2.0, ease: "power1.inOut" }, "voo+=0.15")
      .to(e, { corre: 0, duration: 0.45, ease: "power2.in" }, "voo+=1.7")
      .to(e, { cabeca: 40, abaixa: 1, duration: 0.35 })
      .set(e, { bola: "boca" })
      .to(e, { cabeca: 0, abaixa: 0, duration: 0.35 })
      // vira e volta com a bola na boca
      .to(e, { lado: -1, duration: 0.35, ease: "power1.inOut" })
      .to(e, { corre: 0.85, duration: 0.4, ease: "power2.out" }, "<0.2")
      .to(e, { caoX: PESSOA_X + 120, duration: 2.0, ease: "power1.inOut" }, "<")
      .to(e, { corre: 0, duration: 0.45, ease: "power2.in" }, "<1.55")
      // entrega: a pessoa se abaixa e pega a bola da boca dela
      .to(e, { tronco: 28, braco: -20, antebraco: -15, duration: 0.6 })
      .set(e, { bola: "mao" })
      .to(e, { tronco: 0, braco: 10, antebraco: -10, duration: 0.6 })
      .to(e, { lado: 1, duration: 0.35, ease: "power1.inOut" }, "<0.2")
      .to(e, { caoX: 300, duration: 0.7 }, "<");

    // só anda quando o rodapé está na tela
    ScrollTrigger.create({ trigger: raiz, start: "top bottom", end: "bottom top", onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) });
    return () => gsap.ticker.remove(quadro);
  }, []);
  useAnimacaoPerto(svg, montar);

  // pose parada (a mesma do começo do loop): também é o que aparece sem JavaScript e com movimento reduzido
  return (
    <svg ref={svg} viewBox="0 0 1200 260" aria-hidden className={className} fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* a pessoa, olhando para a direita */}
      <g transform={`translate(${PESSOA_X} ${CHAO})`} strokeWidth={6}>
        <path d="M-11 -96 L4 -96 L-5 -6 L-15 -6 Z" />
        <path d="M-3 -96 L11 -96 L21 -6 L11 -6 Z" />
        <ellipse cx={-7} cy={-4} rx={12} ry={5} stroke="none" />
        <ellipse cx={20} cy={-4} rx={12} ry={5} stroke="none" />
      </g>
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

      {/* a cachorra (pastora): corpo, cabeça de orelha em pé, rabo cheio e quatro pernas articuladas */}
      <g data-cao transform={`translate(300 ${CHAO}) scale(1 1)`}>
        <g data-corpo>
          {PERNAS.slice(0, 2).map((p) => (
            <Perna key={p.id} {...p} />
          ))}
          <g data-rabo transform="translate(-58 -68) rotate(-10)">
            <path d="M3 -6 C-14 -2 -32 14 -42 38 C-46 48 -40 56 -33 50 C-26 40 -16 20 3 8 Z" strokeWidth={4} />
          </g>
          <path
            d="M-64 -66 C-56 -78 -20 -80 22 -84 C42 -86 58 -80 60 -64 C62 -48 50 -38 32 -38 C10 -42 -12 -50 -30 -48 C-50 -46 -66 -52 -64 -66 Z"
            strokeWidth={4}
          />
          <path d="M26 -80 C36 -96 46 -108 58 -112 L78 -100 C76 -86 70 -70 60 -56 Z" strokeWidth={4} />
          <g data-cabeca transform="translate(66 -100) rotate(0)">
            <ellipse cx={3} cy={-1} rx={16} ry={14} stroke="none" />
            <path d="M8 -10 L30 -2 C34 0 34 6 31 9 L6 12 Z" strokeWidth={3} />
            <path d="M-11 -8 L-7 -36 L5 -12 Z" strokeWidth={3} />
            <path d="M-2 -10 L5 -37 L12 -9 Z" strokeWidth={3} />
          </g>
          {PERNAS.slice(2).map((p) => (
            <Perna key={p.id} {...p} />
          ))}
        </g>
      </g>
      <circle data-bola cx={PESSOA_X - 6} cy={CHAO - 88} r={BOLA_R} stroke="none" />
    </svg>
  );
}

function Perna({ id, px, py, a, b, frente, coxa, jarrete }: (typeof PERNAS)[number]) {
  return (
    <g data-perna={id} transform={`translate(${px} ${py}) rotate(${coxa})`}>
      {frente ? <line x1={0} y1={0} x2={0} y2={a} strokeWidth={13} /> : <path d={`M-13 -6 L13 -8 L5 ${a} L-4 ${a} Z`} strokeWidth={5} />}
      <g data-joelho={id} transform={`translate(0 ${a}) rotate(${jarrete})`}>
        <line x1={0} y1={0} x2={0} y2={b} strokeWidth={frente ? 9 : 8} />
        <ellipse cx={3} cy={b} rx={6.5} ry={3.5} stroke="none" transform={`rotate(${-(coxa + jarrete)} 0 ${b})`} />
      </g>
    </g>
  );
}
