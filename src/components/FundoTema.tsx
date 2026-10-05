"use client";

import { useEffect, useState } from "react";

const temas = ["amanhecer", "creme", "agua"] as const;
type Tema = (typeof temas)[number];

/** Camada fixa atrás da página: o gradiente da seção que cruza o meio da tela aparece por crossfade. */
export function FundoTema() {
  const [ativo, setAtivo] = useState<Tema>("amanhecer");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setAtivo((e.target as HTMLElement).dataset.tema as Tema);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    document.querySelectorAll("[data-tema]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.temaAtivo = ativo;
  }, [ativo]);

  return (
    <div aria-hidden className="fixed inset-0 -z-10">
      {temas.map((t) => (
        <div
          key={t}
          className={`grad-${t} absolute inset-0 transition-opacity duration-[1400ms] ease-in-out motion-reduce:duration-0 ${t === ativo ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </div>
  );
}
