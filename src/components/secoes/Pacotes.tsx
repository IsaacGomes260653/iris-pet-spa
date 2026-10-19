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
const rotulo = "font-mono text-[0.6875rem] uppercase [font-stretch:87.5%] whitespace-nowrap text-tinta-suave";

/**
 * A moldura acompanha o cursor de leve e inclina em 3D; a foto cresce dentro dela conforme o cursor se aproxima (a
 * moldura não muda de tamanho, então nunca encosta no texto). No toque, o efeito acontece enquanto o dedo está na foto.
 * Com movimento reduzido — ou com os detalhes abertos —, nada se mexe.
 */
function useInclinacao(moldura: RefObject<HTMLElement | null>, zoom: RefObject<HTMLElement | null>, desligado: boolean) {
  useEffect(() => {
    const el = moldura.current;
    const z = zoom.current;
    if (!el || !z || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const atual = { x: 0, y: 0, s: 0 };
    const meta = { x: 0, y: 0, s: 0 };
    let raf = 0;
    let antes = 0;
    let visivel = false;
    const passo = (agora: number) => {
      raf = 0;
      // suavização por tempo: a mesma velocidade a 60 Hz ou a 120 Hz
      const k = 1 - Math.pow(0.88, Math.min(4, (agora - (antes || agora - 16.7)) / 16.7));
      antes = agora;
      let parado = true;
      for (const c of ["x", "y", "s"] as const) {
        atual[c] += (meta[c] - atual[c]) * k;
        if (Math.abs(meta[c] - atual[c]) > 0.0005) parado = false;
        else atual[c] = meta[c];
      }
      el.style.transform = `perspective(1400px) translate3d(${(atual.x * 4).toFixed(2)}px, ${(atual.y * 4).toFixed(2)}px, 0) rotateX(${(-atual.y * 2).toFixed(3)}deg) rotateY(${(atual.x * 2).toFixed(3)}deg)`;
      z.style.transform = `scale(${(1 + atual.s * 0.06).toFixed(4)})`;
      if (parado) antes = 0;
      else raf = requestAnimationFrame(passo);
    };
    const pedir = () => (raf ||= requestAnimationFrame(passo));
    const zerar = () => {
      meta.x = meta.y = meta.s = 0;
      pedir();
    };
    if (desligado) {
      zerar();
      return () => cancelAnimationFrame(raf);
    }
    const mirar = (e: PointerEvent, perto: number) => {
      const r = el.getBoundingClientRect();
      meta.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2))) * perto;
      meta.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2))) * perto;
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
      if (e.pointerType !== "mouse") zerar();
    };
    const io = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (!visivel) zerar();
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
  }, [moldura, zoom, desligado]);
}

/** Frequência curta para a etiqueta do hover: "cada 30–45 dias". */
const curta = (p: Pacote) => `${p.duracao} · ${p.frequencia.replace("A cada ", "cada ").replace(" a ", "–")}`;

