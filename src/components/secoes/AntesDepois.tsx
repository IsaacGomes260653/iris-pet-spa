"use client";

import { CaretLeft, CaretRight, Check } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { Etiqueta } from "@/components/ui";
import { antesDepois, indice, pacotes, type PacoteId } from "@/content/secoes";
import { Rotulo } from "./Rotulo";

/**
 * Antes e depois do mesmo cão, por pacote. O slider é um <input type="range"> de verdade (teclado, toque, leitor de
 * tela) por cima das duas fotos; à esquerda da linha, o antes; à direita, o depois. A lista do que foi feito acende
 * item a item conforme o depois aparece.
 */
export function AntesDepois() {
  const [pacote, setPacote] = useState<PacoteId>("banho-tosa");
  const [linha, setLinha] = useState(50); // posição da divisória, em % da largura (0 = tudo depois, 100 = tudo antes)
  const par = antesDepois[pacote];
  const nome = pacotes.find((p) => p.id === pacote)!.nome;
  const depois = 100 - linha; // quanto do depois está à vista
  const feitos = Math.round((depois / 100) * par.feito.length);

  return (
    <section
      id="antes-e-depois"
      data-tema="agua"
      aria-labelledby="titulo-antes-depois"
      className="[content-visibility:auto] [contain-intrinsic-size:auto_900px] relative z-10 bg-[linear-gradient(rgb(46_122_114/0),#2e7a72_14svh,#1d5554)] px-5 py-[16svh] text-papel md:px-[6vw]"
    >
      <div className="flex flex-col gap-10 md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-center md:gap-[6vw]">
        {/* o comparador */}
        <figure className="order-2 md:order-none">
          <div className="group relative mx-auto aspect-[4/5] w-full max-w-[min(560px,calc((100svh-10rem)*0.8))] touch-pan-y overflow-hidden rounded-[14px] bg-abismo select-none">
            <Image src={par.depois} alt={`${par.cao} depois do ${nome}.`} fill sizes="(max-width: 768px) 90vw, 560px" className="object-cover" />
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - linha}% 0 0)` }}>
              <Image src={par.antes} alt={`${par.cao} antes do ${nome}.`} fill sizes="(max-width: 768px) 90vw, 560px" className="object-cover" />
            </div>
            <Etiqueta className="absolute top-3 left-3">Antes</Etiqueta>
            <Etiqueta className="absolute top-3 right-3">Depois</Etiqueta>
            {/* a divisória e a alça */}
            <div aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-papel shadow-[0_0_12px_rgb(0_0_0/0.35)]" style={{ left: `${linha}%` }}>
              <span className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 grid-flow-col place-items-center rounded-full bg-papel text-tinta shadow-[0_6px_20px_-6px_rgb(0_0_0/0.5)] ring-agua-funda ring-offset-2 ring-offset-papel group-has-[:focus-visible]:ring-2">
                <CaretLeft size={14} weight="bold" />
                <CaretRight size={14} weight="bold" />
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={linha}
              onChange={(e) => setLinha(Number(e.target.value))}
              aria-label={`Comparar ${par.cao.toLowerCase()} antes e depois do ${nome}`}
              aria-valuetext={`${linha}% antes, ${depois}% depois`}
              className="absolute inset-0 size-full cursor-ew-resize appearance-none bg-transparent opacity-0"
            />
          </div>
          <figcaption className="mx-auto mt-3 max-w-[min(560px,calc((100svh-10rem)*0.8))] font-mono text-[0.6875rem] uppercase [font-stretch:87.5%] text-papel-suave">
            O mesmo cão, antes e depois · foto{" "}
            <a href={par.pagina} target="_blank" rel="noopener noreferrer" className="underline decoration-papel/40 underline-offset-2 hover:decoration-papel">
              {par.autor}
            </a>{" "}
            (CC BY 2.0)
          </figcaption>
        </figure>

        <div className="contents md:block">
          <div className="order-1 md:order-none">
            <Rotulo numero={indice.antesDepois} claro>
              Antes e depois
            </Rotulo>
            <h2 id="titulo-antes-depois" className="mt-6 text-titulo">
              Do jeito que chegou ao jeito que sai.
            </h2>
            <p className="mt-6 max-w-[42ch] text-lead text-papel-suave">Escolha o pacote e arraste a linha: fotos reais do mesmo cão, antes e depois do serviço.</p>

            <div role="radiogroup" aria-label="Pacote" className="mt-8 grid w-full grid-cols-3 gap-1 rounded-[14px] bg-papel p-1 md:mt-10 md:inline-flex md:w-auto">
              {pacotes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={pacote === p.id}
                  onClick={() => {
                    setPacote(p.id);
                    setLinha(50);
                  }}
                  className={`min-h-11 rounded-md px-3 font-mono text-[0.6875rem] uppercase [font-stretch:87.5%] transition-colors md:min-h-9 md:text-[0.75rem] ${pacote === p.id ? "bg-[#0c2829] text-creme" : "text-tinta hover:bg-creme"}`}
                >
                  {p.curto}
                </button>
              ))}
            </div>
          </div>

          {/* o que foi feito: acende conforme o depois aparece no slider */}
          <ol className="order-3 border-t border-papel/20 md:order-none md:mt-10" aria-label={`O que foi feito no ${nome}`}>
            {par.feito.map((item, k) => {
              const feito = k < feitos;
              return (
                <li key={item} className={`grid grid-cols-[1.5rem_2rem_1fr] items-baseline gap-3 border-b border-papel/20 py-4 transition-opacity duration-300 ${feito ? "" : "opacity-45"}`}>
                  <span aria-hidden>{feito ? <Check size={16} weight="bold" /> : "—"}</span>
                  <span className="font-mono text-rotulo [font-stretch:87.5%]">0{k + 1}</span>
                  <span className="text-corpo">{item}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
