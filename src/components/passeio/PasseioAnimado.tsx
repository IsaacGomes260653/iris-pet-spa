"use client";

import Image, { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { useMidia } from "@/components/useMidia";
import { Botao, Etiqueta } from "@/components/ui";
import { altPasseio, cards, mao } from "@/content/midia";
import { Quadros, type Manifesto } from "./quadros";

// uma frase por trecho da alameda; a última leva até a porta da loja
const frases = ["O banho e o spa que acalmam.", "A tosa que respeita cada raça.", "A loja com tudo que ele ama.", "O Táxi Dog que busca e leva."];

// cada frase ocupa 20% da rolagem; de 80% a 90% a cachorra entra na loja; depois o véu creme
const TRECHO = 0.2;
const TROCA = 0.1; // a frase troca um pouco antes do fim do trecho
const FIM_ANDAR = 0.8;
const FIM_ENTRADA = 0.9;
// o ciclo do modelo é curto (~0,44 m): as patas acompanham o chão numa passada um pouco mais longa, sem correria
const ESCALA_PASSO = 1.6;

/**
 * Cards pelo caminho: [trecho, início dentro do trecho, lado, card]. O primeiro de cada trecho é o da frase ativa;
 * as janelas se sobrepõem, então no desktop há sempre um card perto e outro chegando. No celular, só o principal.
 */
const roteiro: [number, number, -1 | 1, number][] = [
  [0, 0, 1, 0], [0, 0.4, -1, 2],
  [1, 0, -1, 1], [1, 0.4, 1, 7],
  [2, 0, 1, 3], [2, 0.2, -1, 4], [2, 0.4, 1, 5],
  [3, 0, -1, 8], [3, 0.2, 1, 6],
];
const DURACAO = 0.8; // do card nascer no ponto de fuga até sair pela borda, em fração do trecho
const DENTRO = 0.88; // até aqui o card fica inteiro na tela; só no fim sai pela borda

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const limitar = (t: number) => Math.min(1, Math.max(0, t));
const suave = (a: number, b: number, x: number) => {
  const t = limitar((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Imagem parada de um ponto do passeio, com recorte próprio para celular (retrato) e desktop. */
function Parada({ nome, className, prioridade = false }: { nome: string; className?: string; prioridade?: boolean }) {
  const comum = { alt: altPasseio, sizes: "100vw", quality: 70 };
  const { props: celular } = getImageProps({ ...comum, src: `/passeio/celular/${nome}.webp`, width: 720, height: 1280 });
  const { props: desktop } = getImageProps({ ...comum, src: `/passeio/desktop/${nome}.webp`, width: 1280, height: 720, preload: prioridade });
  return (
    <picture>
      <source media="(orientation: portrait)" srcSet={celular.srcSet} sizes="100vw" />
      {/* direção de arte (retrato/paisagem) com getImageProps */}
      <img {...desktop} alt={desktop.alt} className={`absolute inset-0 size-full object-cover ${className ?? ""}`} />
    </picture>
  );
}

/** A nova abertura: o passeio renderizado quadro a quadro num canvas. Só entra com NEXT_PUBLIC_NOVA_ABERTURA=1. */
export function PasseioAnimado() {
  const secao = useRef<HTMLElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const cartoes = useRef<(HTMLDivElement | null)[]>([]);
  const fotos = useRef<(HTMLDivElement | null)[]>([]);
  const etiquetas = useRef<(HTMLSpanElement | null)[]>([]);
  const maoRef = useRef<HTMLDivElement>(null);
  const veu = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLOListElement>(null);
  const fim = useRef<HTMLDivElement>(null);
  const progresso = useRef(0);
  const ultimaRolagem = useRef(0);
  const [cena, setCena] = useState(0);
  const [fase, setFase] = useState<"hero" | "passeio" | "chegada">("hero");
  const [animado, setAnimado] = useState(false); // o canvas já desenhou: a imagem parada sai
  // os quadros e as fotos dos cards só vêm na primeira interação: o carregamento inicial fica leve
  const [resto, setResto] = useState(false);
  const leve = useMidia("(max-width: 768px)");
  const retrato = useMidia("(orientation: portrait)");
  const quieto = useMidia("(prefers-reduced-motion: reduce)");

  // rolagem → frases, cards, chegada e véu (o mundo e a cachorra são desenhados no canvas, mais abaixo)
  useEffect(() => {
    let raf = 0;
    const ler = () => {
      raf = 0;
      const el = secao.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = limitar(-r.top / (r.height - innerHeight));
      progresso.current = p;
      ultimaRolagem.current = performance.now();
      setCena(Math.min(frases.length - 1, Math.floor(p / TRECHO + TROCA / 2)));
      setFase(p < 0.025 ? "hero" : p > FIM_ANDAR - 0.01 ? "chegada" : "passeio");

      // chegada: a frase sobe e some, e um véu creme sobe e cobre a fachada inteira, sem emenda
      if (fim.current && veu.current && !quieto) {
        const s2 = suave(0.94, 0.98, p);
        fim.current.style.transform = `translateY(${(-40 * s2).toFixed(1)}px)`;
        fim.current.style.opacity = String(1 - s2);
        veu.current.style.transform = `translateY(${(100 - 160 * suave(FIM_ENTRADA, 0.98, p)).toFixed(2)}svh)`;
      }

      // cards: nascem pequenos e desfocados no ponto de fuga, crescem nítidos ao lado da cachorra (inteiros na tela)
      // e só no fim do trajeto saem pela borda. Só a foto escala; a etiqueta fica no tamanho real, sem borrar
      cartoes.current.forEach((c, k) => {
        const f = fotos.current[k];
        const e = etiquetas.current[k];
        if (!c || !f) return;
        const [i, inicio, lado] = roteiro[k];
        const u = (p - (i + inicio) * TRECHO) / (DURACAO * TRECHO);
        if (quieto || u <= 0 || u >= 1) {
          c.style.visibility = "hidden";
          return;
        }
        let x, escala;
        if (u < DENTRO) {
          const v = u / DENTRO;
          x = lerp(leve ? 4 : 6, leve ? 18 : 27, Math.pow(v, 1.3));
          escala = lerp(0.35, leve ? 1.4 : 1.3, Math.pow(v, 1.6));
        } else {
          const v = (u - DENTRO) / (1 - DENTRO);
          x = (leve ? 18 : 27) + v * v * 45;
          escala = (leve ? 1.4 : 1.3) + v * 0.4;
        }
        const w = f.offsetWidth * escala;
        const h = f.offsetHeight * escala;
        // nunca por cima da lista de frases: a etiqueta fica sempre abaixo dela
        const piso = (lista.current?.getBoundingClientRect().bottom ?? 0) + 12 + (e?.offsetHeight ?? 0) + h / 2;
        const yPx = Math.max(innerHeight / 2 + ((leve ? lerp(-14, -6, u) : lerp(-20, 0, u)) * innerHeight) / 100, piso);
        let xPx = (x * innerWidth) / 100;
        // zona da cachorra (o terço do meio, abaixo de 48% da altura): nenhum card a cruza no desktop
        if (!leve && yPx + h / 2 > innerHeight * 0.48) xPx = Math.max(xPx, innerWidth * 0.17 + w / 2);
        const desfoque = u < 0.4 ? (1 - u / 0.4) * 2 : 0;
        c.style.visibility = "visible";
        c.style.opacity = String(Math.min(suave(0, 0.12, u) * (0.7 + 0.3 * suave(0.1, 0.4, u)), 1 - suave(0.97, 1, u)));
        c.style.transform = `translate(${(lado * xPx).toFixed(1)}px, ${(yPx - innerHeight / 2).toFixed(1)}px)`;
        f.style.transform = `translate(-50%, -50%) scale(${escala.toFixed(4)})`;
        const foto = f.firstElementChild as HTMLElement | null;
        if (foto) foto.style.filter = desfoque > 0.05 ? `blur(${desfoque.toFixed(1)}px)` : "none";
        if (e) {
          e.style.transform = `translate(${(w / 2 - e.offsetWidth).toFixed(1)}px, ${(-h / 2 - e.offsetHeight).toFixed(1)}px)`;
          e.style.opacity = leve || w >= e.offsetWidth + 8 ? "1" : "0";
        }
      });
    };
    const aoRolar = () => (raf ||= requestAnimationFrame(ler));
    ler();
    addEventListener("scroll", aoRolar, { passive: true });
    addEventListener("resize", aoRolar);
    return () => {
      removeEventListener("scroll", aoRolar);
      removeEventListener("resize", aoRolar);
      cancelAnimationFrame(raf);
    };
  }, [leve, quieto]);

  // o passeio renderizado: o fundo segue a rolagem quadro a quadro; a cachorra anda conforme o chão passa e, parada, respira
  useEffect(() => {
    const canvas = tela.current;
    if (!resto || quieto || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const nomeTela = retrato ? "celular" : "desktop";
    let vivo = true;
    let raf = 0;
    let visivel = true;
    let man: Manifesto | undefined;
    let fundo: Quadros | undefined;
    let andar: Quadros | undefined;
    let parada: Quadros | undefined;
    let entrada: Quadros | undefined;
    let repouso = 0; // 0 andando … 1 parada
    let desenhou = false;
    let antes = performance.now();

    const url = (n: string) => `/passeio/${nomeTela}/${n}.webp`;
    const serie = (prefixo: string, n: number, digitos: number) => Array.from({ length: n }, (_, i) => url(`${prefixo}-${String(i).padStart(digitos, "0")}`));

    const ajustar = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    };

    const desenhar = (agora: number) => {
      raf = requestAnimationFrame(desenhar);
      if (!man || !fundo || !andar || !parada || !entrada || !visivel) return;
      const dt = Math.min(0.1, (agora - antes) / 1000);
      antes = agora;
      const t = man.telas[nomeTela];
      const W = canvas.width;
      const H = canvas.height;
      const esc = Math.max(W / t.largura, H / t.altura);
      const dw = t.largura * esc;
      const dh = t.altura * esc;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;

      const p = progresso.current;
      const ultimo = man.fundo - 1;
      const qe = man.q_entrada;
      const fq =
        p < FIM_ANDAR ? (p / FIM_ANDAR) * qe : p < FIM_ENTRADA ? qe + ((p - FIM_ANDAR) / (FIM_ENTRADA - FIM_ANDAR)) * (ultimo - qe) : ultimo;
      const i0 = Math.min(ultimo, Math.floor(fq));
      const f = fq - i0;
      fundo.aquecer(i0 - 2, i0 + 6);

      // fundo: o quadro da rolagem e, por cima, o seguinte na fração que falta (sem degrau entre quadros)
      const b0 = fundo.pegar(i0);
      if (!b0) return;
      ctx.globalAlpha = 1;
      ctx.drawImage(b0, dx, dy, dw, dh);
      const b1 = f > 0.02 && i0 < ultimo ? fundo.pegar(i0 + 1) : undefined;
      if (b1) {
        ctx.globalAlpha = f;
        ctx.drawImage(b1, dx, dy, dw, dh);
      }

      // a cachorra: andando, a fase do passo é a distância percorrida; parada (sem rolar), respira; no fim, entra na loja
      const [cx, cy, cw, ch] = t.cao;
      const rx = dx + cx * dw;
      const ry = dy + cy * dh;
      const rw = cw * dw;
      const rh = ch * dh;
      const parado = agora - ultimaRolagem.current > 220;
      repouso = limitar(repouso + (parado ? dt / 0.35 : -dt / 0.15));
      if (fq < qe) {
        const k = Math.min(fq, man.camera_y.length - 1.001);
        const dist = lerp(man.camera_y[Math.floor(k)], man.camera_y[Math.floor(k) + 1], k % 1);
        const fase_ = (dist / (man.passo_m * ESCALA_PASSO)) % 1;
        const andando = andar.pegar(Math.floor(fase_ * man.andar) % man.andar);
        const respira = parada.pegar(Math.floor((agora / 1000) * 8) % man.parada);
        if (andando && repouso < 1) {
          ctx.globalAlpha = 1 - repouso;
          ctx.drawImage(andando, rx, ry, rw, rh);
        }
        if (respira && repouso > 0) {
          ctx.globalAlpha = repouso;
          ctx.drawImage(respira, rx, ry, rw, rh);
        }
      } else {
        const chegando = entrada.pegar(Math.min(man.entrada - 1, Math.round(fq - qe)));
        if (chegando) {
          ctx.globalAlpha = 1;
          ctx.drawImage(chegando, rx, ry, rw, rh);
        }
      }
      ctx.globalAlpha = 1;
      if (!desenhou) {
        desenhou = true;
        setAnimado(true);
      }

      // a mão (foto) segura a ponta da guia renderizada; na chegada, solta e sai pela base
      const m = maoRef.current;
      if (m) {
        const escCss = canvas.clientWidth / W;
        const solta = limitar((fq - qe) / 6);
        const largura = (nomeTela === "desktop" ? 0.2 : 0.2 / 0.5625) * dw * escCss;
        m.style.width = `${largura.toFixed(1)}px`;
        m.style.left = `${((dx + t.mao[0] * dw) * escCss).toFixed(1)}px`;
        m.style.top = `${((dy + t.mao[1] * dh) * escCss).toFixed(1)}px`;
        m.style.transform = `translate(-50%, -10%) rotate(12deg) translateY(${(solta * 120).toFixed(1)}%)`;
        m.style.opacity = String(1 - solta);
      }
    };

    (async () => {
      const r = await fetch("/passeio/manifesto.json");
      man = (await r.json()) as Manifesto;
      if (!vivo) return;
      fundo = new Quadros(serie("fundo", man.fundo, 3), 24);
      andar = new Quadros(serie("cao-andar", man.andar, 2), man.andar);
      parada = new Quadros(serie("cao-parada", man.parada, 2), man.parada);
      entrada = new Quadros(serie("cao-entrada", man.entrada, 2), man.entrada);
      ajustar();
      raf = requestAnimationFrame(desenhar);
      // primeiro o trecho onde a pessoa está e a cachorra; depois o resto do caminho, em ordem
      const atual = Math.round((progresso.current / FIM_ANDAR) * man.q_entrada);
      const ordem = Array.from({ length: man.fundo }, (_, i) => i).sort((a, b) => Math.abs(a - atual) - Math.abs(b - atual));
      await Promise.all([fundo.baixar(ordem.slice(0, 12)), andar.baixar(), parada.baixar()]);
      await Promise.all([fundo.baixar(ordem.slice(12)), entrada.baixar()]);
    })();

    const io = new IntersectionObserver(([e]) => void (visivel = e.isIntersecting));
    io.observe(canvas);
    addEventListener("resize", ajustar);
    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      removeEventListener("resize", ajustar);
      for (const q of [fundo, andar, parada, entrada]) q?.liberar();
    };
  }, [resto, quieto, retrato]);

  useEffect(() => {
    const liberar = () => setResto(true);
    const eventos = ["scroll", "pointerdown", "keydown", "wheel", "touchstart"] as const;
    eventos.forEach((ev) => addEventListener(ev, liberar, { once: true, passive: true }));
    return () => eventos.forEach((ev) => removeEventListener(ev, liberar));
  }, []);

  // na chegada o nome já está no letreiro: o logo do topo sai de cena
  useEffect(() => {
    document.documentElement.toggleAttribute("data-chegada", fase === "chegada");
  }, [fase]);

  return (
    <section
      ref={secao}
      id="passeio"
      data-tema="amanhecer"
      aria-labelledby="titulo-hero"
      className={`relative ${quieto ? "h-[320svh]" : "h-[620svh] max-md:h-[540svh]"}`}
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-[#8e93a3] text-papel">
        {/* imagem parada: o primeiro quadro (antes do canvas) e, com movimento reduzido, um quadro por frase */}
        {quieto ? (
          ["chave-0", "chave-1", "chave-2", "chave-3", "chave-chegada"].map((nome, k) => (
            <div key={nome} className={`absolute inset-0 transition-opacity duration-500 ${(fase === "chegada" ? 4 : cena) === k ? "opacity-100" : "opacity-0"}`}>
              <Parada nome={nome} prioridade={k === 0} />
            </div>
          ))
        ) : (
          <div className={`absolute inset-0 transition-opacity duration-300 ${animado ? "opacity-0" : "opacity-100"}`}>
            <Parada nome="chave-0" prioridade />
          </div>
        )}
        <canvas ref={tela} aria-hidden className={`absolute inset-0 size-full ${quieto ? "hidden" : ""}`} />

        {/* a mão que segura a guia: o ponto de vista é o de quem passeia (a ponta da guia renderizada termina nela) */}
        <div
          ref={maoRef}
          className={`pointer-events-none absolute origin-[50%_10%] ${animado && !quieto ? "" : "hidden"}`}
          style={{ left: "60%", top: "95%", width: "20vw" }}
        >
          <Image src={mao} alt="" sizes="(orientation: portrait) 40vw, 26vw" className="h-auto w-full" />
        </div>

        {/* véu ardósia no alto: texto branco legível sobre qualquer quadro */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[linear-gradient(rgb(28_32_46/0.45),rgb(28_32_46/0))]" />

        {/* cards pelo caminho (decorativos: os serviços também estão no texto para leitores de tela) */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {roteiro.map(([i, , , card], k) =>
            leve && roteiro.findIndex(([j]) => j === i) !== k ? null : (
              <div
                key={k}
                ref={(el) => void (cartoes.current[k] = el)}
                className="absolute top-1/2 left-1/2 size-0 will-change-[transform,opacity]"
                style={{ visibility: "hidden" }}
              >
                <div
                  ref={(el) => void (fotos.current[k] = el)}
                  className="absolute top-0 left-0 aspect-[16/10] w-[min(30vw,420px)] overflow-hidden shadow-[0_24px_60px_-28px_rgb(10_14_20/0.6)] max-md:w-[44vw]"
                >
                  {resto && <Image src={cards[card].foto} alt="" fill sizes="(max-width: 768px) 65vw, 560px" className="object-cover" />}
                </div>
                <span ref={(el) => void (etiquetas.current[k] = el)} className="absolute top-0 left-0 whitespace-nowrap transition-opacity duration-200">
                  <Etiqueta className="text-[#1a1d24] max-md:text-[0.6875rem]">{cards[card].rotulo}</Etiqueta>
                </span>
              </div>
            ),
          )}
        </div>

        {/* hero: o primeiro quadro do passeio */}
        <div
          inert={fase !== "hero"}
          className={`absolute inset-x-0 top-0 flex flex-col items-center px-5 pt-[12svh] text-center transition-[opacity,translate] duration-700 ease-saida motion-reduce:translate-y-0 ${fase === "hero" ? "opacity-100" : "pointer-events-none -translate-y-6 opacity-0"}`}
        >
          <h1 id="titulo-hero" className="text-display [text-shadow:0_2px_40px_rgb(16_20_30/0.35)]">
            Cuidado
            <br />a cada passo.
          </h1>
          <div className="mt-9">
            <Botao href="#agendar">Agendar banho</Botao>
          </div>
        </div>

        {/* durante o passeio, agendar continua a um toque */}
        <div
          inert={fase !== "passeio"}
          className={`absolute top-5 right-[6.75rem] transition-opacity duration-500 md:top-6 md:right-[9rem] ${fase === "passeio" ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <Botao href="#agendar" compacto>Agendar</Botao>
        </div>

        {/* frases: só a do trecho atual em destaque */}
        <ol
          ref={lista}
          aria-label="O que a Íris faz pelo caminho"
          className={`pointer-events-none absolute inset-x-0 top-[12svh] px-5 text-center font-serifa text-[1.2rem] leading-[1.3] font-extralight transition-opacity duration-700 [text-shadow:0_1px_14px_rgb(0_0_0/0.35)] md:top-[7svh] md:text-[2.2rem] md:leading-[1.25] ${fase === "passeio" ? "opacity-100" : "opacity-0"}`}
        >
          {frases.map((f, i) => (
            <li key={f} aria-current={i === cena ? "step" : undefined} className={`transition-opacity duration-500 ${i === cena ? "opacity-100" : "opacity-55"}`}>
              {f}
            </li>
          ))}
        </ol>

        {/* chegada: a frase sobre a fachada, com um véu atrás; a cachorra entra pela porta acesa */}
        <div
          inert={fase !== "chegada"}
          className={`isolate absolute inset-x-0 top-[14svh] flex flex-col items-center px-5 text-center transition-[opacity,translate] duration-1000 ease-saida motion-reduce:translate-y-0 ${fase === "chegada" ? "opacity-100 delay-300" : "pointer-events-none translate-y-4 opacity-0"}`}
        >
          <div ref={fim} className="flex flex-col items-center">
            <div aria-hidden className="absolute inset-x-0 -inset-y-[10svh] -z-10 bg-[radial-gradient(ellipse_50%_50%_at_50%_45%,rgb(16_20_30/0.3),rgb(16_20_30/0))]" />
            <p className="font-serifa text-titulo font-extralight text-balance [text-shadow:0_2px_30px_rgb(16_20_30/0.4)]">Todo passeio termina aqui.</p>
            <div className="mt-8">
              <Botao href="#agendar">Agendar banho</Botao>
            </div>
          </div>
        </div>

        {/* véu creme que sobe no fim: a fachada some por inteiro antes da seção de banho e tosa */}
        <div
          ref={veu}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[160svh] bg-[linear-gradient(0deg,#fbf6ee_0%,#fbf6ee_62%,rgb(251_246_238/0.7)_78%,rgb(251_246_238/0)_100%)]"
          style={{ transform: "translateY(100svh)" }}
        />

        <p className="sr-only">
          Pelo caminho aparecem os serviços e produtos da Íris: banho, tosa, spa, rações, petiscos, brinquedos, camas, coleiras e
          Táxi Dog. O passeio termina na porta de uma loja Íris.
        </p>
      </div>
    </section>
  );
}
