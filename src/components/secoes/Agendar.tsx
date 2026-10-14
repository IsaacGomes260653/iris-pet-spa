import { Botao } from "@/components/ui";
import { indice } from "@/content/secoes";
import { Rotulo } from "./Rotulo";

/** Chamada final: o destino de todos os "Agendar banho" do site. */
export function Agendar() {
  return (
    <section id="agendar" data-tema="creme" aria-labelledby="titulo-agendar" className="relative z-10 flex min-h-[90svh] flex-col items-center justify-center px-5 py-[14svh] text-center">
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
    </section>
  );
}
