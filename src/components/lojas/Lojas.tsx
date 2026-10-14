"use client";

import { MapPin, Star, X } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Botao, Etiqueta } from "@/components/ui";
import { lojas, nomesServico, type Loja, type Servico } from "@/content/lojas";

// o globo (three.js) só baixa quando a seção chega perto
const Globo = dynamic(() => import("./Globo"), { ssr: false });

function useMidia(consulta: string) {
  return useSyncExternalStore(
    (aviso) => {
      const m = matchMedia(consulta);
      m.addEventListener("change", aviso);
      return () => m.removeEventListener("change", aviso);
    },
    () => matchMedia(consulta).matches,
    () => false,
  );
}

const filtros: { id: "todas" | Servico; rotulo: string }[] = [
  { id: "todas", rotulo: "Todas" },
  { id: "banho-tosa", rotulo: "Banho & tosa" },
  { id: "loja", rotulo: "Lojas" },
  { id: "spa", rotulo: "Spa" },
  { id: "taxi-dog", rotulo: "Táxi Dog" },
];

const regioes: Loja["regiao"][] = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];

// distância angular aproximada (graus) entre duas unidades
const distancia = (a: Loja, b: Loja) => {
  const dLat = a.lat - b.lat;
  const dLng = (a.lng - b.lng) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  return Math.hypot(dLat, dLng);
};

/** Rotas de Táxi Dog: cada unidade com Táxi Dog liga às até 2 vizinhas com Táxi Dog a menos de ~7°. */
function calcularRotas() {
  const comTaxi = lojas.filter((l) => l.servicos.includes("taxi-dog"));
  const vistas = new Set<string>();
  const rotas: [Loja, Loja][] = [];
  for (const a of comTaxi) {
    const perto = comTaxi.filter((b) => b !== a && distancia(a, b) < 7).sort((x, y) => distancia(a, x) - distancia(a, y)).slice(0, 2);
    for (const b of perto) {
      const chave = [a.id, b.id].sort().join("|");
      if (!vistas.has(chave)) {
        vistas.add(chave);
        rotas.push([a, b]);
      }
    }
  }
  return rotas;
}

