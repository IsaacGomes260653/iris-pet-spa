import Link from "next/link";
import { Suspense } from "react";
import { BanhoTosa } from "@/components/banho/BanhoTosa";
import { BarraProgresso } from "@/components/BarraProgresso";
import { Lojas } from "@/components/lojas/Lojas";
import { Agendar } from "@/components/secoes/Agendar";
import { Clientes } from "@/components/secoes/Clientes";
import { Especialistas } from "@/components/secoes/Especialistas";
import { Guia } from "@/components/secoes/Guia";
import { Pacotes } from "@/components/secoes/Pacotes";
import { RaioX } from "@/components/secoes/RaioX";
import { Rede } from "@/components/secoes/Rede";
import { Rodape } from "@/components/secoes/Rodape";
import { Passeio } from "@/components/passeio/Passeio";
import { Som } from "@/components/Som";
import { Logo } from "@/components/ui";

export default function Home() {
  return (
    <main>
      <Link href="/" aria-label="Íris Pet Spa, início" className="logo-tema fixed top-6 left-6 z-20 md:top-7 md:left-8">
        <Logo />
      </Link>
      <Som />
      <BarraProgresso />
      <Passeio />
      {/* abaixo da dobra: limites de Suspense deixam o React hidratar em partes, sem uma tarefa longa só */}
      <Suspense>
        <BanhoTosa />
      </Suspense>
      {/* no desktop entra sobreposta à cortina verde-água do banho: o título do mapa sobe por cima dela */}
      <Suspense>
        <Lojas />
      </Suspense>
      <Suspense>
        <Pacotes />
        <RaioX />
        <Rede />
      </Suspense>
      <Suspense>
        <Especialistas />
        <Clientes />
        <Guia />
        <Agendar />
        <Rodape />
      </Suspense>
    </main>
  );
}
