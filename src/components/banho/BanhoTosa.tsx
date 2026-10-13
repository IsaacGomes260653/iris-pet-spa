"use client";

import { useGSAP } from "@gsap/react";
import {
  Clock,
  Drop,
  Ear,
  Flask,
  FlowerLotus,
  HairDryer,
  HandHeart,
  PaintBrush,
  Pause,
  PawPrint,
  Play,
  Ruler,
  Scissors,
  Towel,
  type Icon,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Etiqueta } from "@/components/ui";
import { passos, type Passo } from "@/content/servicos";

gsap.registerPlugin(Flip, ScrollTrigger, useGSAP);

const ICONES: Record<Passo["detalhes"][number]["icone"], Icon> = {
  gota: Drop,
  frasco: Flask,
  orelha: Ear,
  maos: HandHeart,
  regua: Ruler,
  tesoura: Scissors,
  relogio: Clock,
  patinha: PawPrint,
  toalha: Towel,
  vento: HairDryer,
  escova: PaintBrush,
  flor: FlowerLotus,
};

function useMidia(consulta: string) {
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

function Video({ passo, refVideo, className = "" }: { passo: Passo; refVideo?: (v: HTMLVideoElement | null) => void; className?: string }) {
  return (
    <video
      ref={refVideo}
      muted
      loop
      playsInline
      preload="none"
      poster={passo.poster.src}
      aria-hidden
      className={`size-full object-cover ${className}`}
    >
      <source media="(max-width: 768px)" src={`/videos/${passo.id}-celular.webm`} type="video/webm" />
      <source media="(max-width: 768px)" src={`/videos/${passo.id}-celular.mp4`} type="video/mp4" />
      <source src={`/videos/${passo.id}.webm`} type="video/webm" />
      <source src={`/videos/${passo.id}.mp4`} type="video/mp4" />
    </video>
  );
}

function BotaoPausa({ pausado, alternar, escuro = false }: { pausado: boolean; alternar: () => void; escuro?: boolean }) {
  const Icone = pausado ? Play : Pause;
  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={pausado}
      className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 font-mono text-rotulo uppercase [font-stretch:87.5%] backdrop-blur-sm transition-colors ${escuro ? "bg-tinta/80 text-papel hover:bg-tinta" : "bg-papel/90 text-tinta hover:bg-papel"}`}
    >
      <Icone size={16} weight="fill" aria-hidden />
      {pausado ? "Tocar vídeos" : "Pausar vídeos"}
    </button>
  );
}

function Colunas({ passo, barras }: { passo: Passo; barras?: (el: HTMLSpanElement | null, k: number) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 md:gap-8">
      {passo.detalhes.map((d, k) => {
        const Icone = ICONES[d.icone];
        return (
          <li key={d.titulo} className="relative pt-5">
            {/* linha fina com o trecho que avança: progresso dentro do passo */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-current/30">
              <span ref={(el) => barras?.(el, k)} className="absolute inset-y-0 left-0 w-full origin-left bg-current" style={{ transform: barras ? "scaleX(0)" : undefined }} />
            </span>
            <Icone size={26} weight="light" aria-hidden />
            <h4 className="mt-3 text-lead font-medium">{d.titulo}</h4>
            <p className="mt-1.5 max-w-[30ch] text-corpo opacity-80">{d.texto}</p>
          </li>
        );
      })}
    </ul>
  );
}

/** Desktop: seção fixada; cada card abre em tela cheia (GSAP Flip) e volta para a fileira. */
function Fixado() {
  const secao = useRef<HTMLElement>(null);
  const alvo = useRef<HTMLDivElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const slots = useRef<(HTMLDivElement | null)[]>([]);
  const molduras = useRef<(HTMLDivElement | null)[]>([]);
  const camadas = useRef<(HTMLDivElement | null)[]>([]);
  const barras = useRef<(HTMLSpanElement | null)[][]>([[], [], []]);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const tinta = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(-1);
  const [pausado, setPausado] = useState(false);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      // o título só entra com a chegada do passeio já coberta pela névoa; a fileira fica inteira antes do primeiro zoom
      tl.fromTo(titulo.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.3);
      tl.to({}, { duration: 0.6 });
      const janelas: [number, number][] = [];
      passos.forEach((_, i) => {
        const t = tl.duration();
        tl.set(slots.current[i], { zIndex: 20 }, t);
        tl.add(Flip.fit(molduras.current[i], alvo.current, { duration: 1, ease: "power2.inOut", scale: false, absolute: true }) as gsap.core.Tween, t);
        if (i === 0) tl.to(titulo.current, { autoAlpha: 0, y: -30, duration: 0.6 }, t);
        tl.fromTo(camadas.current[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, t + 0.7);
        barras.current[i].forEach((b, k) => tl.fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: 0.7 }, t + 1.1 + k * 0.7));
        tl.to(camadas.current[i], { autoAlpha: 0, duration: 0.3 }, t + 4.1);
        tl.add(Flip.fit(molduras.current[i], slots.current[i], { duration: 1, ease: "power2.inOut", scale: false, absolute: true }) as gsap.core.Tween, t + 4.2);
        tl.set(slots.current[i], { zIndex: 1 }, t + 5.2);
        janelas.push([t + 0.6, t + 4.4]);
      });
      tl.to(titulo.current, { autoAlpha: 1, y: 0, duration: 0.6 }, tl.duration() - 0.5);
      tl.to({}, { duration: 0.8 }); // os três de volta na fileira
      tl.fromTo(tinta.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2 }); // verde-água tinge e leva ao mapa

      ScrollTrigger.create({
        trigger: secao.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        animation: tl,
        invalidateOnRefresh: true,
        onUpdate: () => {
          const tempo = tl.time();
          setAtivo(janelas.findIndex(([a, b]) => tempo >= a && tempo <= b));
        },
      });
    },
    { scope: secao },
  );

  // só o vídeo aberto toca; o resto fica parado no primeiro quadro
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === ativo && !pausado) v.play().catch(() => {});
      else v.pause();
    });
  }, [ativo, pausado]);

  return (
    <section ref={secao} id="banho-e-tosa" data-tema="creme" aria-labelledby="titulo-banho" className="relative z-10 -mt-[75svh] h-[640svh] bg-[linear-gradient(rgb(251_246_238/0),rgb(251_246_238/0.5)_22svh,rgb(251_246_238/0.9)_44svh,#fbf6ee_62svh)]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <h2 ref={titulo} id="titulo-banho" className="invisible relative z-10 px-5 pt-[13svh] text-center text-display opacity-0">
          Banho em minutos.
          <br />
          Tosa sob medida.
          <br />
          Carinho do começo ao fim.
        </h2>

        <div ref={alvo} aria-hidden className="pointer-events-none absolute inset-2" />

        <ol className="absolute inset-x-0 bottom-[7svh] flex justify-center gap-4">
          {passos.map((p, i) => (
            <li key={p.id} className="w-[min(21vw,300px)]">
              <div ref={(el) => void (slots.current[i] = el)} className="relative aspect-video">
                <div ref={(el) => void (molduras.current[i] = el)} className="absolute inset-0 overflow-hidden rounded-[10px] bg-ardosia shadow-[0_18px_40px_-24px_rgb(34_37_43/0.5)]">
                  <Video passo={p} refVideo={(v) => void (videos.current[i] = v)} />
                </div>
              </div>
              <p className="mt-3 flex items-baseline gap-2 text-corpo">
                <span className="font-mono text-rotulo text-tinta-suave [font-stretch:87.5%]">0{i + 1}</span>
                {p.nome}
              </p>
            </li>
          ))}
        </ol>

        {/* o que aparece por cima de cada vídeo aberto */}
        {passos.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => void (camadas.current[i] = el)}
            className="invisible pointer-events-none absolute inset-2 z-30 flex flex-col justify-between rounded-[10px] bg-[linear-gradient(rgb(16_20_30/0.5),rgb(16_20_30/0)_32%,rgb(16_20_30/0)_55%,rgb(16_20_30/0.72))] p-10 text-papel opacity-0"
          >
            <div>
              <p className="max-w-[14ch] font-serifa text-titulo font-extralight">{p.frase}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Etiqueta>{p.rotulo}</Etiqueta>
                <p className="text-lead">{p.legenda}</p>
              </div>
            </div>
            <Colunas passo={p} barras={(el, k) => void (barras.current[i][k] = el)} />
          </div>
        ))}

        {/* indicador do vídeo ativo + pausa (movimento automático precisa poder parar) */}
        <div className={`absolute top-6 right-6 z-40 flex items-center gap-4 transition-opacity duration-300 ${ativo >= 0 ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <p className="flex items-center gap-1.5 font-mono text-rotulo text-papel [font-stretch:87.5%]" aria-live="polite">
            {passos.map((p, i) => (
              <span key={p.id} aria-hidden className={`h-0.5 w-6 rounded-full transition-colors ${i === ativo ? "bg-papel" : "bg-papel/35"}`} />
            ))}
            <span className="ml-2">{ativo >= 0 ? `0${ativo + 1} / 03 · ${passos[ativo].nome}` : ""}</span>
          </p>
          <BotaoPausa pausado={pausado} alternar={() => setPausado((v) => !v)} />
        </div>

        <div ref={tinta} aria-hidden className="grad-agua invisible pointer-events-none absolute inset-0 z-50 opacity-0" />
      </div>
    </section>
  );
}

/** Celular e reduced-motion: cards empilhados; tocar abre os detalhes do passo. */
function Empilhado({ quieto }: { quieto: boolean }) {
  const [aberto, setAberto] = useState(-1);
  const [pausado, setPausado] = useState(quieto);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting && !pausado) v.play().catch(() => {});
          else v.pause();
        }
      },
      { threshold: 0.5 },
    );
    videos.current.forEach((v) => v && io.observe(v));
    return () => io.disconnect();
  }, [pausado]);

  return (
    <section id="banho-e-tosa" data-tema="creme" aria-labelledby="titulo-banho" className="relative z-10 -mt-[60svh] bg-[linear-gradient(rgb(251_246_238/0),rgb(251_246_238/0.5)_20svh,rgb(251_246_238/0.9)_40svh,#fbf6ee_56svh)] px-5 pt-[58svh] pb-[14svh]">
      <h2 id="titulo-banho" className="text-center text-[2.25rem] leading-[1.05] md:text-display">
        Banho em minutos.
        <br />
        Tosa sob medida.
        <br />
        Carinho do começo ao fim.
      </h2>
      <div className="mt-8 flex justify-center">
        <BotaoPausa pausado={pausado} alternar={() => setPausado((v) => !v)} escuro />
      </div>
      <ol className="mt-8 grid gap-10">
        {passos.map((p, i) => {
          const expandido = aberto === i;
          return (
            <li key={p.id}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-ardosia">
                <Video passo={p} refVideo={(v) => void (videos.current[i] = v)} />
                <Etiqueta className="absolute top-0 right-0">{p.rotulo}</Etiqueta>
              </div>
              <button
                type="button"
                aria-expanded={expandido}
                aria-controls={`detalhes-${p.id}`}
                onClick={() => setAberto(expandido ? -1 : i)}
                className="mt-4 flex w-full min-h-11 items-center justify-between gap-4 text-left"
              >
                <span>
                  <span className="block font-serifa text-frase font-light">{p.frase}</span>
                  <span className="mt-1 block text-corpo text-tinta-suave">{p.legenda}</span>
                </span>
                <span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-full border border-tinta/25 text-xl transition-transform duration-300 ${expandido ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              <div id={`detalhes-${p.id}`} hidden={!expandido} className="pt-6">
                <Colunas passo={p} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function BanhoTosa() {
  const largo = useMidia("(min-width: 769px)");
  const quieto = useMidia("(prefers-reduced-motion: reduce)");
  return largo && !quieto ? <Fixado /> : <Empilhado quieto={quieto} />;
}
