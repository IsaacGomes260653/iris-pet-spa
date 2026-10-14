"use client";

import { useEffect, useRef } from "react";

// 1 px CSS = 1/96 de polegada; uma patinha mede uns 10 cm
const METROS_POR_PX = 0.0254 / 96;
const PATINHAS_POR_METRO = 10;

const frases: [number, string][] = [
  [0.3, "Ritmo de cachorro idoso no sofá."],
  [2, "Passeio de domingo, cheirando cada poste."],
  [6, "Trote animado rumo ao parque."],
  [12, "Isso é um golden vendo um esquilo."],
  [Infinity, "Zoomies oficiais. Ninguém segura."],
];

const links = [
  ["Pacotes", "#pacotes"],
  ["Lojas", "#lojas"],
  ["Raio-X", "#raio-x"],
  ["Especialistas", "#especialistas"],
  ["Guia de cuidados", "#guia"],
  ["Agendar", "#agendar"],
];

/** Rodapé com o easter egg: a rolagem medida em patinhas e a velocidade em latidos por segundo. */
export function Rodape() {
  const distancia = useRef<HTMLSpanElement>(null);
  const velocidade = useRef<HTMLSpanElement>(null);
  const frase = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let total = 0;
    let ultimoY = scrollY;
    let ultimoT = performance.now();
    let latidos = 0;
    let raf = 0;
    const quadro = (agora: number) => {
      const dy = Math.abs(scrollY - ultimoY);
      const dt = Math.max(1, agora - ultimoT) / 1000;
      total += dy;
      // velocidade em m/s vira "latidos por segundo" (5 latidos a cada m/s), com média para não tremer
      latidos += ((dy * METROS_POR_PX) / dt * 5 - latidos) * 0.08;
      ultimoY = scrollY;
      ultimoT = agora;
      if (distancia.current) distancia.current.textContent = Math.round(total * METROS_POR_PX * PATINHAS_POR_METRO).toLocaleString("pt-BR");
      if (velocidade.current) velocidade.current.textContent = latidos.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      if (frase.current) frase.current.textContent = frases.find(([limite]) => latidos < limite)![1];
      raf = requestAnimationFrame(quadro);
    };
    raf = requestAnimationFrame(quadro);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <footer data-tema="agua" className="relative z-10 overflow-hidden bg-[linear-gradient(#0c2829,#0a2122)] px-5 pt-[12svh] pb-8 text-papel md:px-[6vw]">
      <div className="grid gap-12 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* o easter egg: decorativo, fora da leitura de tela */}
        <div aria-hidden className="grid grid-cols-2 gap-6">
          <div className="border-t border-papel/25 pt-4">
            <p className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-papel-suave">Distância rolada</p>
            <p className="mt-3 font-mono text-[clamp(2rem,4vw,3.5rem)] leading-none [font-stretch:87.5%]">
              <span ref={distancia}>0</span>
              <span className="ml-2 text-[0.4em] uppercase">patinhas</span>
            </p>
          </div>
          <div className="border-t border-papel/25 pt-4">
            <p className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-papel-suave">Velocidade</p>
            <p className="mt-3 font-mono text-[clamp(2rem,4vw,3.5rem)] leading-none [font-stretch:87.5%]">
              <span ref={velocidade}>0,0</span>
              <span className="ml-2 text-[0.4em] uppercase">latidos/s</span>
            </p>
          </div>
          <p ref={frase} className="col-span-2 font-serifa text-[clamp(1.5rem,2.4vw,2.25rem)] leading-tight font-extralight">
            Ritmo de cachorro idoso no sofá.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <nav aria-label="Seções">
            <p className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-papel-suave">Seções</p>
            <ul className="mt-4 space-y-1">
              {links.map(([nome, href]) => (
                <li key={href}>
                  <a href={href} className="inline-flex min-h-10 items-center hover:underline">
                    {nome}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="font-mono text-rotulo uppercase [font-stretch:87.5%] text-papel-suave">Atendimento</p>
            <p className="mt-4 text-corpo">Todos os dias, das 8h às 22h, em 62 unidades.</p>
            <p className="mt-6 text-[0.875rem] text-papel-suave">
              Marca fictícia: projeto de portfólio. Créditos de fotos, vídeos e textura no{" "}
              <a href="https://github.com/IsaacGomes260653/iris-pet-spa/blob/main/CREDITS.md" className="underline underline-offset-4">
                CREDITS.md
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <p className="mt-[10svh] font-mono text-rotulo leading-[1.4] uppercase [font-stretch:87.5%] text-papel-suave">
        © 2026 Íris Pet Spa · feito com carinho e muitas patinhas
      </p>
      {/* o nome gigante, de margem a margem, como a assinatura no fim da página (espaço para o acento) */}
      <p aria-hidden className="mt-[0.15em] pt-[0.3em] text-center font-serifa text-[57vw] leading-[0.82] font-extralight tracking-[-0.045em] select-none md:text-[54vw]">
        Íris
      </p>
    </footer>
  );
}
