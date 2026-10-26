"use client";

import { useEffect, useRef, useState } from "react";
import { useMidia } from "@/components/useMidia";
import { Brincadeira } from "./Brincadeira";

const NOME = Array.from("Íris");
const FS = 1000; // tamanho da fonte em unidades do SVG; a caixa é medida nela
const KERN_I = -20; // o "Í" com serifa abre um vão maior que o das outras letras: as seguintes chegam um pouco
// caixa provisória (a medida na Literata 200), para o nome não saltar quando a fonte carregar
const PROVISORIA = { caixa: "46.9 -947.5 1214.1 967.1", xs: [0, 284, 646, 886], base: 19.6 };

/**
 * O nome gigante no fim do rodapé, um SVG cuja caixa é medida na própria fonte quando ela carrega (a tinta de verdade,
 * com o acento do "Í"): cabe inteiro em qualquer janela. As letras sobem uma a uma de trás da linha de base quando o
 * rodapé aparece. A brincadeira com a bola fica ao lado do nome no desktop e numa faixa acima dele no celular.
 */
export function NomeGigante() {
  const palco = useRef<HTMLDivElement>(null);
  const inteiro = useRef<SVGTextElement>(null);
  const [medida, setMedida] = useState(PROVISORIA);
  const [pronta, setPronta] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const quieto = useMidia("(prefers-reduced-motion: reduce)");
  const largo = useMidia("(min-width: 1024px)");

  useEffect(() => {
    let vivo = true;
    document.fonts.ready.then(() => {
      const t = inteiro.current;
      if (!vivo || !t) return;
      // a tinta das letras (o acento no alto, a curva do "s" embaixo) vem do canvas; a largura, do próprio SVG
      const ctx = document.createElement("canvas").getContext("2d")!;
      const estilo = getComputedStyle(t);
      ctx.font = `${estilo.fontWeight} ${FS}px ${estilo.fontFamily}`;
      const tinta = ctx.measureText("Íris");
      const b = t.getBBox();
      const topo = -tinta.actualBoundingBoxAscent - FS * 0.01;
      const base = tinta.actualBoundingBoxDescent + FS * 0.004;
      const esquerda = -tinta.actualBoundingBoxLeft;
      const largura = b.x + b.width + KERN_I - esquerda;
      setMedida({
        caixa: `${esquerda.toFixed(1)} ${topo.toFixed(1)} ${largura.toFixed(1)} ${(base - topo).toFixed(1)}`,
        xs: NOME.map((_, i) => (i === 0 ? 0 : t.getSubStringLength(0, i) + KERN_I)),
        base,
      });
      setPronta(true);
    });
    return () => {
      vivo = false;
    };
  }, []);

  // só observa depois de medir: as letras já estão escondidas embaixo da linha, e a subida sempre acontece
  useEffect(() => {
    if (!pronta || !palco.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setVisivel(true);
        io.disconnect();
      },
      { threshold: 0.35 },
    );
    io.observe(palco.current);
    return () => io.disconnect();
  }, [pronta]);

  const letra = "font-serifa font-extralight";
  return (
    <div ref={palco} aria-hidden className="relative mt-[6svh] select-none lg:flex lg:items-end lg:gap-[6vw]">
      {/* a brincadeira, numa cor de sombra: ao lado do nome no desktop, com os pés na linha de base; acima, no celular */}
      <Brincadeira
        compacta={!largo}
        ativa={visivel || quieto}
        className="mb-[2svh] block h-[clamp(72px,22vw,140px)] w-full text-[#1d4140] lg:order-last lg:mb-[0.4svh] lg:h-auto lg:max-h-[42svh] lg:min-w-0 lg:flex-1"
      />
      <svg
        viewBox={medida.caixa}
        preserveAspectRatio="xMinYMax meet"
        className="block max-h-[82svh] w-full overflow-visible lg:h-[82svh] lg:w-auto lg:max-w-[62%] lg:shrink-0"
      >
        {pronta ? (
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
        <text ref={inteiro} x={0} y={0} fontSize={FS} letterSpacing="-0.045em" fill="currentColor" className={letra} opacity={pronta ? 0 : 1}>
          Íris
        </text>
      </svg>
    </div>
  );
}
