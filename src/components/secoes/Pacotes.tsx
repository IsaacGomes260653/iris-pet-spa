"use client";

import { Check, Plus } from "@phosphor-icons/react";
import Image from "next/image";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { useAnimacaoPerto } from "@/components/useAnimacaoPerto";
import { Etiqueta } from "@/components/ui";
import { ficha, indice, type Pacote, pacotes } from "@/content/secoes";
import { Rotulo } from "./Rotulo";

// cabeçalhos neutros; só o pacote mais completo ganha o verde-água
const cabecalho = ["bg-papel", "bg-papel", "bg-[linear-gradient(160deg,#2e7a72,#1d5554)]"];
const textoCabecalho = ["text-tinta", "text-tinta", "text-papel"];
// parallax só dentro da moldura (a foto tem 16% de folga): velocidades diferentes, a do meio mais rápida
const deslocamento = [4, 7, 5];

const real = (v: number) => `R$ ${v}`;

/**
 * A foto acompanha o cursor de leve, cresce conforme ele se aproxima e inclina em 3D. No toque, o efeito acontece
 * enquanto o dedo está na foto. Com movimento reduzido, nada se mexe.
 */
function useInclinacao(alvo: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = alvo.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const atual = { x: 0, y: 0, s: 0 };
    const meta = { x: 0, y: 0, s: 0 };
    let raf = 0;
    let visivel = false;
    const passo = () => {
      raf = 0;
      let parado = true;
      for (const k of ["x", "y", "s"] as const) {
        atual[k] += (meta[k] - atual[k]) * 0.12;
        if (Math.abs(meta[k] - atual[k]) > 0.001) parado = false;
      }
      el.style.transform = `perspective(900px) translate3d(${(atual.x * 8).toFixed(2)}px, ${(atual.y * 8).toFixed(2)}px, 0) rotateX(${(-atual.y * 5).toFixed(2)}deg) rotateY(${(atual.x * 5).toFixed(2)}deg) scale(${(1 + atual.s * 0.045).toFixed(4)})`;
      if (!parado) raf = requestAnimationFrame(passo);
    };
    const pedir = () => (raf ||= requestAnimationFrame(passo));
    const mirar = (e: PointerEvent, perto: number) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      meta.x = Math.max(-1, Math.min(1, dx)) * perto;
      meta.y = Math.max(-1, Math.min(1, dy)) * perto;
      meta.s = perto;
      pedir();
    };
    // mouse: a proximidade vem da distância até o centro da foto (some a ~1 largura de distância)
    const mover = (e: PointerEvent) => {
      if (!visivel || e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      const d = Math.hypot((e.clientX - (r.left + r.width / 2)) / r.width, (e.clientY - (r.top + r.height / 2)) / r.height);
      const t = Math.min(1, Math.max(0, (d - 0.35) / 0.75));
      mirar(e, 1 - t * t * (3 - 2 * t));
    };
    const tocar = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") mirar(e, 1);
    };
    const soltar = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      meta.x = meta.y = meta.s = 0;
      pedir();
    };
    const io = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (!visivel) {
        meta.x = meta.y = meta.s = 0;
        pedir();
      }
    });
    io.observe(el);
    addEventListener("pointermove", mover, { passive: true });
    el.addEventListener("pointerdown", tocar);
    addEventListener("pointerup", soltar);
    addEventListener("pointercancel", soltar);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", mover);
      el.removeEventListener("pointerdown", tocar);
      removeEventListener("pointerup", soltar);
      removeEventListener("pointercancel", soltar);
    };
  }, [alvo]);
}

