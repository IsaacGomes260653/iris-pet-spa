"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Botao, Etiqueta } from "@/components/ui";
import { altCachorra, cachorra, cards, cenas, mao } from "@/content/midia";

function useMidia(consulta: string) {
  return useSyncExternalStore(
    (aviso) => {
      const m = matchMedia(consulta);
      m.addEventListener("change", aviso);
      return () => m.removeEventListener("change", aviso);
    },
    () => matchMedia(consulta).matches,
    () => false,
  );
}

// uma frase por cenário: a frase troca no meio do crossfade, junto com o mundo
const frases = ["O banho e o spa que acalmam.", "A tosa que respeita cada raça.", "A loja com tudo que ele ama.", "O Táxi Dog que busca e leva."];

// cada um dos 4 primeiros cenários ocupa 20% da rolagem; o último (a loja) é a chegada
const TRECHO = 0.2;
const TROCA = 0.1; // fração final de cada trecho em que a cena seguinte entra

/**
 * Cards por cenário: [cenário, início dentro do trecho, lado, card]. O primeiro de cada cenário é o da frase ativa;
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
  const fim = useRef<HTMLDivElement>(null);
  const [cena, setCena] = useState(0);
  const [fase, setFase] = useState<"hero" | "passeio" | "chegada">("hero");
  const leve = useMidia("(max-width: 768px)");
  const quieto = useMidia("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    let raf = 0;
    let pAnterior = -1;
    let ritmo = 0; // fase do passo da cachorra, avança com a rolagem
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
        // nasce no horizonte, acima da cabeça da cachorra, e se abre para o lado enquanto cresce
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
        const y = leve ? lerp(-14, -6, u) : lerp(-20, 0, u);
        const w = f.offsetWidth * escala;
        const h = f.offsetHeight * escala;
        let xPx = (x * innerWidth) / 100;
        // zona da cachorra (o terço do meio, abaixo de 48% da altura): nenhum card a cruza no desktop
        if (!leve && innerHeight / 2 + (y * innerHeight) / 100 + h / 2 > innerHeight * 0.48) xPx = Math.max(xPx, innerWidth * 0.17 + w / 2);
        const desfoque = u < 0.4 ? (1 - u / 0.4) * 2 : 0;
        c.style.visibility = "visible";
        c.style.opacity = String(Math.min(suave(0, 0.12, u) * (0.7 + 0.3 * suave(0.1, 0.4, u)), 1 - suave(0.97, 1, u)));
        c.style.transform = `translate(${(lado * xPx).toFixed(1)}px, ${y.toFixed(2)}svh)`;
        f.style.transform = `translate(-50%, -50%) scale(${escala.toFixed(4)})`;
        // o desfoque de distância fica só na foto, dentro da moldura nítida
        const foto = f.firstElementChild as HTMLElement | null;
        if (foto) foto.style.filter = desfoque > 0.05 ? `blur(${desfoque.toFixed(1)}px)` : "none";
        if (e) {
          // etiqueta presa ao canto superior direito da foto; no desktop só aparece quando cabe sobre ela
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

  // na chegada o nome já está no toldo: o logo do topo sai de cena
  useEffect(() => {
    document.documentElement.toggleAttribute("data-chegada", fase === "chegada");
  }, [fase]);

  return (
    <section
      ref={secao}
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
            <Image src={c.foto} alt={c.alt} fill sizes="(orientation: portrait) 230vh, 100vw" preload={i === 0} className="object-cover" style={{ objectPosition: c.foco }} />
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
          {roteiro.map(([i, , , card], k) =>
            leve && k - roteiro.findIndex(([j]) => j === i) > 1 ? null : (
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
                  <Image src={cards[card].foto} alt="" fill sizes="(max-width: 768px) 65vw, 560px" className="object-cover" />
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
          className={`absolute top-5 right-5 transition-opacity duration-500 md:top-6 md:right-8 ${fase === "passeio" ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <Botao href="#agendar" compacto>Agendar</Botao>
        </div>

        {/* frases: só a do cenário atual em destaque */}
        <ol
          aria-label="O que a Íris faz pelo caminho"
          className={`pointer-events-none absolute inset-x-0 top-[12svh] px-5 text-center font-serifa text-[1.2rem] leading-[1.3] font-light transition-opacity duration-700 [text-shadow:0_1px_14px_rgb(0_0_0/0.35)] md:top-[7svh] md:text-[2.2rem] md:leading-[1.25] ${fase === "passeio" ? "opacity-100" : "opacity-0"}`}
        >
          {frases.map((f, i) => (
            <li key={f} aria-current={i === cena ? "step" : undefined} className={`transition-opacity duration-500 ${i === cena ? "opacity-100" : "opacity-55"}`}>
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
