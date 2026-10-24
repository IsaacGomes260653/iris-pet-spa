"use client";

import { useEffect, useRef, useState } from "react";
import { useMidia } from "@/components/useMidia";
import { Brincadeira } from "./Brincadeira";

const NOME = Array.from("Íris");
const FS = 1000; // tamanho da fonte em unidades do SVG; a caixa é medida nela

/**
 * O nome gigante no fim do rodapé. É um SVG cuja caixa (viewBox) é medida na própria fonte depois que ela carrega, com
 * folga para o acento do "Í": cabe inteiro, em largura e em altura, em qualquer janela. As letras sobem uma a uma de
 * trás da linha de base quando o rodapé aparece; ao fundo, a silhueta da brincadeira com a bola.
 */
export function NomeGigante() {
  const palco = useRef<HTMLDivElement>(null);
  const inteiro = useRef<SVGTextElement>(null);
  const [medida, setMedida] = useState<{ caixa: string; xs: number[]; base: number } | null>(null);
  const [visivel, setVisivel] = useState(false);
  const quieto = useMidia("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    let vivo = true;
    document.fonts.ready.then(() => {
      const t = inteiro.current;
      if (!vivo || !t) return;
      const b = t.getBBox();
      // a caixa da fonte nem sempre cobre o acento: 6% a mais no alto; embaixo, só até um pouco abaixo da linha de base
      const topo = b.y - b.height * 0.06;
      const fundo = FS * 0.03;
      const folga = FS * 0.02;
      setMedida({
        caixa: `${(b.x - folga).toFixed(1)} ${topo.toFixed(1)} ${(b.width + 2 * folga).toFixed(1)} ${(fundo - topo).toFixed(1)}`,
        xs: NOME.map((_, i) => (i === 0 ? 0 : t.getSubStringLength(0, i))),
        base: fundo,
      });
    });
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setVisivel(true);
        io.disconnect();
      },
      { threshold: 0.35 },
    );
    if (palco.current) io.observe(palco.current);
    return () => {
      vivo = false;
      io.disconnect();
    };
  }, []);

  const letra = "font-serifa font-extralight";
  return (
    <div ref={palco} aria-hidden className="relative mt-[6svh] select-none">
      {/* a brincadeira ao fundo, com os pés na mesma linha de base das letras, numa cor de sombra */}
      <Brincadeira className="absolute inset-x-0 bottom-[1.5%] w-full text-[#164644]" />
      <svg
        viewBox={medida?.caixa ?? "-20 -980 1640 1010"}
        preserveAspectRatio="xMidYMax meet"
        className="relative block max-h-[82svh] w-full overflow-visible"
      >
        {medida ? (
          <>
            <clipPath id="nome-gigante-base">
              {/* as letras nascem de trás da linha de base */}
              <rect x={-FS} y={-FS * 2} width={FS * 6} height={FS * 2 + medida.base} />
            </clipPath>
            <g clipPath="url(#nome-gigante-base)" fill="currentColor">
              {NOME.map((l, i) => (
                <text
                  key={i}
                  x={medida.xs[i]}
                  y={0}
                  fontSize={FS}
                  letterSpacing="-0.045em"
                  className={letra}
                  style={{
                    transform: `translateY(${visivel || quieto ? 0 : FS * 1.1}px)`,
                    transition: quieto ? "none" : `transform 1.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 110}ms`,
                  }}
                >
                  {l}
                </text>
              ))}
            </g>
          </>
        ) : null}
        {/* o nome inteiro: serve para medir e é o que aparece antes da medida (e sem JavaScript) */}
        <text ref={inteiro} x={0} y={0} fontSize={FS} letterSpacing="-0.045em" fill="currentColor" className={letra} opacity={medida ? 0 : 1}>
          Íris
        </text>
      </svg>
    </div>
  );
}
