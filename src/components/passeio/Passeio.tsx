"use client";

import dynamic from "next/dynamic";
import { getImageProps, type StaticImageData } from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import posterCelular from "@/assets/passeio/poster-celular.jpg";
import posterDesktop from "@/assets/passeio/poster-desktop.jpg";
import lojaCelular from "@/assets/passeio/poster-loja-celular.jpg";
import lojaDesktop from "@/assets/passeio/poster-loja-desktop.jpg";
import { Botao } from "@/components/ui";
import { FIM, frases } from "./caminho";
import { Seguro } from "./Seguro";

const Cena = dynamic(() => import("./Cena"), { ssr: false });

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

const ALT_PONTE =
  "Em primeira pessoa, uma mão segura a guia verde-sálvia de uma pastora-alemã preta que caminha à frente, numa ponte de madeira ao amanhecer, com névoa lavanda e ipês-rosa ao fundo.";
const ALT_LOJA =
  "A pastora-alemã preta chega com o tutor à porta de vidro de uma loja Íris, de fachada creme e verde-sálvia, com luz quente lá dentro.";

/** Poster com recorte por tela: a própria cena renderizada, para o primeiro quadro aparecer na hora. */
function Poster({ celular, desktop, alt, visivel, preload = false }: { celular: StaticImageData; desktop: StaticImageData; alt: string; visivel: boolean; preload?: boolean }) {
  const comum = { alt, sizes: "100vw", quality: 75, preload };
  const { props: { srcSet: srcCelular } } = getImageProps({ ...comum, src: celular });
  const { props: { srcSet: srcDesktop, ...img } } = getImageProps({ ...comum, src: desktop });
  return (
    <picture>
      <source media="(max-aspect-ratio: 4/5)" srcSet={srcCelular} />
      <source srcSet={srcDesktop} />
      <img {...img} alt={alt} className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${visivel ? "opacity-100" : "opacity-0"}`} />
    </picture>
  );
}

export function Passeio() {
  const secao = useRef<HTMLElement>(null);
  const progresso = useRef(0);
  const [ativa, setAtiva] = useState(0);
  const [fase, setFase] = useState<"hero" | "passeio" | "chegada">("hero");
  const [montar, setMontar] = useState(false);
  const [pronta, setPronta] = useState(false);
  const [naTela, setNaTela] = useState(true);
  const leve = useMidia("(max-width: 768px), (pointer: coarse)");
  const quieto = useMidia("(prefers-reduced-motion: reduce)");

  // o 3D só começa a carregar depois do primeiro quadro, quando o navegador fica ocioso
  useEffect(() => {
    if (quieto) return;
    const ocioso = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 400));
    const id = ocioso(() => setMontar(true), { timeout: 1500 });
    return () => (window.cancelIdleCallback ?? clearTimeout)(id);
  }, [quieto]);

  // fora da tela, a cena para de desenhar (bateria e GPU para o resto da página)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), { rootMargin: "100px" });
    if (secao.current) io.observe(secao.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const ler = () => {
      raf = 0;
      const el = secao.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
      progresso.current = p;
      const s = p * FIM;
      setAtiva(frases.reduce((i, f, k) => (s >= f.s ? k : i), 0));
      setFase(p < 0.03 ? "hero" : p > 0.86 ? "chegada" : "passeio");
      el.style.setProperty("--saida", String(Math.min(1, Math.max(0, (p - 0.93) / 0.055))));
    };
    const aoRolar = () => (raf ||= requestAnimationFrame(ler));
    ler();
    addEventListener("scroll", aoRolar, { passive: true });
    addEventListener("resize", aoRolar);
    return () => {
      removeEventListener("scroll", aoRolar);
      removeEventListener("resize", aoRolar);
      cancelAnimationFrame(raf);
    };
  }, []);

  const cenaVisivel = pronta && !quieto;

  return (
    <section
      ref={secao}
      data-tema="amanhecer"
      aria-labelledby="titulo-hero"
      className={`relative ${quieto ? "h-[300svh]" : "h-[680svh] max-md:h-[560svh]"}`}
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-[#d8c5c9] text-tinta">
        <Poster celular={posterCelular} desktop={posterDesktop} alt={ALT_PONTE} visivel={!cenaVisivel && !(quieto && fase === "chegada")} preload />
        {/* sem movimento: a chegada é uma segunda imagem da cena, trocada por fade */}
        {quieto && <Poster celular={lojaCelular} desktop={lojaDesktop} alt={ALT_LOJA} visivel={fase === "chegada"} />}
        {montar && (
          <div aria-hidden className={`absolute inset-0 transition-opacity duration-700 ${cenaVisivel ? "opacity-100" : "opacity-0"}`}>
            <Seguro aoFalhar={() => setPronta(false)}>
              <Cena progresso={progresso} leve={leve} ativa={naTela} aoPronto={() => setPronta(true)} aoPerder={() => setPronta(false)} />
            </Seguro>
          </div>
        )}

        {/* véu claro no alto: logo e frases legíveis sobre qualquer copa */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[36svh] bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgb(236_226_230/0.62),rgb(236_226_230/0)_72%)]" />

        {/* hero: o primeiro quadro do passeio */}
        <div
          inert={fase !== "hero"}
          className={`absolute inset-x-0 top-0 flex flex-col items-center px-5 pt-[15svh] text-center transition-[opacity,translate] duration-700 ease-saida motion-reduce:translate-y-0 ${fase === "hero" ? "opacity-100" : "pointer-events-none -translate-y-6 opacity-0"}`}
        >
          <h1 id="titulo-hero" className="text-display">
            Cuidado
            <br />a cada passo.
          </h1>
          <div className="mt-9">
            <Botao href="#agendar">Agendar banho</Botao>
          </div>
        </div>

        {/* durante o passeio, agendar continua a um toque */}
        <div
          inert={fase !== "passeio"}
          className={`absolute top-5 right-5 transition-opacity duration-500 md:top-6 md:right-8 ${fase === "passeio" ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <Botao href="#agendar">Agendar</Botao>
        </div>

        {/* frases: só a do trecho atual em destaque */}
        <ol
          aria-label="O que a Íris faz pelo caminho"
          className={`pointer-events-none absolute inset-x-0 top-[12svh] px-5 text-center font-serifa text-frase font-light transition-opacity duration-700 max-md:text-[1.05rem] md:top-[7svh] ${fase === "passeio" ? "opacity-100" : "opacity-0"}`}
        >
          {frases.map((f, i) => (
            <li key={f.texto} aria-current={i === ativa ? "step" : undefined} className={`transition-opacity duration-500 ${i === ativa ? "opacity-100" : "opacity-40"}`}>
              {f.texto}
            </li>
          ))}
        </ol>

        {/* chegada: a frase no céu, a porta é o botão */}
        <div
          inert={fase !== "chegada"}
          className={`absolute inset-x-0 top-[9svh] flex flex-col items-center px-5 text-center transition-[opacity,translate] duration-1000 ease-saida motion-reduce:translate-y-0 ${fase === "chegada" ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
        >
          <p className="font-serifa text-titulo font-extralight">Todo passeio termina aqui.</p>
          <div className="mt-7">
            <Botao href="#agendar">Agendar banho</Botao>
          </div>
        </div>

        {/* a névoa clara sobe do chão, engole a cena e vira o creme da próxima seção */}
        <div
          aria-hidden
          style={{ background: "linear-gradient(to top, #fbf6ee calc(var(--saida, 0) * 100%), rgb(251 246 238 / 0) calc(var(--saida, 0) * 100% + 38%))" }}
          className="pointer-events-none absolute inset-0 opacity-[min(1,calc(var(--saida,0)*5))]"
        />

        <p className="sr-only">
          Pelo caminho aparecem os serviços e produtos da Íris: banho, tosa, spa, rações, petiscos, brinquedos, camas, coleiras e
          Táxi Dog. O passeio termina na porta de uma loja Íris.
        </p>
      </div>
    </section>
  );
}
