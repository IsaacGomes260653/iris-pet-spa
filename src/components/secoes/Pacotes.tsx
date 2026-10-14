"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useRef, useState } from "react";
import { Etiqueta } from "@/components/ui";
import { ficha, indice, pacotes } from "@/content/secoes";
import { Rotulo } from "./Rotulo";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// cada pacote com as cores de um dos temas do site (amanhecer, creme, verde-água)
const cabecalho = [
  "bg-[linear-gradient(160deg,#b9bed4,#d3c4d3_55%,#eccbbd)]",
  "bg-[linear-gradient(160deg,#fde7d2,#dff1e4)]",
  "bg-[linear-gradient(160deg,#2e7a72,#1d5554)]",
];
const textoCabecalho = ["text-tinta", "text-tinta", "text-papel"];
// velocidades diferentes no parallax: a do meio sobe mais
const deslocamento = [-8, -22, -12];

export function Pacotes() {
  const secao = useRef<HTMLElement>(null);
  const fotos = useRef<(HTMLDivElement | null)[]>([]);
  const [aba, setAba] = useState(1);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        fotos.current.forEach((f, i) => {
          if (!f) return;
          gsap.fromTo(f, { yPercent: 10 }, { yPercent: deslocamento[i], ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true } });
        });
      });
    },
    { scope: secao },
  );

  return (
    <section ref={secao} id="pacotes" data-tema="creme" aria-labelledby="titulo-pacotes" className="relative z-10 px-5 pt-[18svh] pb-[16svh] md:px-[6vw]">
      <Rotulo numero={indice.pacotes}>Pacotes</Rotulo>
      <h2 id="titulo-pacotes" className="mt-6 max-w-[14ch] text-titulo">
        Um cuidado para cada pelagem.
      </h2>

      {/* abertura: as três fotos sobem em velocidades diferentes */}
      <ul className="mt-14 grid grid-cols-3 gap-3 md:gap-6">
        {pacotes.map((p, i) => (
          <li key={p.id} className={i === 1 ? "md:mt-24" : i === 2 ? "md:mt-10" : ""}>
            <div ref={(el) => void (fotos.current[i] = el)} className="relative aspect-[3/4] overflow-hidden rounded-[10px]">
              <Image src={p.foto} alt={p.alt} fill sizes="(max-width: 768px) 33vw, 30vw" className="object-cover" />
              <Etiqueta className="absolute top-0 right-0 max-md:hidden">{p.nome}</Etiqueta>
            </div>
            <p className="mt-3 text-corpo max-md:text-[0.875rem]">
              <span className="font-medium">{p.nome}</span>
              <span className="block text-tinta-suave max-md:hidden">{p.frase}</span>
            </p>
          </li>
        ))}
      </ul>

      {/* ficha técnica */}
      <div className="mt-[14svh]">
        <h3 className="text-[clamp(2rem,3.4vw,3.25rem)] leading-[1.05]">Lado a lado</h3>

        {/* desktop: tabela */}
        <table className="mt-8 w-full border-collapse text-left max-md:hidden">
          <caption className="sr-only">Comparativo dos pacotes de banho</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[22%]" />
              {pacotes.map((p, i) => (
                <th key={p.id} scope="col" className={`${cabecalho[i]} ${textoCabecalho[i]} rounded-t-[10px] p-5 align-bottom font-normal`}>
                  <span className="block font-serifa text-[1.75rem] leading-tight font-extralight">{p.nome}</span>
                  <span className="mt-1 block text-[0.9375rem] opacity-85">{p.frase}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ficha.map((linha) => (
              <tr key={linha.item} className="border-b border-tinta/12">
                <th scope="row" className="py-4 pr-4 font-mono text-rotulo font-normal uppercase [font-stretch:87.5%] text-tinta-suave">
                  {linha.item}
                </th>
                {linha.valores.map((v, i) => (
                  <td key={i} className={`px-5 py-4 text-corpo ${linha.item === "A partir de" ? "font-serifa text-[1.75rem] font-extralight" : ""}`}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* celular: abas, uma coluna por vez */}
        <div className="mt-6 md:hidden">
          <div role="tablist" aria-label="Pacotes" className="flex gap-1 rounded-[14px] bg-papel p-1">
            {pacotes.map((p, i) => (
              <button
                key={p.id}
                role="tab"
                id={`aba-${p.id}`}
                aria-selected={aba === i}
                aria-controls={`painel-${p.id}`}
                onClick={() => setAba(i)}
                className={`min-h-11 flex-1 rounded-md px-1 font-mono text-[0.6875rem] uppercase [font-stretch:87.5%] ${aba === i ? "bg-[#0c2829] text-creme" : "text-tinta"}`}
              >
                {p.curto}
              </button>
            ))}
          </div>
          {pacotes.map((p, i) => (
            <div key={p.id} role="tabpanel" id={`painel-${p.id}`} aria-labelledby={`aba-${p.id}`} hidden={aba !== i} className="mt-4">
              <div className={`${cabecalho[i]} ${textoCabecalho[i]} rounded-[10px] p-5`}>
                <p className="font-serifa text-[1.75rem] leading-tight font-extralight">{p.nome}</p>
                <p className="mt-1 text-[0.9375rem] opacity-85">{p.frase}</p>
              </div>
              <dl className="mt-2">
                {ficha.map((linha) => (
                  <div key={linha.item} className="grid grid-cols-[8.5rem_1fr] gap-3 border-b border-tinta/12 py-3">
                    <dt className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-tinta-suave">{linha.item}</dt>
                    <dd className="text-corpo">{linha.valores[i]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
