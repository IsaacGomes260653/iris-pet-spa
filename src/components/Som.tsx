"use client";

import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { useRef, useState } from "react";

/** Som ambiente de parque (passarinhos de manhã). Desligado por padrão: só toca depois do clique. */
export function Som() {
  const audio = useRef<HTMLAudioElement>(null);
  const [ligado, setLigado] = useState(false);

  const alternar = async () => {
    const a = audio.current;
    if (!a) return;
    if (ligado) {
      a.pause();
      setLigado(false);
      return;
    }
    a.volume = 0;
    try {
      await a.play();
    } catch {
      return;
    }
    setLigado(true);
    // entra devagar, sem susto
    const inicio = performance.now();
    const subir = () => {
      // o carimbo do requestAnimationFrame pode vir antes de `inicio`: volume negativo lança erro
      const t = Math.min(1, Math.max(0, (performance.now() - inicio) / 1200));
      a.volume = 0.45 * t;
      if (t < 1 && !a.paused) requestAnimationFrame(subir);
    };
    requestAnimationFrame(subir);
  };

  const Icone = ligado ? SpeakerHigh : SpeakerSlash;
  return (
    <>
      <button
        type="button"
        onClick={alternar}
        aria-pressed={ligado}
        aria-label="Som ambiente de parque"
        className="fixed top-5 right-9 z-30 inline-flex min-h-9 items-center gap-2 rounded-md bg-papel/90 px-3 font-mono text-[0.75rem] uppercase text-tinta [font-stretch:87.5%] shadow-[0_6px_24px_-12px_rgb(15_47_49/0.45)] backdrop-blur-sm transition-colors hover:bg-papel max-md:right-6 md:top-6 md:right-12"
      >
        <Icone size={15} weight={ligado ? "fill" : "regular"} aria-hidden />
        Som
      </button>
      <audio ref={audio} loop preload="none">
        <source src="/audio/parque.ogg" type="audio/ogg; codecs=opus" />
        <source src="/audio/parque.mp3" type="audio/mpeg" />
      </audio>
    </>
  );
}
