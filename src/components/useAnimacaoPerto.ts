"use client";

import { useEffect, type RefObject } from "react";

type Gsap = typeof import("gsap").gsap;
type Gatilho = typeof import("gsap/ScrollTrigger").ScrollTrigger;

/**
 * Baixa o GSAP só quando a seção chega perto da tela (a uma tela e meia) e monta as animações num contexto,
 * desfeito ao desmontar. Com reduced-motion, nada é baixado. `montar` precisa ser estável (useCallback) e pode devolver
 * uma limpeza extra (chamada junto com o revert do contexto).
 */
export function useAnimacaoPerto(alvo: RefObject<Element | null>, montar: (gsap: Gsap, gatilho: Gatilho) => void | (() => void)) {
  useEffect(() => {
    const el = alvo.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let vivo = true;
    let ctx: ReturnType<Gsap["context"]> | undefined;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
        if (!vivo) return;
        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => montar(gsap, ScrollTrigger), el);
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(el);
    return () => {
      vivo = false;
      io.disconnect();
      ctx?.revert();
    };
  }, [alvo, montar]);
}
