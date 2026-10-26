"use client";

import { useEffect, useRef, useState } from "react";

// cada trecho da página com a cor do seu grupo (a sequência clara → escura dos temas)
const trechos = [
  { id: "passeio", nome: "O passeio", cor: "bg-seg-passeio" },
  { id: "banho-e-tosa", nome: "Banho e tosa", cor: "bg-seg-banho" },
  { id: "lojas", nome: "Lojas", cor: "bg-seg-lojas" },
  { id: "pacotes", nome: "Pacotes", cor: "bg-seg-pacotes" },
  { id: "antes-e-depois", nome: "Antes e depois", cor: "bg-seg-rede" },
  { id: "rede", nome: "A rede", cor: "bg-seg-rede" },
  { id: "especialistas", nome: "Especialistas", cor: "bg-seg-pessoas" },
  { id: "clientes", nome: "Clientes", cor: "bg-seg-pessoas" },
  { id: "guia", nome: "Guia de cuidados", cor: "bg-seg-agendar" },
  { id: "agendar", nome: "Agendar", cor: "bg-seg-agendar" },
];

/** Índice lateral: barra segmentada pelo tamanho real de cada seção, com o marcador ▶ na posição da rolagem. */
export function BarraProgresso() {
  const [alturas, setAlturas] = useState<number[]>([]);
  const marcador = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const medir = () => {
      const total = document.documentElement.scrollHeight;
      const tops = trechos.map((t) => document.getElementById(t.id)?.getBoundingClientRect().top ?? 0).map((y) => y + scrollY);
      // cada trecho vai do seu topo até o topo do seguinte (o último vai até o fim da página)
      setAlturas(tops.map((y, i) => ((i + 1 < tops.length ? tops[i + 1] : total) - y) / total));
    };
    const rolar = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (marcador.current) marcador.current.style.top = `${((scrollY / Math.max(1, max)) * 100).toFixed(2)}%`;
    };
    medir();
    rolar();
    const ro = new ResizeObserver(medir);
    ro.observe(document.body);
    addEventListener("scroll", rolar, { passive: true });
    return () => {
      ro.disconnect();
      removeEventListener("scroll", rolar);
    };
  }, []);

  return (
    <nav aria-label="Seções da página" className="fixed top-2.5 right-1.5 bottom-2.5 z-40 flex w-6 flex-col max-md:right-0.5 max-md:w-4">
      {trechos.map((t, i) => (
        <a
          key={t.id}
          href={`#${t.id}`}
          aria-label={t.nome}
          title={t.nome}
          className="group relative flex justify-center"
          style={{ flexGrow: alturas[i] ?? 1, flexBasis: 0 }}
        >
          <span className={`h-full w-[3px] ${t.cor} transition-[width] duration-200 group-hover:w-[6px] group-focus-visible:w-[6px] max-md:w-[2px]`} />
        </a>
      ))}
      {/* o marcador ▶ na posição atual da rolagem */}
      <span ref={marcador} aria-hidden className="pointer-events-none absolute -left-2.5 -translate-y-1/2 text-[10px] leading-none text-papel [text-shadow:0_0_6px_rgb(12_40_41/0.6)] max-md:-left-2">
        ▶
      </span>
    </nav>
  );
}
