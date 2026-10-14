import { Plus } from "@phosphor-icons/react/dist/ssr";
import { Etiqueta } from "@/components/ui";
import { depoimentos, indice, perguntas } from "@/content/secoes";
import { Rotulo } from "./Rotulo";

export function Clientes() {
  const [destaque, ...outros] = depoimentos;
  return (
    <section id="clientes" data-tema="creme" aria-labelledby="titulo-clientes" className="[content-visibility:auto] [contain-intrinsic-size:auto_900px] relative z-10 px-5 py-[14svh] md:px-[6vw]">
      <Rotulo numero={indice.clientes}>Clientes</Rotulo>
      <h2 id="titulo-clientes" className="mt-6 max-w-[14ch] text-titulo">
        Quem volta, volta abanando.
      </h2>

      {/* depoimentos: um grande e a lista ao lado */}
      <div className="mt-12 grid gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <figure className="grad-agua flex flex-col justify-between rounded-[14px] p-8 text-papel md:p-12">
          <Etiqueta className="self-start">{destaque.origem}</Etiqueta>
          <blockquote className="mt-10 font-serifa text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.15] font-extralight">“{destaque.texto}”</blockquote>
          <figcaption className="mt-8 text-corpo text-papel-suave">
            {destaque.nome}, {destaque.pet}
          </figcaption>
        </figure>
        <ul className="divide-y divide-tinta/12 border-y border-tinta/12">
          {outros.map((d) => (
            <li key={d.nome} className="py-6">
              <figure>
                <p className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-tinta-suave">{d.origem}</p>
                <blockquote className="mt-3 text-lead">“{d.texto}”</blockquote>
                <figcaption className="mt-2 text-corpo text-tinta-suave">
                  {d.nome}, {d.pet}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>

      {/* perguntas frequentes: details/summary nativos (teclado e leitor de tela sem esforço) */}
      <div className="mt-[14svh] grid gap-10 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div>
          <Rotulo numero={indice.duvidas}>Dúvidas</Rotulo>
          <h3 className="mt-6 text-titulo">Perguntas frequentes.</h3>
        </div>
        <div className="border-t border-tinta/12">
          {perguntas.map((q) => (
            <details key={q.p} className="group border-b border-tinta/12">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-lead [&::-webkit-details-marker]:hidden">
                {q.p}
                <Plus size={18} aria-hidden className="shrink-0 transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none" />
              </summary>
              <p className="max-w-[60ch] pb-6 text-corpo text-tinta-suave">{q.r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
