"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef } from "react";
import { especialistas, indice } from "@/content/secoes";
import { Rotulo } from "./Rotulo";

/** Carrossel arrastável: rolagem horizontal nativa com encaixe, arrasto com o mouse e setas. */
export function Especialistas() {
  const trilho = useRef<HTMLUListElement>(null);
  const arrasto = useRef({ ativo: false, x: 0, inicio: 0, moveu: false });

  const passar = (lado: 1 | -1) => {
    const t = trilho.current;
    if (!t) return;
    const card = t.querySelector("li");
    t.scrollBy({ left: lado * ((card?.clientWidth ?? 320) + 24), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <section id="especialistas" data-tema="creme" aria-labelledby="titulo-especialistas" className="[content-visibility:auto] [contain-intrinsic-size:auto_900px] relative z-10 py-[16svh]">
      <div className="flex flex-wrap items-end justify-between gap-6 px-5 md:px-[6vw]">
        <div>
          <Rotulo numero={indice.especialistas}>Especialistas</Rotulo>
          <h2 id="titulo-especialistas" className="mt-6 max-w-[13ch] text-titulo">
            Gente que entende de bicho.
          </h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => passar(-1)} aria-label="Anterior" className="grid size-12 place-items-center rounded-md border border-tinta/25 hover:bg-papel">
            <ArrowLeft size={18} aria-hidden />
          </button>
          <button type="button" onClick={() => passar(1)} aria-label="Próximo" className="grid size-12 place-items-center rounded-md border border-tinta/25 hover:bg-papel">
            <ArrowRight size={18} aria-hidden />
          </button>
        </div>
      </div>

      <ul
        ref={trilho}
        tabIndex={0}
        aria-label="Especialistas da Íris (role para o lado)"
        className="mt-12 flex cursor-grab snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-5 px-5 pb-4 [scrollbar-width:none] active:cursor-grabbing md:scroll-px-[6vw] md:px-[6vw] [&::-webkit-scrollbar]:hidden"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || !trilho.current) return;
          arrasto.current = { ativo: true, x: e.clientX, inicio: trilho.current.scrollLeft, moveu: false };
          trilho.current.style.scrollSnapType = "none";
        }}
        onPointerMove={(e) => {
          const a = arrasto.current;
          if (!a.ativo || !trilho.current) return;
          if (Math.abs(e.clientX - a.x) > 4) a.moveu = true;
          trilho.current.scrollLeft = a.inicio - (e.clientX - a.x);
        }}
        onPointerUp={() => {
          arrasto.current.ativo = false;
          if (trilho.current) trilho.current.style.scrollSnapType = "";
        }}
        onPointerLeave={() => {
          arrasto.current.ativo = false;
          if (trilho.current) trilho.current.style.scrollSnapType = "";
        }}
      >
        {especialistas.map((e) => (
          <li key={e.nome} className="w-[min(78vw,340px)] shrink-0 snap-start select-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-ardosia">
              <Image src={e.foto} alt={e.alt} fill draggable={false} sizes="(max-width: 768px) 78vw, 340px" className="object-cover" />
            </div>
            <p className="mt-4 font-serifa text-[1.75rem] leading-tight font-extralight">{e.nome}</p>
            <p className="mt-1 text-corpo text-tinta-suave">{e.papel}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
