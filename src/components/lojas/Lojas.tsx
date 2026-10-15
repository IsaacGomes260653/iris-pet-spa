"use client";

import { CaretRight, MapPin, Star, X } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMidia } from "@/components/useMidia";
import { Botao } from "@/components/ui";
import { lojas, nomesServico, type Loja, type Servico } from "@/content/lojas";
import type { Grupo } from "./Globo";

// o globo (three.js) só baixa quando a seção chega perto
const Globo = dynamic(() => import("./Globo"), { ssr: false });

const filtros: { id: "todas" | Servico; rotulo: string }[] = [
  { id: "todas", rotulo: "Todas" },
  { id: "banho-tosa", rotulo: "Banho & tosa" },
  { id: "loja", rotulo: "Lojas" },
  { id: "spa", rotulo: "Spa" },
  { id: "taxi-dog", rotulo: "Táxi Dog" },
];

const regioes: Loja["regiao"][] = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];

// distância angular aproximada (graus) entre dois pontos
const distancia = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
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

/**
 * Unidades próximas viram um marcador só, com a contagem: a ~4,5° os anéis já se tocam na tela, no desktop e no
 * celular. Começa pelas cidades com mais vizinhas, para São Paulo, Rio e BH puxarem as do entorno.
 */
function agrupar(): Grupo[] {
  const peso = (l: Loja) => lojas.filter((o) => distancia(o, l) < 4.5).length;
  const livres = [...lojas].sort((a, b) => peso(b) - peso(a));
  const grupos: Grupo[] = [];
  while (livres.length) {
    const semente = livres.shift()!;
    const membros = [semente, ...livres.filter((l) => distancia(semente, l) < 4.5)];
    for (const m of membros.slice(1)) livres.splice(livres.indexOf(m), 1);
    const lat = membros.reduce((s, l) => s + l.lat, 0) / membros.length;
    const lng = membros.reduce((s, l) => s + l.lng, 0) / membros.length;
    grupos.push({ id: semente.id, lat, lng, membros });
  }
  return grupos;
}

