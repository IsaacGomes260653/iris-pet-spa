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
    <section id="raio-x" data-tema="agua" aria-labelledby="titulo-raio-x" className="[content-visibility:auto] [contain-intrinsic-size:auto_900px] relative z-10 bg-[linear-gradient(rgb(46_122_114/0),#2e7a72_14svh,#1d5554)] px-5 py-[16svh] text-papel md:px-[6vw]">
      {/* celular: título e controles, depois a foto presa no alto e a lista passando; desktop: foto à esquerda, o resto à direita */}
      <div className="flex flex-col gap-10 md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-start md:gap-[6vw]">
        <div className="sticky top-16 z-10 order-2 aspect-[2/3] h-[55svh] self-start overflow-hidden rounded-[14px] bg-abismo md:top-[8svh] md:order-none md:h-[min(780px,calc(100svh-9rem))] md:w-auto">
          <Image src={fotoRaioX} alt="Pastora-alemã preta de pé, de frente, num gramado." fill sizes="(max-width: 768px) 60vw, 40vw" className="object-cover" />
          {/* a radiografia: silhueta clara sobre fundo escuro, revelada por uma varredura de cima para baixo */}
          <div
            aria-hidden
            className="absolute inset-0 transition-[clip-path] duration-[600ms] ease-saida motion-reduce:transition-none"
            style={{ clipPath: raioX ? "inset(0 0 0 0)" : "inset(0 0 100% 0)" }}
          >
            <Image src={fotoRaioX} alt="" fill sizes="(max-width: 768px) 60vw, 40vw" className="object-cover [filter:grayscale(1)_invert(1)_contrast(1.5)_brightness(0.95)]" />
            <div className="absolute inset-0 bg-[#2e7a72] mix-blend-multiply" />
            <div className="absolute inset-0 bg-[#7fe0d0] opacity-25 mix-blend-screen" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgb(255_255_255/0.06)_0_1px,transparent_1px_24px),repeating-linear-gradient(90deg,rgb(255_255_255/0.06)_0_1px,transparent_1px_24px)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(12_40_41/0.7))]" />
          </div>
          {/* só os pontos do pacote escolhido aparecem na foto */}
          {inclusos.map((p) => {
            const ativo = aberto === p.id;
            const aEsquerda = p.x > 60;
            return (
              <div key={p.id} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <button
                  type="button"
                  onClick={() => setAberto(ativo ? null : p.id)}
                  aria-expanded={ativo}
                  aria-label={p.nome}
                  className="absolute top-0 left-0 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                >
                  {!raioX && <span aria-hidden className="absolute inset-1 animate-ping rounded-full bg-papel/30 motion-reduce:hidden" />}
                  <span className="relative grid size-7 place-items-center rounded-full border border-papel bg-papel text-tinta">
                    <Plus size={14} weight="bold" aria-hidden className={`transition-transform ${ativo ? "rotate-45" : ""}`} />
                  </span>
                </button>
                {(raioX || ativo) && (
                  <span
                    className="pointer-events-none absolute top-0 -translate-y-1/2 whitespace-nowrap bg-papel px-2 py-1 font-mono text-rotulo uppercase text-tinta [font-stretch:87.5%]"
                    style={{ left: aEsquerda ? undefined : "30px", right: aEsquerda ? "30px" : undefined }}
                  >
                    {p.nome}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="contents md:block">
          <div className="order-1 md:order-none">
            <Rotulo numero={indice.raioX} claro>
              Raio-X do cuidado
            </Rotulo>
            <h2 id="titulo-raio-x" className="mt-6 text-titulo">
              Do focinho à ponta do rabo.
            </h2>
            <p className="mt-6 max-w-[42ch] text-lead text-papel-suave">Escolha o pacote e veja, ponto por ponto, o que a equipe cuida em cada banho.</p>

            {/* seletor de pacote + chave do raio-x */}
            <div className="mt-8 flex flex-nowrap items-center gap-3 md:mt-10 md:gap-4">
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
          </div>

          {/* o que está incluso, em mono, como numa ficha */}
          <ul className="order-3 border-t border-papel/20 md:order-none md:mt-10" aria-label={`Incluso no ${nomePacote}`} aria-live="polite">
            {pontos.map((p) => {
              const incluso = inclusos.includes(p);
              return (
                <li key={p.id} className={`grid grid-cols-[1.5rem_7rem_1fr] items-baseline gap-3 border-b border-papel/20 py-4 transition-opacity ${incluso ? "" : "opacity-45"}`}>
                  <span aria-hidden>{incluso ? <Check size={16} weight="bold" /> : "—"}</span>
                  <span className="font-mono text-rotulo uppercase [font-stretch:87.5%]">{p.nome}</span>
                  <span className="text-corpo text-papel-suave">{incluso ? p.texto : "Não entra neste pacote."}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
