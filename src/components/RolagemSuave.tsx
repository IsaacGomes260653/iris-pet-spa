"use client";

import { useEffect } from "react";

/**
 * Rolagem suave com mouse e trackpad. Fica desligada em telas de toque (a rolagem nativa já é suave) e para quem
 * prefere menos movimento; nesses casos o Lenis nem é baixado.
 */
export function RolagemSuave() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce), (any-pointer: coarse)").matches) return;
    let lenis: { destroy(): void } | undefined;
    let vivo = true;
    import("lenis").then(({ default: Lenis }) => {
      if (vivo) lenis = new Lenis({ autoRaf: true, lerp: 0.09, wheelMultiplier: 0.9 });
    });
    return () => {
      vivo = false;
      lenis?.destroy();
    };
  }, []);
  return null;
}
