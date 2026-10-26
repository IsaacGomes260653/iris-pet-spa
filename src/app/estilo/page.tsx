import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { Botao, Etiqueta, Logo } from "@/components/ui";
import { cards, cenas } from "@/content/midia";

export const metadata: Metadata = {
  title: "Direção de arte — Íris Pet Spa",
  robots: { index: false },
};

const conteudo = "mx-auto max-w-[82rem] px-5 md:px-10";

const tipos = [
  { spec: "Display · Literata 200 · 124", amostra: <p className="font-serifa text-display font-extralight">Banho em minutos.</p> },
  { spec: "Título · Literata 200 · 80", amostra: <p className="font-serifa text-titulo font-extralight">Patinha após patinha</p> },
  {
    spec: "Frase · Literata 300 · 30",
    amostra: (
      <ul className="font-serifa text-frase font-light">
        <li>O banho que acalma.</li>
        <li className="opacity-45">A tosa que respeita cada raça.</li>
        <li className="opacity-45">A loja com tudo que ele ama.</li>
      </ul>
    ),
  },
  {
    spec: "Lead · Hanken Grotesk · 21",
    amostra: <p className="max-w-[46ch] text-lead">Água morna na medida, shampoo para cada tipo de pelo e secagem silenciosa.</p>,
  },
  {
    spec: "Corpo · Hanken Grotesk · 17",
    amostra: (
      <p className="max-w-[62ch] text-corpo text-tinta-suave">
        Ele volta para casa cheiroso e calmo. Se preferir, o Táxi Dog busca e leva: você acompanha o trajeto pelo celular e
        recebe uma foto quando o banho termina.
      </p>
    ),
  },
  { spec: "Rótulo · Martian Mono · 12", amostra: <Etiqueta>Banho — espuma de aveia</Etiqueta> },
];

const temas = [
  { id: "amanhecer", nome: "Amanhecer no passeio", stops: "#B9BED4 · #D3C4D3 · #ECCBBD · #93A3B5 · #2C394A" },
  { id: "creme", nome: "Creme, pêssego e menta", stops: "#FBF6EE · #FDE7D2 · #DFF1E4 · #F4FAF6" },
  { id: "agua", nome: "Verde-água profundo", stops: "#2E7A72 · #1D5554 · #123B3D · #0C2829" },
];

const contrastes = [
  { par: "Tinta sobre creme", fundo: "bg-creme", texto: "text-tinta", razao: "14,3:1" },
  { par: "Tinta suave sobre pêssego", fundo: "bg-pessego-claro", texto: "text-tinta-suave", razao: "6,1:1" },
  { par: "Papel sobre verde-água", fundo: "bg-agua", texto: "text-papel", razao: "5,0:1" },
  { par: "Papel sobre ardósia", fundo: "bg-ardosia", texto: "text-papel", razao: "11,6:1" },
];

const segmentos = [
  { nome: "Início e o passeio", cor: "bg-seg-passeio", peso: 6 },
  { nome: "Banho e tosa", cor: "bg-seg-banho", peso: 4 },
  { nome: "Lojas", cor: "bg-seg-lojas", peso: 2 },
  { nome: "Pacotes e antes e depois", cor: "bg-seg-pacotes", peso: 4 },
  { nome: "A rede", cor: "bg-seg-rede", peso: 1 },
  { nome: "Especialistas e clientes", cor: "bg-seg-pessoas", peso: 2 },
  { nome: "Agendar", cor: "bg-seg-agendar", peso: 1 },
];

