import Image from "next/image";
import { Botao } from "@/components/ui";
import { cachorra } from "@/content/midia";
import { indice } from "@/content/secoes";
import { Rotulo } from "./Rotulo";

/** Chamada final: o destino de todos os "Agendar banho" do site. */
export function Agendar() {
  return (
    <section id="agendar" data-tema="creme" aria-labelledby="titulo-agendar" className="[content-visibility:auto] [contain-intrinsic-size:auto_900px] relative z-10 flex flex-col items-center px-5 pt-[16svh] text-center">
      <Rotulo numero={indice.agendar}>Agendar</Rotulo>
      <h2 id="titulo-agendar" className="mt-8 text-display">
        Hora do banho.
      </h2>
      <p className="mt-8 max-w-[34ch] text-lead text-tinta-suave">Escolha a unidade. Marque o horário. Ele volta cheiroso.</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Botao href="#lojas" escuro>
          Escolher a unidade
        </Botao>
        <a
          href="#pacotes"
          className="inline-flex min-h-11 items-center px-2 font-mono text-[0.8125rem] uppercase underline decoration-tinta/30 underline-offset-4 [font-stretch:87.5%] hover:decoration-tinta"
        >
          Ver os pacotes
        </a>
      </div>
      {/* a mesma cachorra do passeio, de costas, esperando na porta; o fundo escurece até o rodapé, como um fim de tarde */}
      <div aria-hidden className="relative -mx-5 mt-[8svh] flex w-[calc(100%+2.5rem)] justify-center bg-[linear-gradient(rgb(251_246_238/0)_0%,#fde7d2_30%,#2e7a72_70%,#0c2829_100%)] pt-[6svh]">
        <div className="relative">
          <div className="absolute bottom-[-3%] left-1/2 h-[9%] w-[150%] -translate-x-1/2 rounded-[50%] bg-[#0c2829]/35 blur-xl" />
          <Image src={cachorra} alt="" sizes="(max-width: 768px) 40vw, 280px" className="relative h-[46svh] w-auto saturate-[0.85] md:h-[56svh]" />
        </div>
      </div>
    </section>
  );
}
