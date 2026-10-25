"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useMidia } from "@/components/useMidia";
import { Botao, Etiqueta } from "@/components/ui";
import { altCachorra, cachorra, cards, cenas, mao } from "@/content/midia";
import { DURACAO, DURACAO_CELULAR, quadroDoCard, roteiro, roteiroCelular, suave, type Palco } from "./cards";

// uma frase por cenário: a frase troca no meio do crossfade, junto com o mundo
const frases = ["O banho e o spa que acalmam.", "A tosa que respeita cada raça.", "A loja com tudo que ele ama.", "O Táxi Dog que busca e leva."];

// cada um dos 4 primeiros cenários ocupa 20% da rolagem; o último (a loja) é a chegada
const TRECHO = 0.2;
const TROCA = 0.1; // fração final de cada trecho em que a cena seguinte entra

const limitar = (t: number) => Math.min(1, Math.max(0, t));

export function Passeio() {
  const secao = useRef<HTMLElement>(null);
  const camadas = useRef<(HTMLDivElement | null)[]>([]);
  const cartoes = useRef<(HTMLDivElement | null)[]>([]);
  const fotos = useRef<(HTMLDivElement | null)[]>([]);
  const etiquetas = useRef<(HTMLSpanElement | null)[]>([]);
  const passo = useRef<HTMLDivElement>(null);
  const cao = useRef<HTMLDivElement>(null);
  const maoRef = useRef<HTMLDivElement>(null);
  const veu = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLOListElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const agendar = useRef<HTMLDivElement>(null);
  const fim = useRef<HTMLDivElement>(null);
  const [cena, setCena] = useState(0);
  const [fase, setFase] = useState<"hero" | "passeio" | "chegada">("hero");
  // só o primeiro cenário entra no carregamento inicial; os outros e as fotos dos cards vêm na primeira interação
  const [resto, setResto] = useState(false);
  const leve = useMidia("(max-width: 768px)");
  const quieto = useMidia("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    let raf = 0;
    let pAnterior = -1;
    let ritmo = 0; // fase do passo da cachorra, avança com a rolagem
    // o palco dos cards: medido no carregamento e quando a janela muda, nunca durante a rolagem
    let palco: Palco | null = null;
    let larguras: number[] = []; // largura e altura de cada etiqueta
    let alturas: number[] = [];
    const medir = () => {
      const foto = fotos.current.find(Boolean);
      if (!foto || !cao.current) return;
      // Array.from (e não map): no celular a lista de refs tem buracos, e o map os pularia
      larguras = Array.from(etiquetas.current, (e) => e?.offsetWidth ?? 0);
      alturas = Array.from(etiquetas.current, (e) => e?.offsetHeight ?? 0);
      const listaFim = lista.current ? lista.current.offsetTop + lista.current.offsetHeight : 0;
      palco = {
        w: innerWidth,
        h: innerHeight,
        cardW: foto.offsetWidth,
        cardH: foto.offsetHeight,
        topo: listaFim + 12 + Math.max(...alturas),
        caoTopo: cao.current.offsetTop,
        caoMeia: cao.current.offsetWidth * 0.4 + 12, // o recorte tem folga transparente dos lados
      };
    };
    const ler = () => {
      raf = 0;
      const el = secao.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = limitar(-r.top / (r.height - innerHeight));
      const ultima = cenas.length - 1;
      setCena(Math.min(frases.length - 1, Math.floor(p / TRECHO + TROCA / 2)));
      setFase(p < 0.025 ? "hero" : p > 0.79 ? "chegada" : "passeio");

      // a cachorra anda quando a rolagem anda: balanço de passo proporcional ao quanto se rolou
      if (pAnterior >= 0 && !quieto && passo.current) {
        ritmo += Math.min(Math.abs(p - pAnterior), 0.02) * 260;
        const sobe = Math.abs(Math.sin(ritmo)) * (leve ? 5 : 8);
        passo.current.style.transform = `translateY(${-sobe.toFixed(1)}px) rotate(${(Math.sin(ritmo) * 0.7).toFixed(2)}deg)`;
      }
      pAnterior = p;

      // o hero sai e a lista de frases entra presos à rolagem (sem transição por tempo); a frase ativa acende e apaga
      // com o cenário contínuo, o mesmo que troca as frases
      if (hero.current) {
        const sai = suave(0.004, 0.02, p);
        hero.current.style.opacity = String(1 - sai);
        hero.current.style.transform = `translateY(${(-24 * sai).toFixed(1)}px)`;
      }
      // a lista e o "Agendar" compacto do passeio entram e saem juntos
      const noPasseio = suave(0.02, 0.035, p) * (1 - suave(0.775, 0.79, p));
      if (agendar.current) agendar.current.style.opacity = String(noPasseio);
      if (lista.current) {
        lista.current.style.opacity = String(noPasseio);
        const continuo = p / TRECHO + TROCA / 2;
        Array.from(lista.current.children as HTMLCollectionOf<HTMLElement>).forEach((li, i) => {
          li.style.opacity = String(0.55 + 0.45 * (1 - suave(0.42, 0.58, Math.abs(continuo - i - 0.5))));
        });
      }

      // cenários: zoom lento enquanto anda; na troca curta, a que sai cresce e desfoca, a que entra assenta e foca.
      // nenhuma camada fica abaixo de 1.04 de escala: a borda da foto nunca aparece
      camadas.current.forEach((c, i) => {
        if (!c) return;
        const t = (p - i * TRECHO) / TRECHO; // 0..1 dentro do próprio trecho
        const entra = i === 0 ? 1 : suave(1 - TROCA, 1, (p - (i - 1) * TRECHO) / TRECHO);
        const sai = i === ultima ? 0 : suave(1 - TROCA, 1, t);
        const visivel = i === ultima ? entra : Math.min(entra, 1 - sai * 0.999);
        c.style.opacity = String(visivel);
        c.style.visibility = visivel > 0.002 ? "visible" : "hidden";
        if (quieto) return;
        const anda = limitar(t) * (i === ultima ? 0.03 : 0.06);
        const escala = 1.04 + anda + (1 - entra) * 0.1 + sai * 0.16;
        c.style.transform = `scale(${escala.toFixed(4)})`;
        const desfoque = (sai + (1 - entra)) * (leve ? 4 : 6);
        c.style.filter = desfoque > 0.05 ? `blur(${desfoque.toFixed(1)}px)` : "none";
      });

      // chegada: a cachorra entra na loja (encolhe rumo à soleira e some) e a mão solta a guia;
      // depois a frase sobe e some e um véu creme sobe e cobre a fachada inteira, sem emenda
      if (cao.current && maoRef.current && fim.current && veu.current && !quieto) {
        const anda = suave(0.82, 0.92, p);
        cao.current.style.transform = `translateX(-50%) translateY(${(-6 * anda).toFixed(2)}svh) scale(${(1 - 0.4 * anda).toFixed(3)})`;
        cao.current.style.opacity = String(1 - suave(0.88, 0.94, p));
        const solta = suave(0.86, 0.92, p);
        maoRef.current.style.transform = `translateX(-52%) translateY(${(solta * 70).toFixed(1)}%)`;
        maoRef.current.style.opacity = String(1 - solta);
        const s2 = suave(0.94, 0.98, p);
        fim.current.style.transform = `translateY(${(-40 * s2).toFixed(1)}px)`;
        fim.current.style.opacity = String(1 - s2);
        const v = suave(0.9, 0.98, p);
        veu.current.style.transform = `translateY(${(100 - 160 * v).toFixed(2)}svh)`;
      }

      // cards: tudo vem de `quadroDoCard`, uma função contínua da rolagem (ver cards.ts). Só a foto escala; a etiqueta
      // fica no tamanho real, presa ao canto de cima da foto, e o desfoque fica só na imagem, dentro da moldura nítida
      const trajetos = leve ? roteiroCelular : roteiro;
      const duracao = leve ? DURACAO_CELULAR : DURACAO;
      cartoes.current.forEach((c, k) => {
        const f = fotos.current[k];
        const e = etiquetas.current[k];
        if (!c || !f || !palco || !trajetos[k]) return;
        const [i, inicio, lado] = trajetos[k];
        const u = (p - (i + inicio) * TRECHO) / (duracao * TRECHO);
        const q = quieto ? null : quadroDoCard(u, lado, palco, larguras[k]);
        if (!q) {
          c.style.visibility = "hidden";
          return;
        }
        c.style.visibility = "visible";
        c.style.opacity = q.opacidade.toFixed(3);
        c.style.zIndex = String(Math.round(q.escala * 100)); // o mais perto fica na frente
        c.style.transform = `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px)`;
        // o borrão de quem passa perto vale para o card inteiro; o da distância e a névoa (cor lavada), só para a foto,
        // sempre com o tom de amanhecer do passeio
        c.style.filter = q.perto > 0.05 ? `blur(${q.perto.toFixed(1)}px)` : "none";
        f.style.transform = `translate(-50%, -50%) scale(${q.escala.toFixed(4)})`;
        const foto = f.querySelector("img");
        if (foto) {
          const n = q.nevoa;
          const borrao = q.longe > 0.05 ? `blur(${q.longe.toFixed(1)}px) ` : "";
          foto.style.filter = `${borrao}saturate(${((0.85 - 0.3 * n) * 0.85).toFixed(3)}) contrast(${(1 - 0.2 * n).toFixed(3)}) brightness(${(1 + 0.12 * n).toFixed(3)})`;
        }
        // a luz do amanhecer sobre a foto: mais forte ao longe, na névoa
        const luz = f.lastElementChild as HTMLElement | null;
        if (luz) luz.style.opacity = (0.5 + 0.5 * q.nevoa).toFixed(3);
        if (e) {
          // no canto de dentro (o do lado do caminho), crescendo um pouco com a foto
          const w = palco.cardW * q.escala;
          const h = palco.cardH * q.escala;
          const s = q.etiquetaEscala;
          const ex = lado > 0 ? -w / 2 : w / 2 - larguras[k] * s;
          e.style.transform = `translate(${ex.toFixed(1)}px, ${(-h / 2 - alturas[k] * s).toFixed(1)}px) scale(${s.toFixed(3)})`;
          e.style.opacity = q.etiqueta.toFixed(3);
        }
      });
    };
    const aoRolar = () => (raf ||= requestAnimationFrame(ler));
    const aoMudar = () => {
      medir();
      aoRolar();
    };
    medir();
    ler();
    addEventListener("scroll", aoRolar, { passive: true });
    addEventListener("resize", aoMudar);
    // as fontes mudam a altura da lista de frases e a largura das etiquetas
    document.fonts.ready.then(aoMudar);
    return () => {
      removeEventListener("scroll", aoRolar);
      removeEventListener("resize", aoMudar);
      cancelAnimationFrame(raf);
    };
  }, [leve, quieto]);

  useEffect(() => {
    const liberar = () => setResto(true);
    const eventos = ["scroll", "pointerdown", "keydown", "wheel", "touchstart"] as const;
    eventos.forEach((ev) => addEventListener(ev, liberar, { once: true, passive: true }));
    return () => eventos.forEach((ev) => removeEventListener(ev, liberar));
  }, []);

  // na chegada o nome já está no toldo: o logo do topo sai de cena
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
        {cenas.map((c, i) => (
          <div
            key={c.nome}
            ref={(el) => void (camadas.current[i] = el)}
            className="absolute inset-0 origin-[50%_60%] will-change-[transform,opacity]"
            style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden", transform: "scale(1.04)" }}
          >
            {/* em retrato a foto de paisagem cobre a altura: pede uma largura de ~2,3 telas de altura */}
            {(i === 0 || resto) && (
              <Image src={c.foto} alt={c.alt} fill sizes="(orientation: portrait) 200vh, 100vw" quality={60} preload={i === 0} className="object-cover" style={{ objectPosition: c.foco }} />
            )}
          </div>
        ))}

        {/* sombra no chão sob a cachorra */}
        <div aria-hidden className="pointer-events-none absolute bottom-[-4svh] left-1/2 h-[140px] w-[520px] max-w-[90vw] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(20_18_26/0.35),rgb(20_18_26/0))]" />

        {/* a cachorra: a mesma em todo o passeio, fixa no centro como a proa do barco; só o mundo troca */}
        {/* afundada abaixo da borda: o recorte nunca aparece, nem no alto do balanço */}
        <div ref={cao} className="pointer-events-none absolute -bottom-[12svh] left-1/2 h-[60svh] origin-bottom max-md:h-[54svh]" style={{ transform: "translateX(-50%)" }}>
          <div ref={passo} className="h-full origin-bottom will-change-transform">
            <Image
              src={cachorra}
              alt={altCachorra}
              preload
              sizes="(max-width: 768px) 60vw, 30vw"
              className="h-full w-auto origin-bottom saturate-[0.85] drop-shadow-[-1px_-1px_0_rgb(236_203_189/0.35)] motion-safe:animate-[respira_3.6s_ease-in-out_infinite]"
            />
          </div>
        </div>

        {/* a mão que segura a guia, na base da tela: o ponto de vista é o de quem passeia */}
        <div ref={maoRef} className="pointer-events-none absolute -bottom-[90px] left-1/2 h-[220px] max-md:-bottom-[70px] max-md:h-[170px]" style={{ transform: "translateX(-52%)" }}>
          <Image src={mao} alt="" sizes="320px" className="h-full w-auto max-w-none" />
        </div>

        {/* chão escuro na base: a guia e a cachorra saem da tela como a proa */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[22svh] bg-[linear-gradient(0deg,rgb(20_24_32/0.55),rgb(20_24_32/0))]" />

        {/* uma só luz de amanhecer sobre o mundo e a cachorra: lavanda no alto, pêssego no meio, azul-ardósia embaixo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(185_190_212/0.55)_0%,rgb(236_203_189/0.4)_48%,rgb(44_57_74/0.45)_100%)] mix-blend-soft-light"
        />

        {/* pêssego no terço de cima, como o sol baixo atravessando a névoa */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[34svh] bg-[linear-gradient(rgb(236_203_189/0.2),rgb(236_203_189/0))] mix-blend-screen" />

        {/* véu ardósia no alto: texto branco legível sobre qualquer foto */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[linear-gradient(rgb(28_32_46/0.5),rgb(28_32_46/0))]" />

        {/* cards pelo caminho (decorativos: os serviços também estão no texto para leitores de tela) */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {(leve ? roteiroCelular : roteiro).map(([, , , card], k) => (
              <div
                key={k}
                ref={(el) => void (cartoes.current[k] = el)}
                data-card={k}
                className="absolute top-1/2 left-1/2 size-0 will-change-[transform,opacity]"
                style={{ visibility: "hidden" }}
              >
                <div
                  ref={(el) => void (fotos.current[k] = el)}
                  className="absolute top-0 left-0 aspect-[16/10] w-[min(30vw,420px)] overflow-hidden shadow-[0_24px_60px_-28px_rgb(10_14_20/0.6)] max-md:w-[44vw]"
                >
                  {resto && <Image src={cards[card].foto} alt="" fill sizes="(max-width: 768px) 90vw, 900px" className="object-cover" />}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,#b9bed4,#eccbbd)] opacity-50 mix-blend-soft-light" />
                </div>
                <span ref={(el) => void (etiquetas.current[k] = el)} className="absolute top-0 left-0 origin-top-left whitespace-nowrap">
                  <Etiqueta className="text-[#1a1d24] max-md:text-[0.6875rem]">{cards[card].rotulo}</Etiqueta>
                </span>
              </div>
          ))}
        </div>

        {/* hero: o primeiro quadro do passeio */}
        <div
          ref={hero}
          inert={fase !== "hero"}
          className={`absolute inset-x-0 top-0 flex flex-col items-center px-5 pt-[12svh] text-center ${fase === "hero" ? "" : "pointer-events-none"}`}
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
          ref={agendar}
          inert={fase !== "passeio"}
          className={`absolute top-5 right-[6.75rem] md:top-6 md:right-[9rem] ${fase === "passeio" ? "" : "pointer-events-none"}`}
          style={{ opacity: 0 }}
        >
          <Botao href="#agendar" compacto>Agendar</Botao>
        </div>

        {/* frases: só a do cenário atual em destaque */}
        <ol
          ref={lista}
          aria-label="O que a Íris faz pelo caminho"
          className="pointer-events-none absolute inset-x-0 top-[12svh] px-5 text-center font-serifa text-[1.2rem] leading-[1.3] font-extralight [text-shadow:0_1px_14px_rgb(0_0_0/0.35)] md:top-[7svh] md:text-[2.2rem] md:leading-[1.25]"
          style={{ opacity: 0 }}
        >
          {/* opacidades presas à rolagem (ver ler()) */}
          {frases.map((f, i) => (
            <li key={f} aria-current={i === cena ? "step" : undefined} style={{ opacity: i === 0 ? 1 : 0.55 }}>
              {f}
            </li>
          ))}
        </ol>

        {/* chegada: a frase sobre as vitrines escuras, com um véu atrás; o botão bem acima da cabeça dela */}
        <div
          inert={fase !== "chegada"}
          className={`isolate absolute inset-x-0 top-[30svh] flex flex-col items-center px-5 text-center transition-[opacity,translate] duration-1000 ease-saida max-md:top-[31svh] motion-reduce:translate-y-0 ${fase === "chegada" ? "opacity-100 delay-300" : "pointer-events-none translate-y-4 opacity-0"}`}
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