// dados fixos: calculados uma vez. Rotas dentro de um mesmo grupo viram rabisco: ficam só as que ligam grupos
const grupos = agrupar();
const grupoDe = (l: Loja) => grupos.find((g) => g.membros.includes(l));
const rotas = calcularRotas().filter(([a, b]) => grupoDe(a) !== grupoDe(b));

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Lojas() {
  const secao = useRef<HTMLElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const [perto, setPerto] = useState(false);
  const [filtro, setFiltro] = useState<(typeof filtros)[number]["id"]>("todas");
  const [selecionada, setSelecionada] = useState<Loja | null>(null);
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [busca, setBusca] = useState("");
  const [listaAberta, setListaAberta] = useState(false);
  const celular = useMidia("(max-width: 768px)");
  const quieto = useMidia("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setPerto(true), { rootMargin: "800px 0px" });
    if (secao.current) io.observe(secao.current);
    return () => io.disconnect();
  }, []);

  const filtradas = useMemo(() => lojas.filter((l) => filtro === "todas" || l.servicos.includes(filtro)), [filtro]);
  const ativos = useMemo(() => new Set(filtradas.map((l) => l.id)), [filtradas]);
  const naLista = filtradas.filter((l) => {
    if (grupo && !grupo.membros.includes(l)) return false;
    const q = normalizar(busca.trim());
    return !q || normalizar(`${l.cidade} ${l.uf} ${l.nome}`).includes(q);
  });
  const rotuloFiltro = filtros.find((f) => f.id === filtro)!.rotulo;

  const abrirLista = (g: Grupo | null) => {
    setGrupo(g);
    setBusca("");
    setListaAberta(true);
    dialogo.current?.showModal();
  };
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
          <p className="mt-7 max-w-[34ch] text-[1.125rem] leading-[1.45] text-papel-suave md:text-[1.375rem]">
            A Íris está em todo o Brasil: {lojas.length} unidades. Arraste o globo para explorar.
          </p>
          <button
            type="button"
            onClick={() => abrirLista(null)}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md border border-papel/40 px-4 font-mono text-[0.8125rem] uppercase [font-stretch:87.5%] transition-colors hover:bg-papel/10"
          >
            Ver em lista
          </button>
        </div>

        {/* o globo ocupa a metade de baixo, como um horizonte */}
        <div className="absolute inset-x-0 bottom-0 h-[64%] max-md:h-[58%]">
          {perto && (
            <Globo
              grupos={grupos}
              ativos={ativos}
              rotas={rotas}
              rotasFortes={filtro === "todas" || filtro === "taxi-dog"}
              selecionada={selecionada}
              aoEscolher={(l) => setSelecionada(l)}
              aoEscolherGrupo={(g) => abrirLista(g)}
              quieto={quieto}
              celular={celular}
            />
          )}
        </div>

        {/* filtros em pílula, com a contagem do que está aceso */}
        <div
          inert={listaAberta || (celular && !!selecionada)}
          className={`absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2 px-4 transition-opacity md:bottom-8 ${listaAberta || (celular && selecionada) ? "pointer-events-none opacity-0" : ""}`}
        >
          <p className="rounded-md bg-[#0c2829]/90 px-2 py-1 font-mono text-rotulo uppercase [font-stretch:87.5%] text-papel" aria-live="polite">
            {filtro === "todas" ? `${lojas.length} unidades` : `${filtradas.length} unidades com ${rotuloFiltro}`}
          </p>
          <div role="group" aria-label="Filtrar unidades por serviço" className="flex max-w-full gap-1 overflow-x-auto rounded-[14px] bg-papel p-1 shadow-[0_10px_30px_-12px_rgb(12_40_41/0.6)]">
            {filtros.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filtro === f.id}
                onClick={() => setFiltro(f.id)}
                className={`min-h-11 shrink-0 rounded-md px-2 font-mono text-[0.6875rem] uppercase [font-stretch:87.5%] transition-colors duration-200 md:min-h-9 md:px-4 md:text-[0.75rem] ${filtro === f.id ? "bg-[#0c2829] text-creme" : "text-tinta hover:bg-creme"}`}
              >
                {f.rotulo}
              </button>
            ))}
          </div>
        </div>

        {/* card da unidade escolhida: no celular, uma folha baixa que deixa o globo à vista */}
        {selecionada && (
          <article
            aria-live="polite"
            aria-labelledby="loja-nome"
            className="absolute right-[6vw] bottom-32 z-20 w-[360px] rounded-[14px] bg-papel p-6 text-tinta shadow-[0_24px_60px_-24px_rgb(12_40_41/0.7)] max-md:inset-x-0 max-md:right-0 max-md:bottom-0 max-md:max-h-[42svh] max-md:w-auto max-md:overflow-y-auto max-md:rounded-b-none max-md:p-5"
          >
            <button
              type="button"
              onClick={() => setSelecionada(null)}
              aria-label="Fechar"
              className="absolute top-2 right-2 grid size-11 place-items-center rounded-md text-tinta-suave hover:bg-creme"
            >
              <X size={18} aria-hidden />
            </button>
            <p className="font-mono text-rotulo text-tinta-suave uppercase [font-stretch:87.5%]">{selecionada.regiao}</p>
            <h3 id="loja-nome" className="mt-2 text-[2rem] leading-[1.05] max-md:text-[1.75rem]">
              {selecionada.nome}
            </h3>
            <p className="mt-2 flex items-start gap-1.5 text-corpo text-tinta-suave">
              <MapPin size={18} weight="light" className="mt-0.5 shrink-0" aria-hidden />
              {selecionada.endereco} · {selecionada.cidade}, {selecionada.uf}
            </p>
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Serviços">
              {selecionada.servicos.map((s) => (
                <li key={s} className="rounded-md border border-tinta/15 px-2.5 py-0.5 text-[0.875rem]">
                  {nomesServico[s]}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-corpo">
              <span>{selecionada.horario}</span>
              <span className="flex items-center gap-1">
                <Star size={16} weight="fill" className="text-agua-funda" aria-hidden />
                {selecionada.nota.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
                <span className="text-tinta-suave">de 5</span>
              </span>
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Botao href="#agendar" escuro>
                Agendar
              </Botao>
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
        onClose={() => {
          setGrupo(null);
          setListaAberta(false);
        }}
        className="mx-auto mt-[8vh] max-h-[min(720px,calc(100dvh-96px))] w-[min(560px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[14px] bg-papel p-0 text-tinta backdrop:bg-abismo/70 open:flex max-md:mt-auto max-md:mb-0 max-md:w-full max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-[20px]"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-tinta/10 p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 id="lista-titulo" className="text-[2rem] leading-none">
                {grupo ? `Perto de ${grupo.membros[0].cidade}` : "Unidades Íris"}
              </h2>
              <button
                type="button"
                onClick={() => dialogo.current?.close()}
                aria-label="Fechar a lista"
                className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-creme"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <label htmlFor="busca-cidade" className="mt-5 block font-mono text-rotulo uppercase [font-stretch:87.5%]">
              Buscar por cidade
            </label>
            <div className="relative mt-2">
              <input
                id="busca-cidade"
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Ex.: Recife"
                className="min-h-11 w-full rounded-md border border-tinta/25 bg-papel pr-12 pl-3 text-corpo [&::-webkit-search-cancel-button]:appearance-none"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  aria-label="Limpar a busca"
                  className="absolute top-0 right-0 grid size-11 place-items-center rounded-md text-tinta hover:bg-creme"
                >
                  <X size={16} aria-hidden />
                </button>
              )}
            </div>
            <p className="mt-2 text-[0.875rem] text-tinta-suave" aria-live="polite">
              {naLista.length} {naLista.length === 1 ? "unidade" : "unidades"}
              {filtro !== "todas" && ` com ${rotuloFiltro}`}
            </p>
          </div>
          <div className="relative min-h-0 flex-1">
            <div className="max-h-full overflow-y-auto px-6 pb-10">
              {naLista.length === 0 && <p className="mt-6 text-corpo text-tinta-suave">Ainda não chegamos aí. Tente uma cidade vizinha.</p>}
              {/* as ~60 linhas só existem com a lista aberta: fora do HTML inicial e da hidratação */}
              {listaAberta && regioes.map((r) => {
                const daRegiao = naLista.filter((l) => l.regiao === r);
                if (!daRegiao.length) return null;
                return (
                  <section key={r} aria-labelledby={`regiao-${r}`} className="mt-5">
                    <h3 id={`regiao-${r}`} className="font-mono text-rotulo text-tinta-suave uppercase [font-stretch:87.5%]">
                      {r}
                    </h3>
                    <ul className="mt-2 divide-y divide-tinta/10">
                      {daRegiao.map((l) => (
                        <li key={l.id}>
                          <button
                            type="button"
                            onClick={() => escolher(l)}
                            className="-mx-2 flex min-h-12 w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 text-left transition-colors hover:bg-creme"
                          >
                            <span className="flex-1">
                              <span className="block text-corpo">{l.nome}</span>
                              <span className="block text-[0.8125rem] text-tinta-suave">
                                {l.cidade}, {l.uf} · {l.servicos.map((s) => nomesServico[s]).join(" · ")}
                              </span>
                            </span>
                            <CaretRight size={16} className="shrink-0 text-tinta-suave" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
            {/* a lista continua: um esmaecido no pé avisa que dá para rolar */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-[linear-gradient(rgb(255_253_251/0),#fffdfb)]" />
          </div>
        </div>
      </dialog>
    </section>
  );
}
