"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Botao, Etiqueta } from "@/components/ui";
import { cards, cenas } from "@/content/midia";

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

const frases = ["O banho que acalma.", "A tosa que respeita cada raça.", "A loja com tudo que ele ama.", "O spa que ele merece.", "O Táxi Dog que busca e leva."];

// cada um dos 4 primeiros cenários ocupa 20% da rolagem; o último (a loja) é a chegada
const TRECHO = 0.2;
const TROCA = 0.2; // fração final de cada trecho em que a cena seguinte entra

/** Cards por cenário: [cenário, início dentro do trecho, lado]. No celular, só o primeiro de cada cenário. */
const roteiro: [number, number, -1 | 1][] = [
  [0, 0.08, 1], [0, 0.46, -1],
  [1, 0.08, -1], [1, 0.46, 1],
  [2, 0.08, 1], [2, 0.46, -1],
  [3, 0.02, -1], [3, 0.34, 1], [3, 0.6, -1],
];
const DURACAO = 0.32; // do card nascer no ponto de fuga até passar pela câmera, em fração do trecho

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
  const [cena, setCena] = useState(0);
  const [fase, setFase] = useState<"hero" | "passeio" | "chegada">("hero");
  const leve = useMidia("(max-width: 768px)");
  const quieto = useMidia("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    let raf = 0;
    const ler = () => {
      raf = 0;
      const el = secao.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = limitar(-r.top / (r.height - innerHeight));
      const ultima = cenas.length - 1;
      setCena(Math.min(frases.length - 1, Math.floor(p / (TRECHO * 4 / frases.length))));
      setFase(p < 0.025 ? "hero" : p > 0.79 ? "chegada" : "passeio");

      // cenários: zoom lento enquanto anda; na troca, zoom forte, desfoque e crossfade
      camadas.current.forEach((c, i) => {
        if (!c) return;
        const t = (p - i * TRECHO) / TRECHO; // 0..1 dentro do próprio trecho
        const entra = i === 0 ? 1 : suave(1 - TROCA, 1, (p - (i - 1) * TRECHO) / TRECHO);
        const sai = i === ultima ? 0 : suave(1 - TROCA, 1, t);
        const visivel = i === ultima ? entra : Math.min(entra, 1 - sai * 0.999);
        c.style.opacity = String(visivel);
        c.style.visibility = visivel > 0.002 ? "visible" : "hidden";
        if (quieto) return;
        const anda = limitar(t) * (i === ultima ? 0.05 : 0.1);
        const escala = 1 + anda + sai * 0.22 - (1 - entra) * 0.04;
        c.style.transform = `scale(${escala})`;
        c.style.filter = sai > 0.01 ? `blur(${(sai * (leve ? 4 : 7)).toFixed(1)}px)` : "none";
      });

      // cards: nascem pequenos e desfocados no ponto de fuga, crescem para o lado e passam pela câmera
      cartoes.current.forEach((c, k) => {
        if (!c) return;
        const [i, inicio, lado] = roteiro[k];
        const u = (p - (i + inicio) * TRECHO) / (DURACAO * TRECHO);
        if (quieto || u <= 0 || u >= 1) {
          c.style.visibility = "hidden";
          return;
        }
        // nasce perto do horizonte, ao lado da cachorra (nunca por cima dela), e sai pela lateral
        const x = lado * lerp(leve ? 14 : 10, leve ? 34 : 38, Math.pow(u, 1.5));
        const y = lerp(-12, leve ? 0 : 6, u);
        const escala = lerp(0.16, leve ? 1.5 : 1.75, Math.pow(u, 2.2));
        const desfoque = u < 0.45 ? (1 - u / 0.45) * 5 : u > 0.82 ? ((u - 0.82) / 0.18) * 9 : 0;
        c.style.visibility = "visible";
        c.style.opacity = String(Math.min(suave(0, 0.14, u), 1 - suave(0.86, 1, u)));
        c.style.transform = `translate(-50%, -50%) translate(${x}vw, ${y}svh) scale(${escala})`;
        c.style.filter = desfoque > 0.05 ? `blur(${desfoque.toFixed(1)}px)` : "none";
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

  return (
    <section
      ref={secao}
      data-tema="amanhecer"
      aria-labelledby="titulo-hero"
      className={`relative ${quieto ? "h-[320svh]" : "h-[620svh] max-md:h-[540svh]"}`}
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-ardosia text-papel">
        {cenas.map((c, i) => (
          <div
            key={c.nome}
            ref={(el) => void (camadas.current[i] = el)}
            className="absolute inset-0 will-change-[transform,opacity]"
            style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
          >
            {"fotoCelular" in c && c.fotoCelular ? (
              <>
                <Image src={c.fotoCelular} alt={c.alt} fill sizes="100vw" className="object-cover md:hidden" />
                <Image src={c.foto} alt={c.alt} fill sizes="100vw" className="object-cover max-md:hidden" />
              </>
            ) : (
              <Image
                src={c.foto}
                alt={c.alt}
                fill
                sizes="100vw"
                preload={i === 0}
                className="object-cover"
                style={{ objectPosition: c.foco }}
              />
            )}
          </div>
        ))}

        {/* cards pelo caminho (decorativos: os serviços também estão no texto para leitores de tela) */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {roteiro.map(([i], k) =>
            leve && roteiro.findIndex(([j]) => j === i) !== k ? null : (
              <div
                key={k}
                ref={(el) => void (cartoes.current[k] = el)}
                className="absolute top-1/2 left-1/2 w-[min(30vw,420px)] will-change-[transform,opacity] max-md:w-[58vw]"
                style={{ visibility: "hidden" }}
              >
                <div className="relative aspect-[16/10] overflow-hidden shadow-[0_24px_60px_-28px_rgb(10_14_20/0.6)]">
                  <Image src={cards[k].foto} alt="" fill sizes="(max-width: 768px) 90vw, 50vw" className="object-cover" />
                </div>
                <Etiqueta className="absolute -top-[1.9rem] right-0">{cards[k].rotulo}</Etiqueta>
              </div>
            ),
          )}
        </div>

        {/* véu escuro no alto: texto branco legível sobre qualquer foto */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[42svh] bg-[linear-gradient(rgb(16_20_30/0.55),rgb(16_20_30/0))]" />

        {/* hero: o primeiro quadro do passeio */}
        <div
          inert={fase !== "hero"}
          className={`absolute inset-x-0 top-0 flex flex-col items-center px-5 pt-[15svh] text-center transition-[opacity,translate] duration-700 ease-saida motion-reduce:translate-y-0 ${fase === "hero" ? "opacity-100" : "pointer-events-none -translate-y-6 opacity-0"}`}
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
          <Botao href="#agendar">Agendar</Botao>
        </div>

        {/* frases: só a do cenário atual em destaque */}
        <ol
          aria-label="O que a Íris faz pelo caminho"
          className={`pointer-events-none absolute inset-x-0 top-[12svh] px-5 text-center font-serifa text-frase font-light transition-opacity duration-700 [text-shadow:0_1px_24px_rgb(16_20_30/0.45)] max-md:text-[1.05rem] md:top-[7svh] ${fase === "passeio" ? "opacity-100" : "opacity-0"}`}
        >
          {frases.map((f, i) => (
            <li key={f} aria-current={i === cena ? "step" : undefined} className={`transition-opacity duration-500 ${i === cena ? "opacity-100" : "opacity-45"}`}>
              {f}
            </li>
          ))}
        </ol>

        {/* chegada: a frase no céu, a porta é o botão */}
        <div
          inert={fase !== "chegada"}
          className={`absolute inset-x-0 top-[9svh] flex flex-col items-center px-5 text-center transition-[opacity,translate] duration-1000 ease-saida motion-reduce:translate-y-0 ${fase === "chegada" ? "opacity-100 delay-500" : "pointer-events-none translate-y-4 opacity-0"}`}
        >
          <p className="font-serifa text-titulo font-extralight [text-shadow:0_2px_30px_rgb(16_20_30/0.4)]">Todo passeio termina aqui.</p>
          <div className="mt-7">
            <Botao href="#agendar">Agendar banho</Botao>
          </div>
        </div>

        <p className="sr-only">
          Pelo caminho aparecem os serviços e produtos da Íris: banho, tosa, spa, rações, petiscos, brinquedos, camas, coleiras e
          Táxi Dog. O passeio termina na porta de uma loja Íris.
        </p>
      </div>
    </section>
  );
}
