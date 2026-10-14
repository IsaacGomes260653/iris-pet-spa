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
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Etiqueta } from "@/components/ui";
import { passos, type Passo } from "@/content/servicos";

gsap.registerPlugin(ScrollTrigger, useGSAP);

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

function BotaoPausa({ pausado, alternar, curto = false }: { pausado: boolean; alternar: () => void; curto?: boolean }) {
  const Icone = pausado ? Play : Pause;
  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={pausado}
      aria-label={curto ? (pausado ? "Tocar vídeos" : "Pausar vídeos") : undefined}
      className="inline-flex min-h-9 items-center gap-2 bg-papel px-3 font-mono md:min-h-11 text-rotulo text-[#2a2a2e] uppercase [font-stretch:87.5%] shadow-[0_6px_20px_-12px_rgb(15_47_49/0.5)] transition-colors hover:bg-creme"
    >
      <Icone size={14} weight="fill" aria-hidden />
      {curto ? (pausado ? "Tocar" : "Pausar") : pausado ? "Tocar vídeos" : "Pausar vídeos"}
    </button>
  );
}

function Colunas({ passo, barras }: { passo: Passo; barras?: (el: HTMLSpanElement | null, k: number) => void }) {
  return (
    <ul className="grid grid-cols-1 gap-y-6 md:grid-cols-4 md:gap-8">
      {passo.detalhes.map((d, k) => {
        const Icone = ICONES[d.icone];
        return (
          <li key={d.titulo} className="relative pt-5">
            {/* linha fina com o trecho que avança: progresso dentro do passo */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-current/15 md:bg-current/30">
              {barras && <span ref={(el) => barras(el, k)} className="absolute inset-y-0 left-0 w-full origin-left bg-current" style={{ transform: "scaleX(0)" }} />}
            </span>
            <Icone size={26} weight="light" aria-hidden />
            <h4 className="mt-3 text-lead font-medium">{d.titulo}</h4>
            <p className="mt-1.5 max-w-[30ch] text-corpo opacity-85">{d.texto}</p>
          </li>
        );
      })}
    </ul>
  );
}

// duração de cada passo na linha do tempo (unidades arbitrárias; a rolagem é distribuída proporcionalmente)
const PASSO = 5;
const TROCA = 0.25; // troca cruzada curta de um vídeo cheio para o seguinte (sem dupla exposição longa)

/**
 * Desktop: seção fixada. O primeiro card cresce da fileira até a tela inteira; de um vídeo cheio para o outro há
 * troca cruzada com um leve zoom; depois do terceiro, todos voltam para a fileira e a tinta verde-água leva ao mapa.
 */
function Fixado() {
  const secao = useRef<HTMLElement>(null);
  const palco = useRef<HTMLDivElement>(null);
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
      // posição e tamanho da tela cheia em relação ao lugar do card na fileira (recalculados a cada refresh)
      const caixa = (i: number) => {
        const c = palco.current!.getBoundingClientRect();
        const s = slots.current[i]!.getBoundingClientRect();
        return { x: c.left - s.left, y: c.top - s.top, w: c.width, h: c.height, sw: s.width, sh: s.height };
      };
      const cheio = (i: number) => ({ x: () => caixa(i).x, y: () => caixa(i).y, width: () => caixa(i).w, height: () => caixa(i).h, borderRadius: 0 });
      const naFileira = (i: number) => ({ x: 0, y: 0, width: () => caixa(i).sw, height: () => caixa(i).sh, borderRadius: 10 });

      const tl = gsap.timeline({ defaults: { ease: "none" } });
      // o título já está na tela quando a seção fixa (o véu creme do passeio cobriu a fachada antes)
      tl.to({}, { duration: 1.2 });
      const janelas: [number, number][] = [];
      passos.forEach((_, i) => {
        const t = tl.duration();
        tl.set(slots.current[i], { zIndex: 20 + i }, t);
        let parado: number; // momento em que o vídeo está cheio e parado
        if (i === 0) {
          tl.fromTo(molduras.current[i], naFileira(i), { ...cheio(i), duration: 1, ease: "power2.inOut" }, t);
          tl.to(titulo.current, { autoAlpha: 0, y: -30, duration: 0.5 }, t);
          parado = t + 1;
          janelas.push([t + 0.9, t + PASSO + TROCA / 2]);
        } else {
          tl.set(molduras.current[i], { ...cheio(i), autoAlpha: 0 }, t);
          tl.to(molduras.current[i], { autoAlpha: 1, duration: TROCA, ease: "power1.out" }, t);
          tl.set(molduras.current[i - 1], { ...naFileira(i - 1), autoAlpha: 1 }, t + TROCA); // o anterior volta escondido atrás
          tl.set(slots.current[i - 1], { zIndex: 1 }, t + TROCA);
          parado = t + TROCA;
          janelas.push([t + TROCA / 2, i === passos.length - 1 ? t + PASSO : t + PASSO + TROCA / 2]);
        }
        // textos dentro do card: só com o vídeo parado, e somem antes do próximo entrar
        tl.fromTo(camadas.current[i], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.35 }, parado);
        barras.current[i].forEach((b, k) => tl.fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: 0.7 }, parado + 0.45 + k * 0.7));
        tl.to(camadas.current[i], { autoAlpha: 0, duration: 0.25 }, t + PASSO - 0.35);
        tl.set({}, {}, t + PASSO);
      });
      // depois do terceiro: volta para a fileira com o título
      const fim = tl.duration();
      const ultimo = passos.length - 1;
      tl.to(molduras.current[ultimo], { ...naFileira(ultimo), duration: 1, ease: "power2.inOut" }, fim);
      tl.to(titulo.current, { autoAlpha: 1, y: 0, duration: 0.6 }, fim + 0.5);
      tl.to({}, { duration: 0.6 });
      // a tinta verde-água sobe de baixo como uma cortina sólida (sem véu translúcido sobre o creme)
      tl.set(tinta.current, { autoAlpha: 1 });
      tl.fromTo(tinta.current, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.2, ease: "power2.inOut" });
      tl.to({}, { duration: 2.1 }); // o título do mapa sobe por cima da tinta (a seção seguinte entra sobreposta)

      ScrollTrigger.create({
        trigger: secao.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        animation: tl,
        invalidateOnRefresh: true,
      });
      // o indicador segue a animação (que chega atrasada pelo scrub), não a rolagem crua
      tl.eventCallback("onUpdate", () => {
        const tempo = tl.time();
        setAtivo(janelas.findIndex(([a, b]) => tempo >= a && tempo < b));
      });
    },
    { scope: secao },
  );

  // só o vídeo aberto toca; o resto fica parado no poster
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === ativo && !pausado) v.play().catch(() => {});
      else v.pause();
    });
  }, [ativo, pausado]);

  return (
    <section ref={secao} id="banho-e-tosa" data-tema="creme" aria-labelledby="titulo-banho" className="relative z-10 -mt-[85svh] h-[600svh] bg-[linear-gradient(rgb(251_246_238/0),rgb(251_246_238/0.5)_22svh,rgb(251_246_238/0.9)_44svh,#fbf6ee_62svh)]">
      <div ref={palco} className="sticky top-0 h-svh overflow-hidden bg-[linear-gradient(180deg,rgb(251_246_238/0)_0%,#fbf6ee_30%,#fbf6ee_45%,#fde7d2_78%,#dff1e4_100%)]">
        <h2
          ref={titulo}
          id="titulo-banho"
          className="relative z-10 px-5 pt-[25svh] text-center text-[clamp(3rem,5.8vw,6rem)] leading-[0.95] tracking-[-0.02em]"
        >
          Banho em minutos.
          <br />
          Tosa sob medida.
          <br />
          Carinho do começo ao fim.
        </h2>

        <ol className="absolute inset-x-0 bottom-[7svh] flex justify-center gap-4">
          {passos.map((p, i) => (
            <li key={p.id} className="w-[min(21vw,300px)]">
              <div ref={(el) => void (slots.current[i] = el)} className="relative aspect-video">
                <div
                  ref={(el) => void (molduras.current[i] = el)}
                  className="absolute top-0 left-0 size-full origin-center overflow-hidden rounded-[10px] bg-ardosia text-papel shadow-[0_18px_40px_-24px_rgb(34_37_43/0.5)]"
                >
                  <Video passo={p} refVideo={(v) => void (videos.current[i] = v)} />
                  {/* o que aparece por cima do vídeo aberto, dentro do próprio card */}
                  <div
                    ref={(el) => void (camadas.current[i] = el)}
                    className="invisible pointer-events-none absolute inset-0 flex min-w-[960px] flex-col justify-between bg-[radial-gradient(ellipse_60%_45%_at_0%_0%,rgb(0_0_0/0.4),rgb(0_0_0/0)),linear-gradient(rgb(0_0_0/0.45),rgb(0_0_0/0)_38%,rgb(0_0_0/0)_60%,rgb(0_0_0/0.55))] px-12 pt-24 pb-12 opacity-0"
                  >
                    <div>
                      <p className="font-serifa text-[clamp(2.5rem,4.4vw,4rem)] leading-none font-extralight whitespace-nowrap">{p.frase}</p>
                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <Etiqueta>{p.rotulo}</Etiqueta>
                        <p className="text-lead">{p.legenda}</p>
                      </div>
                    </div>
                    <Colunas passo={p} barras={(el, k) => void (barras.current[i][k] = el)} />
                  </div>
                </div>
              </div>
              <p className="mt-3 flex items-baseline gap-2 text-corpo">
                <span className="font-mono text-rotulo text-tinta-suave [font-stretch:87.5%]">0{i + 1}</span>
                {p.nome}
              </p>
            </li>
          ))}
        </ol>

        {/* indicador do vídeo cheio + pausa (movimento automático precisa poder parar) */}
        <div className={`absolute top-6 right-6 z-40 flex items-center gap-4 transition-opacity duration-200 ${ativo >= 0 ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <p className="flex items-center gap-1.5 font-mono text-rotulo text-papel [font-stretch:87.5%] [text-shadow:0_1px_8px_rgb(0_0_0/0.4)]" aria-live="polite">
            {passos.map((p, i) => (
              <span key={p.id} aria-hidden className={`h-0.5 w-6 rounded-full transition-colors ${i === ativo ? "bg-papel" : "bg-papel/35"}`} />
            ))}
            <span className="ml-2">{ativo >= 0 ? `0${ativo + 1} / 03 · ${passos[ativo].nome}` : ""}</span>
          </p>
          <BotaoPausa pausado={pausado} alternar={() => setPausado((v) => !v)} />
        </div>

        <div ref={tinta} aria-hidden className="invisible pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(180deg,#2e7a72,#1d5554)] opacity-0" />
      </div>
    </section>
  );
}

/** Celular e reduced-motion: os três passos empilhados, com os detalhes sempre à vista. */
function Empilhado({ quieto }: { quieto: boolean }) {
  const [pausado, setPausado] = useState(quieto);
  const [comVideo, setComVideo] = useState(false);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const visiveis = new Set<Element>();
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) visiveis.add(v);
          else visiveis.delete(v);
          if (e.isIntersecting && !pausado) v.play().catch(() => {});
          else v.pause();
        }
        setComVideo(visiveis.size > 0);
      },
      { threshold: 0.5 },
    );
    videos.current.forEach((v) => v && io.observe(v));
    return () => io.disconnect();
  }, [pausado]);

  return (
    <section id="banho-e-tosa" data-tema="creme" aria-labelledby="titulo-banho" className="relative z-10 -mt-[70svh] bg-[linear-gradient(rgb(251_246_238/0),rgb(251_246_238/0.6)_12svh,#fbf6ee_30svh)] px-5 pt-[36svh]">
      <h2 id="titulo-banho" className="text-center text-[2.25rem] leading-[1.05] md:text-display">
        Banho em minutos.
        <br />
        Tosa sob medida.
        <br />
        Carinho do começo ao fim.
      </h2>
      {/* pausa no canto enquanto há vídeo na tela */}
      <div className={`fixed top-3 right-3 z-30 transition-opacity duration-300 ${comVideo ? "opacity-100" : "pointer-events-none opacity-0"}`} inert={!comVideo}>
        <BotaoPausa pausado={pausado} alternar={() => setPausado((v) => !v)} curto />
      </div>
      <div>
        <ol className="mt-10 grid gap-14">
          {passos.map((p, i) => (
            <li key={p.id}>
              {/* o título do passo fica preso no alto enquanto o vídeo e os detalhes passam */}
              <h3 className="sticky top-0 z-10 -mx-5 bg-creme px-5 pt-[4.25rem] pb-3 text-[1.75rem] leading-[1.1] after:absolute after:inset-x-0 after:top-full after:h-6 after:bg-[linear-gradient(#fbf6ee,rgb(251_246_238/0))]">{p.frase}</h3>
              <div className="relative mt-2 aspect-[4/5] overflow-hidden rounded-[10px] bg-ardosia">
                <Video passo={p} refVideo={(v) => void (videos.current[i] = v)} />
                <Etiqueta className="absolute top-0 right-0">{p.rotulo}</Etiqueta>
              </div>
              <p className="mt-4 text-lead text-tinta-suave">{p.legenda}</p>
              <div className="mt-6">
                <Colunas passo={p} />
              </div>
            </li>
          ))}
        </ol>
      </div>
      {/* a mesma passagem do desktop: o creme tinge de verde-água e leva ao mapa */}
      <div aria-hidden className="-mx-5 mt-[12svh] h-[70svh] bg-[linear-gradient(#fbf6ee,#fde7d2_30%,#dff1e4_55%,#2e7a72)]" />
    </section>
  );
}

export function BanhoTosa() {
  const largo = useMidia("(min-width: 769px)");
  const quieto = useMidia("(prefers-reduced-motion: reduce)");
  return largo && !quieto ? <Fixado /> : <Empilhado quieto={quieto} />;
}