const rotas = calcularRotas(); // dados fixos: calculadas uma vez

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Lojas() {
  const secao = useRef<HTMLElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const [perto, setPerto] = useState(false);
  const [filtro, setFiltro] = useState<(typeof filtros)[number]["id"]>("todas");
  const [selecionada, setSelecionada] = useState<Loja | null>(null);
  const [busca, setBusca] = useState("");
  const celular = useMidia("(max-width: 768px)");
  const quieto = useMidia("(prefers-reduced-motion: reduce)");


  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setPerto(true), { rootMargin: "800px 0px" });
    if (secao.current) io.observe(secao.current);
    return () => io.disconnect();
  }, []);

  const filtradas = useMemo(() => lojas.filter((l) => filtro === "todas" || l.servicos.includes(filtro)), [filtro]);
  const visiveis = useMemo(() => new Set(filtradas.map((l) => l.id)), [filtradas]);
  const naLista = filtradas.filter((l) => {
    const q = normalizar(busca.trim());
    return !q || normalizar(`${l.cidade} ${l.uf} ${l.nome}`).includes(q);
  });

  const escolher = (l: Loja) => {
    setSelecionada(l);
    dialogo.current?.close();
  };

  return (
    <section
      ref={secao}
      id="lojas"
      data-tema="agua"
      aria-labelledby="titulo-lojas"
      className="relative z-10 overflow-hidden bg-[linear-gradient(#2e7a72,#1d5554)] text-papel md:motion-safe:-mt-[80svh] md:motion-safe:bg-none"
    >
      <div className="relative h-[100svh] min-h-[640px]">
        <div className="relative z-10 px-5 pt-[14svh] md:px-[6vw] md:pt-[12svh]">
          <h2 id="titulo-lojas" className="text-[clamp(3rem,7.6vw,7.5rem)] leading-[0.95] tracking-[-0.02em] max-md:text-balance">
            Patinha após patinha
          </h2>
          <p className="mt-5 max-w-[34ch] text-lead text-papel-suave">
            A Íris está em todo o Brasil: {lojas.length} unidades. Arraste o globo para explorar.
          </p>
          <button
            type="button"
            onClick={() => dialogo.current?.showModal()}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md border border-papel/40 px-4 font-mono text-[0.8125rem] uppercase [font-stretch:87.5%] transition-colors hover:bg-papel/10"
          >
            Ver em lista
          </button>
        </div>

        {/* o globo ocupa a metade de baixo, como um horizonte */}
        <div className="absolute inset-x-0 bottom-0 h-[64%] max-md:h-[58%]">
          {perto && (
            <Globo
              lojas={lojas}
              visiveis={visiveis}
              rotas={rotas}
              mostrarRotas={filtro === "todas" || filtro === "taxi-dog"}
              selecionada={selecionada}
              aoEscolher={setSelecionada}
              quieto={quieto}
              celular={celular}
            />
          )}
        </div>

        {/* filtros em pílula */}
        <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center px-4 md:bottom-8">
          <div role="group" aria-label="Filtrar unidades por serviço" className="flex max-w-full gap-1 overflow-x-auto rounded-md bg-papel p-1 shadow-[0_10px_30px_-12px_rgb(12_40_41/0.6)]">
            {filtros.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filtro === f.id}
                onClick={() => setFiltro(f.id)}
                className={`min-h-9 shrink-0 rounded-[4px] px-2 font-mono text-[0.6875rem] uppercase md:text-[0.75rem] [font-stretch:87.5%] transition-colors duration-200 md:px-4 ${filtro === f.id ? "bg-tinta text-papel" : "text-tinta hover:bg-creme"}`}
              >
                {f.rotulo}
              </button>
            ))}
          </div>
        </div>

        {/* card da unidade escolhida */}
        {selecionada && (
          <article
            aria-live="polite"
            aria-labelledby="loja-nome"
            className="absolute right-[6vw] bottom-28 z-20 w-[min(360px,calc(100vw-2.5rem))] bg-papel p-6 text-tinta shadow-[0_24px_60px_-24px_rgb(12_40_41/0.7)] max-md:right-5 max-md:bottom-24"
          >
            <button
              type="button"
              onClick={() => setSelecionada(null)}
              aria-label="Fechar"
              className="absolute top-2 right-2 grid size-10 place-items-center rounded-md text-tinta-suave hover:bg-creme"
            >
              <X size={18} aria-hidden />
            </button>
            <Etiqueta className="bg-creme">{selecionada.regiao}</Etiqueta>
            <h3 id="loja-nome" className="mt-3 text-[2rem] leading-[1.05]">
              {selecionada.nome}
            </h3>
            <p className="mt-2 flex items-start gap-1.5 text-corpo text-tinta-suave">
              <MapPin size={18} weight="light" className="mt-0.5 shrink-0" aria-hidden />
              {selecionada.endereco} · {selecionada.cidade}, {selecionada.uf}
            </p>
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Serviços">
              {selecionada.servicos.map((s) => (
                <li key={s} className="rounded-full border border-tinta/15 px-2.5 py-0.5 text-[0.875rem]">
                  {nomesServico[s]}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-corpo">{selecionada.horario}</p>
            <p className="mt-1 flex items-center gap-1 text-corpo">
              <Star size={16} weight="fill" className="text-[#b98a2e]" aria-hidden />
              {selecionada.nota.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
              <span className="text-tinta-suave">de 5</span>
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Botao href="#agendar">Agendar</Botao>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selecionada.lat},${selecionada.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center px-2 font-mono text-[0.8125rem] uppercase underline decoration-tinta/30 underline-offset-4 [font-stretch:87.5%] hover:decoration-tinta"
              >
                Como chegar
              </a>
            </div>
          </article>
        )}
      </div>

      {/* a lista: o caminho acessível (teclado e leitor de tela) para as mesmas unidades */}
      <dialog
        ref={dialogo}
        aria-labelledby="lista-titulo"
        className="m-auto max-h-[85svh] w-[min(560px,calc(100vw-2rem))] overflow-hidden rounded-[10px] bg-papel p-0 text-tinta backdrop:bg-abismo/70"
      >
        <div className="flex max-h-[85svh] flex-col">
          <div className="border-b border-tinta/10 p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 id="lista-titulo" className="text-[2rem] leading-none">
                Unidades Íris
              </h2>
              <button
                type="button"
                onClick={() => dialogo.current?.close()}
                aria-label="Fechar a lista"
                className="grid size-10 shrink-0 place-items-center rounded-md hover:bg-creme"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <label htmlFor="busca-cidade" className="mt-5 block font-mono text-rotulo uppercase [font-stretch:87.5%]">
              Buscar por cidade
            </label>
            <input
              id="busca-cidade"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex.: Recife"
              className="mt-2 min-h-11 w-full rounded-md border border-tinta/25 bg-papel px-3 text-corpo"
            />
            <p className="mt-2 text-[0.875rem] text-tinta-suave" aria-live="polite">
              {naLista.length} {naLista.length === 1 ? "unidade" : "unidades"}
              {filtro !== "todas" && ` com ${filtros.find((f) => f.id === filtro)?.rotulo}`}
            </p>
          </div>
          <div className="overflow-y-auto p-6 pt-2">
            {regioes.map((r) => {
              const daRegiao = naLista.filter((l) => l.regiao === r);
              if (!daRegiao.length) return null;
              return (
                <section key={r} aria-labelledby={`regiao-${r}`} className="mt-4">
                  <h3 id={`regiao-${r}`} className="font-mono text-rotulo text-tinta-suave uppercase [font-stretch:87.5%]">
                    {r}
                  </h3>
                  <ul className="mt-2 divide-y divide-tinta/10">
                    {daRegiao.map((l) => (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => escolher(l)}
                          className="flex min-h-11 w-full items-baseline justify-between gap-4 py-2 text-left hover:text-acao"
                        >
                          <span className="text-corpo">{l.nome}</span>
                          <span className="shrink-0 text-[0.875rem] text-tinta-suave">
                            {l.cidade}, {l.uf}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </dialog>
    </section>
  );
}
