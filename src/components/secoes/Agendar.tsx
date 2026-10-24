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

// os serviços sobem da base, como as peças do produto no fechamento da referência (sobe = quanto % da altura sobem)
const pecas: { card: number; classe: string; sobe: number }[] = [
  { card: 0, classe: "left-[4vw] bottom-[6svh] w-[min(24vw,300px)] max-md:left-[-6vw] max-md:w-[44vw]", sobe: 34 },
  { card: 1, classe: "right-[5vw] bottom-[14svh] w-[min(20vw,250px)] max-md:right-[4vw] max-md:bottom-[12svh] max-md:w-[38vw]", sobe: 52 },
  { card: 8, classe: "left-[30vw] bottom-[-4svh] w-[min(16vw,200px)] max-md:hidden", sobe: 70 },
];

/**
 * O fechamento: a mesma alameda do passeio, clara e enevoada; a chamada para agendar no centro; os serviços subindo da
 * base com a rolagem; e o fundo escurecendo até o verde do rodapé. É o destino de todos os "Agendar banho" do site.
 */
export function Agendar() {
  const secao = useRef<HTMLElement>(null);
  const subindo = useRef<(HTMLDivElement | null)[]>([]);

  const montar = useCallback<Parameters<typeof useAnimacaoPerto>[1]>((gsap) => {
    subindo.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el, { yPercent: pecas[i].sobe }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: secao.current, start: "top 60%", end: "bottom bottom", scrub: true } });
    });
  }, []);
  useAnimacaoPerto(secao, montar);

  const comum = { alt: "", sizes: "100vw", quality: 70 };
  const { props: celular } = getImageProps({ ...comum, src: fundoCelular });
  const { props: desktop } = getImageProps({ ...comum, src: fundoDesktop });

  return (
    <section
      ref={secao}
      id="agendar"
      data-tema="creme"
      aria-labelledby="titulo-agendar"
      className="relative z-10 flex min-h-[125svh] flex-col items-center overflow-hidden px-5 pt-[18svh] text-center max-md:min-h-[115svh]"
    >
      {/* a alameda do passeio, clara: entra pelo creme da seção de cima e escurece até o rodapé */}
      <picture>
        <source media="(orientation: portrait)" srcSet={celular.srcSet} sizes="100vw" />
        <img {...desktop} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
      </picture>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(#fbf6ee_0%,rgb(251_246_238/0.35)_22%,rgb(251_246_238/0)_45%,rgb(46_122_114/0.35)_72%,#0c2829_100%)]"
      />

      <Rotulo numero={indice.agendar}>Agendar</Rotulo>
      <h2 id="titulo-agendar" className="mt-8 text-display">
        Hora do banho.
      </h2>
      <p className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-1 text-lead text-tinta">
        <span>Escolha a unidade.</span>
        <span>Marque o horário.</span>
        <span>Ele volta cheiroso.</span>
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Botao href="#lojas" escuro>
          Agendar banho
        </Botao>
        <a
          href="#pacotes"
          className="inline-flex min-h-11 items-center px-2 font-mono text-[0.8125rem] uppercase underline decoration-tinta/30 underline-offset-4 [font-stretch:87.5%] hover:decoration-tinta"
        >
          Ver os pacotes
        </a>
      </div>
      {/* o mesmo atendimento do rodapé; cada informação inteira numa linha no celular */}
      <p className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-1 font-mono text-[0.75rem] uppercase [font-stretch:87.5%] text-tinta-suave">
        <span>Central 4002 8922</span>
        <span>WhatsApp (11) 94002-8922</span>
        <span>Todos os dias, das 8h às 22h</span>
      </p>

      {/* os serviços sobem da base com a rolagem (decorativos: os mesmos do passeio) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {pecas.map((p, i) => (
          <div key={p.card} ref={(el) => void (subindo.current[i] = el)} className={`absolute ${p.classe}`}>
            <div className="relative aspect-[4/5] overflow-hidden shadow-[0_30px_60px_-30px_rgb(12_40_41/0.7)]">
              <Image src={cards[p.card].foto} alt="" fill sizes="(max-width: 768px) 44vw, 300px" className="object-cover" />
            </div>
            <Etiqueta className="absolute top-0 right-0 text-[#1a1d24] max-md:text-[0.625rem]">{cards[p.card].rotulo}</Etiqueta>
          </div>
        ))}
      </div>
    </section>
  );
}
