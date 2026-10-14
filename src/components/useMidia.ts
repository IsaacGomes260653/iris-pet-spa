"use client";

import { useSyncExternalStore } from "react";

/** Acompanha uma media query (largura, reduced-motion). No servidor, sempre falso. */
export function useMidia(consulta: string) {
  return useSyncExternalStore(
    (aviso) => {
      const m = matchMedia(consulta);
      m.addEventListener("change", aviso);
      return () => m.removeEventListener("change", aviso);
    },
    () => matchMedia(consulta).matches,
    () => false,
  );
}
