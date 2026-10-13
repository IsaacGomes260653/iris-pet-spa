import Link from "next/link";
import { Passeio } from "@/components/passeio/Passeio";
import { Logo } from "@/components/ui";

export default function Home() {
  return (
    <main>
      <Link href="/" aria-label="Íris Pet Spa, início" className="logo-tema fixed top-6 left-6 z-20 md:top-7 md:left-8">
        <Logo />
      </Link>
      <Passeio />
      {/* próxima seção (Fase 3): o passeio desemboca no creme */}
      <section data-tema="creme" aria-labelledby="titulo-banho" className="relative z-10 -mt-[75svh] flex min-h-[105svh] items-start justify-center bg-[linear-gradient(rgb(251_246_238/0),rgb(251_246_238/0.85)_16%,#fbf6ee_30%)] px-5 pt-[42svh] text-center max-md:justify-start max-md:text-left">
        <h2 id="titulo-banho" className="text-display max-md:text-[1.7rem] max-md:leading-[1.08]">
          Banho em minutos.
          <br />
          Tosa sob medida.
          <br />
          Carinho do começo ao fim.
        </h2>
      </section>
      {/* destino do "Agendar banho" (o agendamento completo entra na Fase 5) */}
      <section id="agendar" data-tema="creme" aria-labelledby="titulo-agendar" className="flex min-h-[70svh] flex-col items-center justify-center px-5 text-center">
        <h2 id="titulo-agendar" className="text-titulo">Hora do banho.</h2>
        <p className="mt-6 max-w-[40ch] text-lead text-tinta-suave">
          Escolha a unidade, o serviço e o horário. Ele volta para casa cheiroso e calmo.
        </p>
      </section>
    </main>
  );
}
