import Link from "next/link";
import { BanhoTosa } from "@/components/banho/BanhoTosa";
import { Passeio } from "@/components/passeio/Passeio";
import { Logo } from "@/components/ui";

export default function Home() {
  return (
    <main>
      <Link href="/" aria-label="Íris Pet Spa, início" className="logo-tema fixed top-6 left-6 z-20 md:top-7 md:left-8">
        <Logo />
      </Link>
      <Passeio />
      <BanhoTosa />
      {/* começo da Fase 4: a tinta verde-água desemboca aqui (o globo das lojas entra nesta seção) */}
      <section id="lojas" data-tema="agua" aria-labelledby="titulo-lojas" className="relative z-10 bg-agua px-5 pt-[14svh] pb-[24svh] text-papel md:px-[6vw]">
        <h2 id="titulo-lojas" className="max-w-[10ch] text-titulo">
          Patinha após patinha
        </h2>
        <p className="mt-6 max-w-[38ch] text-lead text-papel-suave">A Íris está em todo o Brasil. Arraste para explorar nossas unidades.</p>
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
