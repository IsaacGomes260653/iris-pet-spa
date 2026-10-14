"use client";

import { Check, Plus } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { fotoRaioX, indice, pacotes, pontos, type PacoteId } from "@/content/secoes";
import { Rotulo } from "./Rotulo";

export function RaioX() {
  const [pacote, setPacote] = useState<PacoteId>("banho-tosa");
  const [raioX, setRaioX] = useState(false);
  const [aberto, setAberto] = useState<string | null>("pelagem");
  const inclusos = pontos.filter((p) => p.pacotes.includes(pacote));
  const nomePacote = pacotes.find((p) => p.id === pacote)!.nome;

  return (
    <section id="raio-x" data-tema="agua" aria-labelledby="titulo-raio-x" className="relative z-10 px-5 py-[16svh] text-papel md:px-[6vw]">
      <div className="grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-start md:gap-[6vw]">
        {/* a foto com os pontos de cuidado */}
        <div className="relative mx-auto aspect-[2/3] w-full max-w-[520px] overflow-hidden rounded-[14px] md:sticky md:top-[8svh]">
          <Image
            src={fotoRaioX}
            alt="Pastora-alemã preta de pé, de frente, num gramado."
            fill
            sizes="(max-width: 768px) 92vw, 40vw"
            className={`object-cover transition-[filter] duration-700 ${raioX ? "brightness-[0.75] contrast-[1.35] grayscale" : ""}`}
          />
          {/* a camada de raio-x: o pelo vira uma radiografia verde-água */}
          <div aria-hidden className={`absolute inset-0 bg-[#2e7a72] mix-blend-color transition-opacity duration-700 ${raioX ? "opacity-90" : "opacity-0"}`} />
          {pontos.map((p) => {
            const incluso = p.pacotes.includes(pacote);
            const ativo = aberto === p.id;
            return (
              <div key={p.id} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <button
                  type="button"
                  onClick={() => setAberto(ativo ? null : p.id)}
                  aria-expanded={ativo}
                  aria-label={`${p.nome}${incluso ? "" : " (não incluso neste pacote)"}`}
                  className={`relative -translate-x-1/2 -translate-y-1/2 grid size-11 place-items-center rounded-full transition-[opacity,transform] duration-300 ${incluso ? "opacity-100" : "opacity-40"} ${ativo ? "scale-110" : ""}`}
                >
                  {incluso && !raioX && <span aria-hidden className="absolute inset-1 animate-ping rounded-full bg-papel/30 motion-reduce:hidden" />}
                  <span className={`relative grid size-7 place-items-center rounded-full border ${incluso ? "border-papel bg-papel text-tinta" : "border-papel/70 text-papel"}`}>
                    <Plus size={14} weight="bold" aria-hidden className={`transition-transform ${ativo ? "rotate-45" : ""}`} />
                  </span>
                </button>
                {(raioX || ativo) && (
                  <span
                    className={`pointer-events-none absolute top-0 left-5 -translate-y-1/2 whitespace-nowrap bg-papel px-2 py-1 font-mono text-rotulo uppercase text-tinta [font-stretch:87.5%] ${p.x > 70 ? "right-5 left-auto" : ""}`}
                  >
                    {p.nome}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <Rotulo numero={indice.raioX} claro>
            Raio-X do cuidado
          </Rotulo>
          <h2 id="titulo-raio-x" className="mt-6 text-titulo">
            Do focinho à ponta do rabo.
          </h2>
          <p className="mt-6 max-w-[42ch] text-lead text-papel-suave">Escolha o pacote e veja, ponto por ponto, o que a equipe cuida em cada banho.</p>

          {/* seletor de pacote + chave do raio-x */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div role="radiogroup" aria-label="Pacote" className="flex gap-1 rounded-[14px] bg-papel p-1">
              {pacotes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={pacote === p.id}
                  onClick={() => setPacote(p.id)}
                  className={`min-h-11 rounded-md px-3 font-mono text-[0.6875rem] uppercase [font-stretch:87.5%] transition-colors md:min-h-9 md:text-[0.75rem] ${pacote === p.id ? "bg-[#0c2829] text-creme" : "text-tinta hover:bg-creme"}`}
                >
                  {p.curto}
                </button>
              ))}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={raioX}
              onClick={() => setRaioX((v) => !v)}
              className="inline-flex min-h-11 items-center gap-3 font-mono text-[0.75rem] uppercase [font-stretch:87.5%]"
            >
              <span aria-hidden className={`relative h-6 w-11 rounded-full border border-papel/60 transition-colors ${raioX ? "bg-papel/90" : ""}`}>
                <span className={`absolute top-0.5 left-0.5 size-[18px] rounded-full transition-transform ${raioX ? "translate-x-5 bg-agua-funda" : "bg-papel"}`} />
              </span>
              Raio-X
            </button>
          </div>

          {/* o que está incluso, em mono, como numa ficha */}
          <ul className="mt-10 border-t border-papel/20" aria-label={`Incluso no ${nomePacote}`} aria-live="polite">
            {pontos.map((p) => {
              const incluso = inclusos.includes(p);
              return (
                <li key={p.id} className={`grid grid-cols-[1.5rem_8rem_1fr] items-baseline gap-3 border-b border-papel/20 py-4 transition-opacity ${incluso ? "" : "opacity-40"}`}>
                  <span aria-hidden>{incluso ? <Check size={16} weight="bold" /> : "—"}</span>
                  <span className="font-mono text-rotulo uppercase [font-stretch:87.5%]">{p.nome}</span>
                  <span className="text-corpo text-papel-suave">
                    {incluso ? p.texto : "Não entra neste pacote."}
                    {aberto === p.id && <span className="sr-only"> (ponto aberto na foto)</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
