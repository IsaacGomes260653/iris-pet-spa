import Link from "next/link";
import { Botao, CenaFoto, Logo } from "@/components/ui";
import { cenas } from "@/content/midia";

export default function Home() {
  const [ponte] = cenas;
  return (
    <main>
      <section data-tema="amanhecer" aria-labelledby="titulo-hero" className="relative h-svh min-h-[34rem] overflow-hidden text-papel">
        <CenaFoto foto={ponte.foto} alt={ponte.alt} preload />
        {/* névoa da manhã: escurece o céu só o bastante para o título branco */}
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(28_35_51/0.6)_0%,rgb(28_35_51/0.3)_42%,rgb(28_35_51/0)_68%,rgb(28_35_51/0.25)_100%)]" />
        <Link href="/" aria-label="Íris Pet Spa, início" className="absolute top-6 left-6 md:top-7 md:left-8">
          <Logo />
        </Link>
        <div className="relative flex h-full flex-col items-center px-5 pt-[17svh] text-center">
          <h1 id="titulo-hero" className="text-display">
            Cuidado a<br />
            cada passo.
          </h1>
          <div className="mt-9">
            <Botao href="#agendar">Agendar banho</Botao>
          </div>
        </div>
      </section>
    </main>
  );
}