/** Um pacote: foto com o efeito de cursor, o resumo ao passar o mouse e os detalhes num acordeão. */
function CartaoPacote({ p, i, foto }: { p: Pacote; i: number; foto: (el: HTMLDivElement | null) => void }) {
  const moldura = useRef<HTMLDivElement>(null);
  useInclinacao(moldura);
  return (
    <li className={`group w-[76vw] shrink-0 snap-start md:w-auto ${i === 1 ? "md:mt-24" : i === 2 ? "md:mt-10" : ""}`}>
      <div ref={moldura} className="relative aspect-[3/4] overflow-hidden rounded-[10px] will-change-transform">
        <div ref={foto} className="absolute inset-x-0 -top-[8%] h-[116%]">
          <Image src={p.foto} alt={p.alt} fill sizes="(max-width: 768px) 76vw, 30vw" className="object-cover" />
        </div>
        <Etiqueta className="absolute top-0 right-0 max-md:hidden">{p.nome}</Etiqueta>
        {/* resumo ao passar o mouse (ou ao focar o card pelo teclado); o texto completo está nos detalhes */}
        <dl
          aria-hidden
          className="pointer-events-none absolute inset-x-3 bottom-3 grid translate-y-2 grid-cols-3 gap-px overflow-hidden rounded-[8px] bg-tinta/10 opacity-0 transition-[opacity,translate] duration-300 ease-saida group-focus-within:translate-y-0 group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100"
        >
          {[
            ["Duração", p.duracao],
            ["A partir de", real(p.precos.P)],
            ["Frequência", p.frequencia.replace("A cada ", "")],
          ].map(([k, v]) => (
            <div key={k} className="bg-papel/92 px-3 py-2.5 backdrop-blur-sm">
              <dt className="font-mono text-[0.625rem] uppercase [font-stretch:87.5%] text-tinta-suave">{k}</dt>
              <dd className="mt-0.5 text-[0.9375rem] leading-tight text-tinta">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="text-corpo">
          <span className="font-medium">{p.nome}</span>
          <span className="block text-tinta-suave">{p.frase}</span>
        </p>
        <p className="shrink-0 text-right">
          <span className="block font-mono text-[0.625rem] uppercase [font-stretch:87.5%] text-tinta-suave">a partir de</span>
          <span className="font-serifa text-[1.5rem] leading-none font-extralight">{real(p.precos.P)}</span>
        </p>
      </div>
      {/* detalhes: um aberto por vez (name), abre ao clicar e a altura anima */}
      <details name="pacote" className="detalhes-pacote group/detalhes mt-3 border-t border-tinta/15">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-mono text-[0.75rem] uppercase [font-stretch:87.5%] [&::-webkit-details-marker]:hidden">
          Ver detalhes
          <Plus size={16} aria-hidden className="transition-transform duration-300 group-open/detalhes:rotate-45" />
        </summary>
        <div className="grid gap-5 pt-2 pb-4">
          <div>
            <h4 className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-tinta-suave">Inclui</h4>
            <ul className="mt-2 grid gap-1.5">
              {p.inclui.map((item) => (
                <li key={item} className="flex gap-2 text-[0.9375rem] leading-snug">
                  <Check size={16} weight="bold" aria-hidden className="mt-0.5 shrink-0 text-agua-funda" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-tinta-suave">A partir de, por porte</h4>
            <dl className="mt-2 grid grid-cols-3 gap-px overflow-hidden rounded-[8px] bg-tinta/12">
              {(["P", "M", "G"] as const).map((porte) => (
                <div key={porte} className="bg-papel px-3 py-2">
                  <dt className="font-mono text-[0.6875rem] uppercase [font-stretch:87.5%] text-tinta-suave">Porte {porte}</dt>
                  <dd className="font-serifa text-[1.25rem] font-extralight">{real(p.precos[porte])}</dd>
                </div>
              ))}
            </dl>
          </div>
          <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-2 text-[0.9375rem] leading-snug">
            <dt className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-tinta-suave">Duração média</dt>
            <dd>{p.duracao}</dd>
            <dt className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-tinta-suave">Indicado para</dt>
            <dd>{p.indicado}</dd>
            <dt className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-tinta-suave">Frequência</dt>
            <dd>{p.frequencia}</dd>
          </dl>
          <div>
            <h4 className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-tinta-suave">Adicionais</h4>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {p.adicionais.map((a) => (
                <li key={a.nome} className="rounded-md border border-tinta/15 px-2.5 py-1 text-[0.875rem]">
                  {a.nome} <span className="text-tinta-suave">+{real(a.preco)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </li>
  );
}

export function Pacotes() {
  const secao = useRef<HTMLElement>(null);
  const fotos = useRef<(HTMLDivElement | null)[]>([]);
  const [aba, setAba] = useState(1);

  const montar = useCallback<Parameters<typeof useAnimacaoPerto>[1]>((gsap) => {
    fotos.current.forEach((f, i) => {
      if (!f) return;
      gsap.fromTo(f, { yPercent: deslocamento[i] }, { yPercent: -deslocamento[i], ease: "none", scrollTrigger: { trigger: f.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }, []);
  useAnimacaoPerto(secao, montar);

  return (
    <section ref={secao} id="pacotes" data-tema="creme" aria-labelledby="titulo-pacotes" className="relative z-10 px-5 pt-[18svh] pb-[16svh] md:px-[6vw]">
      <Rotulo numero={indice.pacotes}>Pacotes</Rotulo>
      <h2 id="titulo-pacotes" className="mt-6 max-w-[14ch] text-titulo">
        Um cuidado para cada pelagem.
      </h2>

      {/* abertura: as três fotos sobem em velocidades diferentes e respondem ao cursor */}
      <ul className="mt-14 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-2 [scrollbar-width:none] max-md:-mx-5 max-md:scroll-px-5 max-md:px-5 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {pacotes.map((p, i) => (
          <CartaoPacote key={p.id} p={p} i={i} foto={(el) => void (fotos.current[i] = el)} />
        ))}
      </ul>

      {/* ficha técnica */}
      <div className="mt-[10svh] md:mt-[14svh]">
        <Rotulo numero={indice.pacotes}>Ficha técnica</Rotulo>
        <h3 className="mt-5 text-[clamp(2rem,3.4vw,3.25rem)] leading-[1.05]">Lado a lado</h3>

        {/* desktop: tabela */}
        <table className="mt-8 w-full table-fixed border-collapse overflow-hidden rounded-[10px] bg-[#fffdf9] text-left max-md:hidden">
          <caption className="sr-only">Comparativo dos pacotes de banho</caption>
          <colgroup>
            <col className="w-[220px]" />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" />
              {pacotes.map((p, i) => (
                <th key={p.id} scope="col" className={`${cabecalho[i]} ${textoCabecalho[i]} ${i === 0 ? "rounded-tl-[10px]" : ""} ${i === 2 ? "rounded-tr-[10px]" : ""} p-5 align-bottom font-normal`}>
                  {i === 2 && <span className="mb-3 inline-block bg-papel px-2 py-1 font-mono text-rotulo uppercase text-tinta [font-stretch:87.5%]">Mais completo</span>}
                  <span className="block font-serifa text-[1.75rem] leading-tight font-extralight">{p.nome}</span>
                  <span className="mt-1 block text-[0.9375rem] opacity-85">{p.frase}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ficha.map((linha) => (
              <tr key={linha.item} className="border-b border-tinta/12">
                <th scope="row" className="py-4 pr-4 font-mono text-rotulo font-normal uppercase [font-stretch:87.5%] text-tinta-suave">
                  {linha.item}
                </th>
                {linha.valores.map((v, i) => (
                  <td key={i} className={`px-5 py-4 text-corpo ${i === 2 ? "bg-[#e3efea]" : ""} ${linha.item === "A partir de" ? "font-serifa text-[1.75rem] font-extralight" : ""}`}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* celular: abas, uma coluna por vez */}
        <div className="mt-6 md:hidden">
          <div role="tablist" aria-label="Pacotes" className="flex gap-1 rounded-[14px] bg-papel p-1">
            {pacotes.map((p, i) => (
              <button
                key={p.id}
                role="tab"
                id={`aba-${p.id}`}
                aria-selected={aba === i}
                aria-controls={`painel-${p.id}`}
                onClick={() => setAba(i)}
                className={`min-h-11 flex-1 rounded-md px-1 font-mono text-[0.6875rem] uppercase [font-stretch:87.5%] ${aba === i ? "bg-[#0c2829] text-creme" : "text-tinta"}`}
              >
                {p.curto}
              </button>
            ))}
          </div>
          {pacotes.map((p, i) => (
            <div key={p.id} role="tabpanel" id={`painel-${p.id}`} aria-labelledby={`aba-${p.id}`} hidden={aba !== i} className="mt-4">
              <div className={`${cabecalho[i]} ${textoCabecalho[i]} rounded-[10px] border border-tinta/10 p-5`}>
                <p className="font-serifa text-[1.75rem] leading-tight font-extralight">{p.nome}</p>
                <p className="mt-1 text-[0.9375rem] opacity-85">{p.frase}</p>
              </div>
              <dl className="mt-2">
                {ficha.map((linha) => (
                  <div key={linha.item} className="grid grid-cols-[8.5rem_1fr] items-baseline gap-3 border-b border-tinta/12 py-3">
                    <dt className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-tinta-suave">{linha.item}</dt>
                    <dd className={linha.item === "A partir de" ? "font-serifa text-[1.75rem] font-extralight" : "text-corpo"}>{linha.valores[i]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
