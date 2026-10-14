import Link from "next/link";
import { BanhoTosa } from "@/components/banho/BanhoTosa";
import { Lojas } from "@/components/lojas/Lojas";
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
      {/* no desktop entra sobreposta à cortina verde-água do banho: o título do mapa sobe por cima dela */}
      <Lojas />
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