/** Tudo o que o pacote inclui, em três colunas no desktop: o que inclui | preço por porte e rotina | adicionais. */
function Detalhes({ p }: { p: Pacote }) {
  const linha = "flex items-baseline justify-between gap-3 border-b border-tinta/12 py-2";
  return (
    <div className="grid gap-8 md:grid-cols-3 md:gap-10">
      <div>
        <h4 className={rotulo}>Inclui</h4>
        <ul className="mt-1">
          {p.inclui.map((item) => (
            <li key={item} className="flex gap-2 border-b border-tinta/12 py-2 text-[0.9375rem] leading-snug">
              <Check size={16} weight="bold" aria-hidden className="mt-0.5 shrink-0 text-agua-funda" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className={rotulo}>Por porte</h4>
        <dl className="mt-1">
          {(["P", "M", "G"] as const).map((porte) => (
            <div key={porte} className={linha}>
              <dt className="text-[0.9375rem]">Porte {porte}</dt>
              <dd className="font-serifa text-[1.25rem] font-extralight whitespace-nowrap">{real(p.precos[porte])}</dd>
            </div>
          ))}
        </dl>
        <dl className="mt-5 grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-2 text-[0.9375rem] leading-snug">
          <dt className={rotulo}>Duração média</dt>
          <dd>{p.duracao}</dd>
          <dt className={rotulo}>Indicado para</dt>
          <dd>{p.indicado}</dd>
          <dt className={rotulo}>Frequência</dt>
          <dd>{p.frequencia}</dd>
        </dl>
      </div>
      <div>
        <h4 className={rotulo}>Adicionais</h4>
        <ul className="mt-1">
          {p.adicionais.map((a) => (
            <li key={a.nome} className={linha}>
              <span className="text-[0.9375rem]">{a.nome}</span>
              <span className="font-serifa text-[1.25rem] font-extralight whitespace-nowrap">+ {real(a.preco)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Um pacote: foto com o efeito de cursor, a etiqueta do hover e o botão que abre os detalhes abaixo das fotos. */
function CartaoPacote({
  p,
  i,
  foto,
  aberto,
  outroAberto,
  aoAbrir,
}: {
  p: Pacote;
  i: number;
  foto: (el: HTMLDivElement | null) => void;
  aberto: boolean;
  outroAberto: boolean;
  aoAbrir: () => void;
}) {
  const moldura = useRef<HTMLDivElement>(null);
  const zoom = useRef<HTMLDivElement>(null);
  useInclinacao(moldura, zoom, aberto);
  return (
    <li
      data-pacote={i}
      className={`group w-[76vw] shrink-0 snap-start transition-opacity duration-300 md:w-auto ${i === 1 ? "md:mt-12" : i === 2 ? "md:mt-6" : ""} ${outroAberto ? "md:opacity-55" : ""}`}
    >
      <div ref={moldura} className="relative aspect-[3/4] overflow-hidden rounded-[10px] will-change-transform">
        <div ref={foto} className="absolute inset-x-0 -top-[8%] h-[116%]">
          <div ref={zoom} className="absolute inset-0 will-change-transform">
            <Image src={p.foto} alt={p.alt} fill sizes="(max-width: 768px) 76vw, 30vw" className="object-cover" />
          </div>
        </div>
        <Etiqueta className="absolute top-0 right-0 max-md:text-[0.6875rem]">{p.nome}</Etiqueta>
        {/* ao passar o mouse: duração e frequência numa etiqueta de canto vivo (o preço já está logo abaixo) */}
        <p
          aria-hidden
          className="pointer-events-none absolute bottom-3 left-3 hidden translate-y-1 bg-papel px-3 py-2 font-mono text-[0.6875rem] uppercase [font-stretch:87.5%] whitespace-nowrap text-tinta opacity-0 transition-[opacity,translate] duration-300 ease-saida [@media(hover:hover)]:block [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100"
        >
          {curta(p)}
        </p>
      </div>
      <div className="mt-4 flex min-h-[4.5rem] items-baseline justify-between gap-3">
        <p className="text-corpo">
          <span className="font-medium">{p.nome}</span>
          <span className="block text-tinta-suave">{p.frase}</span>
        </p>
        <p className="shrink-0 text-right">
          <span className={`block ${rotulo}`}>desde</span>
          <span className="font-serifa text-[1.5rem] leading-none font-extralight whitespace-nowrap">{real(p.precos.P)}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={aoAbrir}
        aria-expanded={aberto}
        aria-controls="detalhes-pacote"
        className="mt-2 flex min-h-11 w-full items-center justify-between border-t border-tinta/15 font-mono text-[0.75rem] uppercase [font-stretch:87.5%]"
      >
        {aberto ? "Fechar detalhes" : "Ver detalhes"}
        <Plus size={16} aria-hidden className={`transition-transform duration-300 ${aberto ? "rotate-45" : ""}`} />
      </button>
    </li>
  );
}

export function Pacotes() {
  const secao = useRef<HTMLElement>(null);
  const fotos = useRef<(HTMLDivElement | null)[]>([]);
  const trilho = useRef<HTMLUListElement>(null);
  // um pacote "ativo" para tudo: o card dos detalhes, o card visível no carrossel do celular e a aba da ficha
  const [ativo, setAtivo] = useState(1);
  const [aberto, setAberto] = useState(false);
  const painel = useRef<HTMLDivElement>(null);

  // ao abrir, o painel entra na tela se tiver ficado lá embaixo (sem animação para quem prefere menos movimento)
  useEffect(() => {
    const el = painel.current;
    if (!aberto || !el) return;
    const id = setTimeout(() => {
      const topo = el.getBoundingClientRect().top;
      if (topo > innerHeight * 0.75) {
        const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
        scrollTo({ top: scrollY + topo - innerHeight * 0.15, behavior: quieto ? "auto" : "smooth" });
      }
    }, 80);
    return () => clearTimeout(id);
  }, [aberto, ativo]);

  const montar = useCallback<Parameters<typeof useAnimacaoPerto>[1]>((gsap) => {
    fotos.current.forEach((f, i) => {
      if (!f) return;
      gsap.fromTo(f, { yPercent: deslocamento[i] }, { yPercent: -deslocamento[i], ease: "none", scrollTrigger: { trigger: f.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }, []);
  useAnimacaoPerto(secao, montar);

  // celular: o card que está na tela vira o ativo (o painel e a aba acompanham o deslize)
  useEffect(() => {
    const ul = trilho.current;
    if (!ul || !matchMedia("(max-width: 768px)").matches) return;
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) setAtivo(Number((e.target as HTMLElement).dataset.pacote));
      },
      { root: ul, threshold: 0.6 },
    );
    ul.querySelectorAll("[data-pacote]").forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, []);

  const p = pacotes[ativo];
  return (
    <section ref={secao} id="pacotes" data-tema="creme" aria-labelledby="titulo-pacotes" className="relative z-10 px-5 pt-[18svh] pb-[16svh] md:px-[6vw]">
      <Rotulo numero={indice.pacotes}>Pacotes</Rotulo>
      <h2 id="titulo-pacotes" className="mt-6 max-w-[14ch] text-titulo">
        Um cuidado para cada pelagem.
      </h2>

      {/* abertura: as três fotos sobem em velocidades diferentes e respondem ao cursor */}
      <ul ref={trilho} className="mt-14 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-2 [scrollbar-width:none] max-md:[mask-image:linear-gradient(to_left,transparent_0,#000_32px)] max-md:-mx-5 max-md:scroll-px-5 max-md:px-5 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {pacotes.map((pac, i) => (
          <CartaoPacote
            key={pac.id}
            p={pac}
            i={i}
            foto={(el) => void (fotos.current[i] = el)}
            aberto={aberto && ativo === i}
            outroAberto={aberto && ativo !== i}
            aoAbrir={() => {
              setAberto(!(aberto && ativo === i));
              setAtivo(i);
            }}
          />
        ))}
      </ul>

      {/* os detalhes: um painel só, de largura total, abaixo das fotos (a altura anima ao abrir) */}
      <div
        id="detalhes-pacote"
        role="region"
        aria-label={`Detalhes do ${p.nome}`}
        inert={!aberto}
        className={`grid transition-[grid-template-rows] duration-500 ease-saida motion-reduce:transition-none ${aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div ref={painel} className="mt-3 border-t border-tinta/15 pt-4 pb-2 md:mt-6 md:pt-5">
            <p className="font-serifa text-[1.75rem] leading-tight font-extralight max-md:hidden">{p.nome}</p>
            <p className={`${rotulo} md:hidden`}>
              {p.curto} · {ativo + 1} / {pacotes.length}
            </p>
            <div className="mt-4 md:mt-5">
              <Detalhes p={p} />
            </div>
          </div>
        </div>
      </div>

      {/* ficha técnica */}
      <div className="mt-[6svh] md:mt-[14svh]">
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
                aria-selected={ativo === i}
                aria-controls={`painel-${p.id}`}
                onClick={() => setAtivo(i)}
                className={`min-h-11 flex-1 rounded-md px-1 font-mono text-[0.6875rem] uppercase [font-stretch:87.5%] ${ativo === i ? "bg-[#0c2829] text-creme" : "text-tinta"}`}
              >
                {p.curto}
              </button>
            ))}
          </div>
          {pacotes.map((p, i) => (
            <div key={p.id} role="tabpanel" id={`painel-${p.id}`} aria-labelledby={`aba-${p.id}`} hidden={ativo !== i} className="mt-4">
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
