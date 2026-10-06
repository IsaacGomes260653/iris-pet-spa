"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/** Rolagem suave em toda a página (desligada para quem prefere menos movimento). */
export function RolagemSuave() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09, wheelMultiplier: 0.9 });
    return () => lenis.destroy();
  }, []);
  return null;
}
