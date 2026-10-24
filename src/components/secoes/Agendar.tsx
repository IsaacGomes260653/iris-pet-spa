"use client";

import Image, { getImageProps } from "next/image";
import { useCallback, useRef } from "react";
import { useAnimacaoPerto } from "@/components/useAnimacaoPerto";
import { Botao, Etiqueta } from "@/components/ui";
import fundoCelular from "@/assets/fechamento/celular.jpg";
import fundoDesktop from "@/assets/fechamento/desktop.jpg";
import { cards } from "@/content/midia";
import { indice } from "@/content/secoes";
import { Rotulo } from "./Rotulo";

// os serviços, em arco em volta do eixo do botão: os de fora mais altos e inclinados, o do meio pequeno, mais embaixo
const pecas: { card: number; classe: string }[] = [
  { card: 0, classe: "left-[5vw] bottom-[7svh] w-[min(21vw,290px)] -rotate-[4deg] max-md:left-[-5vw] max-md:bottom-[5svh] max-md:w-[40vw]" },
  { card: 8, classe: "left-1/2 bottom-[-9svh] w-[min(13vw,180px)] -translate-x-1/2 max-md:bottom-[-6svh] max-md:w-[28vw]" },
  { card: 1, classe: "right-[6vw] bottom-[11svh] w-[min(18vw,250px)] rotate-[4deg] max-md:right-[-3vw] max-md:bottom-[9svh] max-md:w-[34vw]" },
];

/**
 * O fechamento: a alameda do começo do passeio, clara, num palco que fica parado enquanto a chamada para agendar
 * espera no centro e os serviços sobem de fora da tela; o fundo escurece até o verde do rodapé. É o destino de todos
 * os "Agendar banho" do site.
 */
export function Agendar() {
  const secao = useRef<HTMLElement>(null);
  const fundo = useRef<HTMLImageElement>(null);
  const subindo = useRef<(HTMLDivElement | null)[]>([]);

  const montar = useCallback<Parameters<typeof useAnimacaoPerto>[1]>((gsap) => {
    // o fundo se aproxima devagar da entrada da seção até o fim
    gsap.fromTo(fundo.current, { scale: 1.08 }, { scale: 1, ease: "none", scrollTrigger: { trigger: secao.current, start: "top bottom", end: "bottom bottom", scrub: true } });
    // com o palco parado, os serviços sobem de fora da tela, um pouco defasados
    subindo.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { yPercent: 110 + 25 * i, scale: 0.92 },
        { yPercent: 0, scale: 1, ease: "power1.out", scrollTrigger: { trigger: secao.current, start: "top top", end: "+=100%", scrub: 0.8 } },
      );
    });
  }, []);
  useAnimacaoPerto(secao, montar);

  const comum = { alt: "", sizes: "100vw", quality: 70 };
  const { props: celular } = getImageProps({ ...comum, src: fundoCelular });
  const { props: desktop } = getImageProps({ ...comum, src: fundoDesktop });

  return (
    <section ref={secao} id="agendar" data-tema="creme" aria-labelledby="titulo-agendar" className="relative z-10 h-[200svh] max-md:h-[180svh]">
      <div className="sticky top-0 flex h-svh flex-col items-center overflow-hidden px-5 pt-[16svh] text-center max-md:pt-[12svh]">
        {/* a alameda do passeio, clara: entra pelo creme da seção de cima e escurece até o rodapé */}
        <picture>
          <source media="(orientation: portrait)" srcSet={celular.srcSet} sizes="100vw" />
          <img ref={fundo} {...desktop} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
        </picture>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(in_oklch,#fbf6ee_0%,rgb(251_246_238/0)_12%,rgb(211_196_211/0)_24%,rgb(211_196_211/0.4)_38%,rgb(147_163_181/0.55)_60%,rgb(44_57_74/0.9)_84%,#0c2829_100%)]"
        />

        <Rotulo numero={indice.agendar}>Agendar</Rotulo>
        <h2 id="titulo-agendar" className="mt-8 text-display">
          Hora do banho.
        </h2>
        <p className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-1 text-lead text-tinta max-md:mt-6 max-md:flex-col">
          <span>Escolha a unidade.</span>
          <span>Marque o horário.</span>
          <span>Ele volta cheiroso.</span>
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 max-md:mt-8">
          <Botao href="#lojas" escuro>
            Escolher unidade
          </Botao>
          <a
            href="#pacotes"
            className="inline-flex min-h-11 items-center px-2 font-mono text-[0.8125rem] uppercase underline decoration-tinta/30 underline-offset-4 [font-stretch:87.5%] hover:decoration-tinta"
          >
            Ver os pacotes
          </a>
        </div>
        {/* o mesmo atendimento do rodapé, com ligação e conversa a um toque; duas linhas no celular */}
        <p className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-[0.8125rem] uppercase [font-stretch:87.5%] text-tinta md:gap-x-5">
          <a href="tel:40028922" className="underline decoration-tinta/30 underline-offset-4 hover:decoration-tinta">
            {/* no celular, "Tel." no lugar de "Central": os dois números cabem numa linha */}
            <span className="md:hidden">Tel.</span>
            <span className="max-md:hidden">Central</span> 4002 8922
          </a>
          <a href="https://wa.me/5511940028922" className="underline decoration-tinta/30 underline-offset-4 hover:decoration-tinta">
            WhatsApp (11) 94002-8922
          </a>
          <span>Todos os dias, das 8h às 22h</span>
        </p>

        {/* os serviços sobem com a rolagem (decorativos: os mesmos do passeio); a base os dissolve no verde do rodapé */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {pecas.map((p, i) => (
            <div key={p.card} className={`absolute ${p.classe}`}>
              <div ref={(el) => void (subindo.current[i] = el)} className="relative">
                <div className="relative aspect-[4/5] overflow-hidden shadow-[0_30px_60px_-30px_rgb(12_40_41/0.7)]">
                  <Image src={cards[p.card].foto} alt="" fill sizes="(max-width: 768px) 40vw, 290px" className="object-cover" />
                  {/* a mesma luz de amanhecer do fundo */}
                  <div className="absolute inset-0 bg-[#d3c4d3] opacity-50 mix-blend-soft-light" />
                </div>
                <Etiqueta className="absolute top-0 right-0 text-[#1a1d24] max-md:text-[0.625rem]">{cards[p.card].rotulo}</Etiqueta>
              </div>
            </div>
          ))}
          <div className="absolute inset-x-0 bottom-0 h-[14svh] bg-linear-to-b from-[#0c2829]/0 to-[#0c2829]" />
        </div>
      </div>
    </section>
  );
}
