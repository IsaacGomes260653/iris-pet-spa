"use client";

import { useEffect, useRef } from "react";
import { indice, numeros } from "@/content/secoes";
import { Rotulo } from "./Rotulo";

const formato = (v: number, casas = 0) => v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

/** Contador que sobe de 0 até o valor quando entra na tela (sem animação com reduced-motion). Escreve direto no DOM. */
function Contador({ valor, casas = 0 }: { valor: number; casas?: number }) {
  const el = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const alvo = el.current;
    if (!alvo) return;
    const escrever = (v: number) => void (alvo.textContent = formato(v, casas));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      escrever(valor);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const inicio = performance.now();
        const passo = (agora: number) => {
          const t = Math.min(1, (agora - inicio) / 1600);
          escrever(valor * (1 - Math.pow(1 - t, 3)));
          if (t < 1) raf = requestAnimationFrame(passo);
        };
        raf = requestAnimationFrame(passo);
      },
      { threshold: 0.6 },
    );
    io.observe(alvo);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [valor, casas]);

  return (
    <span ref={el} aria-hidden>
      {formato(0, casas)}
    </span>
  );
}

export function Rede() {
  return (
    <section id="rede" data-tema="agua" aria-labelledby="titulo-rede" className="relative z-10 flex min-h-svh flex-col justify-between gap-16 px-5 pt-[8svh] pb-[14svh] text-papel md:px-[6vw]">
      <div>
      <Rotulo numero={indice.rede} claro>
        A rede
      </Rotulo>
      <h2 id="titulo-rede" className="mt-6 max-w-[16ch] text-titulo">
        Uma rede inteira cuidando de um só.
      </h2>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-5">
        {numeros.map((n, i) => (
          <div key={n.rotulo} className={`border-t border-papel/25 pt-5 pr-6 ${i === numeros.length - 1 ? "max-md:col-span-2" : ""}`}>
            <dt className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-papel-suave">{n.rotulo}</dt>
            <dd className="mt-3 font-serifa text-[clamp(2.75rem,4.4vw,4.5rem)] leading-none font-extralight tracking-[-0.02em] tabular-nums">
              <Contador valor={n.valor} casas={n.casas} />
              <span className="sr-only">{formato(n.valor, n.casas)}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