export default function Estilo() {
  return (
    <main>
      <Link href="/" aria-label="Íris Pet Spa, início" className="absolute top-6 left-6 md:top-7 md:left-8">
        <Logo />
      </Link>

      <section data-tema="amanhecer" aria-labelledby="t-passeio" className="pt-36 pb-36">
        <div className={conteudo}>
          <h1 className="font-serifa text-titulo font-extralight">Direção de arte</h1>
          <p className="mt-6 max-w-[52ch] text-lead">
            Um único passeio ao amanhecer, do parque até a porta da loja. As fotos passam pela mesma correção de cor e o
            fundo da página muda de tema a cada seção.
          </p>
          <h2 id="t-passeio" className="sr-only">Fotos do passeio</h2>
          <ol className="mt-16 grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
            {cenas.map((c, i) => (
              <li key={c.nome} className="relative aspect-[3/4] overflow-hidden bg-ardosia">
                <Image src={c.foto} alt={c.alt} fill sizes="(min-width: 768px) 20vw, 50vw" className="object-cover" />
                <Etiqueta className="absolute top-0 right-0">
                  {String(i + 1).padStart(2, "0")} · {c.nome}
                </Etiqueta>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section data-tema="creme" aria-labelledby="t-tipos" className="py-36">
        <div className={conteudo}>
          <h2 id="t-tipos" className="font-serifa text-titulo font-extralight">Tipografia</h2>
          <dl className="mt-14 border-t border-tinta/15">
            {tipos.map((t) => (
              <div key={t.spec} className="grid items-baseline gap-4 border-b border-tinta/15 py-9 md:grid-cols-[17rem_1fr] md:gap-10">
                <dt className="text-(--cor-texto-suave)">
                  <span className="font-mono text-rotulo uppercase [font-stretch:87.5%]">{t.spec}</span>
                </dt>
                <dd>{t.amostra}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-32 font-serifa text-titulo font-extralight">Componentes</h2>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Botao href="#">Agendar banho</Botao>
            <Botao href="#">Como chegar</Botao>
            <Botao href="#">Baixar guia</Botao>
          </div>

          <h2 className="mt-32 font-serifa text-titulo font-extralight">Cards do passeio</h2>
          <p className="mt-6 max-w-[52ch] text-lead">
            Aparecem pelo caminho, de longe e desfocados, e passam pela câmera. Correção de cor mais leve que a das cenas.
          </p>
          <ul className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {cards.map((c) => (
              <li key={c.rotulo} className="relative aspect-[4/5] overflow-hidden bg-pessego">
                <Image src={c.foto} alt={c.alt} fill sizes="(min-width: 768px) 30vw, 50vw" className="object-cover" />
                <Etiqueta className="absolute top-0 right-0">{c.rotulo}</Etiqueta>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-tema="agua" aria-labelledby="t-paleta" className="py-36">
        <div className={conteudo}>
          <h2 id="t-paleta" className="font-serifa text-titulo font-extralight">Paleta</h2>
          <p className="mt-6 max-w-[52ch] text-lead text-(--cor-texto-suave)">
            Três temas que se dissolvem na rolagem. Nenhuma troca é seca: sempre há um gradiente no meio do caminho.
          </p>
          <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-5">
            {temas.map((t) => (
              <figure key={t.id}>
                <div className={`grad-${t.id} aspect-[4/5]`} />
                <figcaption className="mt-4">
                  <span className="block font-serifa text-frase font-light">{t.nome}</span>
                  <span className="mt-2 block font-mono text-rotulo text-(--cor-texto-suave) uppercase [font-stretch:87.5%]">{t.stops}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-28 grid gap-16 md:grid-cols-[1fr_auto] md:gap-24">
            <div>
              <h3 className="font-serifa text-frase font-light">Contraste medido (WCAG 2.2 AA)</h3>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {contrastes.map((c) => (
                  <li key={c.par} className={`${c.fundo} ${c.texto} flex min-h-28 flex-col justify-between p-5`}>
                    <span className="text-corpo">{c.par}</span>
                    <span className="font-mono text-rotulo uppercase [font-stretch:87.5%]">{c.razao}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-serifa text-frase font-light">Barra de progresso</h3>
              <div className="mt-8 flex h-80 gap-5">
                <ol aria-label="Segmentos da barra, do topo ao fim da página" className="flex w-1.5 flex-col gap-0.5">
                  {segmentos.map((s) => (
                    <li key={s.nome} style={{ flexGrow: s.peso }} className={s.cor}>
                      <span className="sr-only">{s.nome}</span>
                    </li>
                  ))}
                </ol>
                <ol aria-hidden className="flex flex-col gap-0.5 font-mono text-rotulo text-(--cor-texto-suave) uppercase [font-stretch:87.5%]">
                  {segmentos.map((s) => (
                    <li key={s.nome} style={{ flexGrow: s.peso }} className="flex min-h-4 items-start">
                      {s.nome}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
          <p className="mt-28 font-mono text-rotulo text-(--cor-texto-suave) uppercase [font-stretch:87.5%]">
            Página interna de referência · não indexada
          </p>
        </div>
      </section>
    </main>
  );
}
