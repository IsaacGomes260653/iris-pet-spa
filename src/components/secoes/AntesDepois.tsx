"use client";

import { CaretLeft, CaretRight, Check } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Etiqueta } from "@/components/ui";
import { antesDepois, indice, pacotes, type PacoteId } from "@/content/secoes";
import { Rotulo } from "./Rotulo";

const limitar = (v: number) => Math.min(100, Math.max(0, v));

/**
 * Antes e depois do mesmo cão, por pacote. À esquerda da linha, o antes; à direita, o depois. O arrasto (mouse e
 * toque) é tratado no próprio quadro; um <input type="range"> invisível dá o teclado e o leitor de tela. A lista do
 * que foi feito acende item a item conforme o depois aparece.
 */
export function AntesDepois() {
  const quadro = useRef<HTMLDivElement>(null);
  const [pacote, setPacote] = useState<PacoteId>("banho-tosa");
  const [linha, setLinha] = useState(50); // posição da divisória, em % da largura (0 = tudo depois, 100 = tudo antes)
  const [animando, setAnimando] = useState(false); // só na troca de pacote e na dica: nunca durante o arrasto
  const [anuncio, setAnuncio] = useState("");
  const par = antesDepois[pacote];
  const nome = pacotes.find((p) => p.id === pacote)!.nome;
  const depois = 100 - linha;
  const feitos = Math.round((depois / 100) * par.feito.length);

  const mover = (v: number, suave = false) => {
    setAnimando(suave);
    setLinha(limitar(v));
  };

  // arrasto: o ponto tocado vira a posição da linha (no iPhone o range nativo só obedece ao polegar)
  const arrastar = useRef(false);
  const naPosicao = (x: number) => {
    const r = quadro.current!.getBoundingClientRect();
    mover(((x - r.left) / r.width) * 100);
  };

  // dica de que a foto se arrasta: na primeira vez que a seção aparece, a linha vai a 38% e volta
  useEffect(() => {
    const el = quadro.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t1 = 0;
    let t2 = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const dica = (v: number) => {
          setAnimando(true);
          setLinha(v);
        };
        t1 = window.setTimeout(() => dica(38), 400);
        t2 = window.setTimeout(() => dica(50), 1100);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // leitor de tela: "3 de 4 etapas à vista", depois que o arrasto assenta
  useEffect(() => {
    const id = setTimeout(() => setAnuncio(`${feitos} de ${par.feito.length} etapas à vista`), 500);
    return () => clearTimeout(id);
  }, [feitos, par.feito.length]);

  const transicao = animando ? "transition-[left,clip-path] duration-500 ease-saida motion-reduce:transition-none" : "";
  const alca = `clamp(22px, ${linha}%, calc(100% - 22px))`;

  return (
    <section
      id="antes-e-depois"
      data-tema="agua"
      aria-labelledby="titulo-antes-depois"
      className="[content-visibility:auto] [contain-intrinsic-size:auto_900px] relative z-10 bg-[linear-gradient(rgb(46_122_114/0),#2e7a72_14svh,#1d5554)] px-5 py-[16svh] text-papel md:px-[6vw]"
    >
      <div className="flex flex-col gap-10 md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-center md:gap-[6vw]">
        {/* o comparador */}
        <figure className="order-2 max-md:pr-3 md:order-none">
          <div
            ref={quadro}
            onPointerDown={(e) => {
              arrastar.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              naPosicao(e.clientX);
            }}
            onPointerMove={(e) => arrastar.current && naPosicao(e.clientX)}
            onPointerUp={() => (arrastar.current = false)}
            onPointerCancel={() => (arrastar.current = false)}
            onDragStart={(e) => e.preventDefault()} // sem isso o navegador arrasta a própria foto e cancela o gesto
            className="group relative mx-auto aspect-[4/5] w-full max-w-[min(560px,calc((100svh-10rem)*0.8))] cursor-ew-resize touch-pan-y overflow-hidden rounded-[14px] bg-abismo select-none max-md:max-w-[min(100%,calc((100svh-15rem)*0.8))]"
          >
            {/* os três pares ficam carregados: a troca é um crossfade, sem flash */}
            {pacotes.map((p) => {
              const ativo = p.id === pacote;
              const fotos = antesDepois[p.id];
              return (
                <div key={p.id} aria-hidden={!ativo} className={`absolute inset-0 transition-opacity duration-300 ${ativo ? "opacity-100" : "opacity-0"}`}>
                  <Image src={fotos.depois} alt={`${fotos.cao} depois do ${p.nome}.`} fill draggable={false} sizes="(max-width: 768px) 90vw, 560px" className="object-cover" />
                  <div className={`absolute inset-0 ${transicao}`} style={{ clipPath: `inset(0 ${100 - linha}% 0 0)` }}>
                    <Image src={fotos.antes} alt={`${fotos.cao} antes do ${p.nome}.`} fill draggable={false} sizes="(max-width: 768px) 90vw, 560px" className="object-cover" />
                  </div>
                </div>
              );
            })}
            {/* a divisória e a alça (nunca saem do quadro) */}
            <div aria-hidden className={`pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-papel shadow-[0_0_12px_rgb(0_0_0/0.35)] ${transicao}`} style={{ left: alca }}>
              <span className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 grid-flow-col place-items-center rounded-full bg-papel text-tinta shadow-[0_6px_20px_-6px_rgb(0_0_0/0.5)] ring-agua-funda ring-offset-2 ring-offset-papel group-has-[:focus-visible]:ring-2">
                <CaretLeft size={14} weight="bold" />
                <CaretRight size={14} weight="bold" />
              </span>
            </div>
            {/* etiquetas por cima da linha; cada uma some quando o seu lado sai da foto */}
            <Etiqueta className={`absolute top-3 left-3 z-10 transition-opacity duration-200 ${linha < 15 ? "opacity-0" : ""}`}>Antes</Etiqueta>
            <Etiqueta className={`absolute top-3 right-3 z-10 transition-opacity duration-200 ${linha > 85 ? "opacity-0" : ""}`}>Depois</Etiqueta>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(linha)}
              onChange={(e) => mover(Number(e.target.value))}
              aria-label={`Comparar ${par.cao.toLowerCase()} antes e depois do ${nome}`}
              aria-valuetext={`${Math.round(linha)}% antes, ${Math.round(depois)}% depois`}
              className="pointer-events-none absolute inset-0 size-full appearance-none bg-transparent opacity-0"
            />
          </div>
          {/* celular: a lista fica longe da foto, então um resumo colado nela acompanha o arrasto */}
          <div aria-hidden className="mx-auto mt-3 flex max-w-[min(100%,calc((100svh-15rem)*0.8))] items-center gap-3 md:hidden">
            <span className="flex gap-1">
              {par.feito.map((item, k) => (
                <span key={item} className={`h-0.5 w-4 rounded-full transition-colors duration-300 ${k < feitos ? "bg-papel" : "bg-papel/30"}`} />
              ))}
            </span>
            <span className="truncate font-mono text-[0.6875rem] uppercase [font-stretch:87.5%]">
              {feitos > 0 ? `0${feitos}/0${par.feito.length} · ${par.feito[feitos - 1]}` : "Arraste para ver o depois"}
            </span>
          </div>
          <figcaption className="mx-auto mt-3 max-w-[min(560px,calc((100svh-10rem)*0.8))] font-mono text-[0.6875rem] uppercase [font-stretch:87.5%] text-papel-suave max-md:max-w-[min(100%,calc((100svh-15rem)*0.8))]">
            O mesmo cão, antes e depois · foto{" "}
            <a href={par.pagina} target="_blank" rel="noopener noreferrer" className="underline decoration-papel/40 underline-offset-2 hover:decoration-papel">
              {par.autor}
            </a>{" "}
            <span className="whitespace-nowrap">(CC BY 2.0)</span>
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

            <div aria-label="Pacote" role="group" className="mt-8 grid w-full grid-cols-3 gap-1 rounded-[14px] bg-papel p-1 md:mt-10 md:inline-flex md:w-auto">
              {pacotes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={pacote === p.id}
                  onClick={() => {
                    setPacote(p.id);
                    mover(50, true);
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
                <li key={item} className={`grid grid-cols-[1.5rem_2rem_1fr] items-baseline gap-3 border-b border-papel/20 py-4 transition-opacity duration-300 ${feito ? "" : "opacity-70"}`}>
                  <span aria-hidden className="grid size-4 place-items-center">
                    <Check size={16} weight="bold" className={`transition-[opacity,scale] duration-300 ease-saida ${feito ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
                  </span>
                  <span className="font-mono text-rotulo [font-stretch:87.5%]">0{k + 1}</span>
                  <span className="text-corpo">
                    {item}
                    {feito && <span className="sr-only"> (feito)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="sr-only" aria-live="polite">
            {anuncio}
          </p>
        </div>
      </div>
    </section>
  );
}
