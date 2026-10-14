import Image from "next/image";
import { Botao } from "@/components/ui";
import { fotoGuia, indice } from "@/content/secoes";
import { Rotulo } from "./Rotulo";

export function Guia() {
  return (
    <section id="guia" data-tema="creme" aria-labelledby="titulo-guia" className="[content-visibility:auto] [contain-intrinsic-size:auto_900px] relative z-10 px-5 py-[14svh] md:px-[6vw]">
      <div className="grid items-center gap-12 md:grid-cols-[minmax(0,9fr)_minmax(0,11fr)] md:gap-[6vw]">
        <div>
          <Rotulo numero={indice.guia}>Guia de cuidados</Rotulo>
          <h2 id="titulo-guia" className="mt-6 text-titulo">
            Pelo bonito.
            <br />
            Rotina simples.
          </h2>
          <p className="mt-6 max-w-[40ch] text-lead text-tinta-suave">
            O que dá para fazer em casa entre um banho e outro: escova, unhas, orelhas, dentes e os sinais que pedem veterinário. Duas
            páginas, sem enrolação.
          </p>
          <div className="mt-8">
            <Botao href="/guia-de-cuidados.pdf" escuro baixar>
              Baixar guia (PDF)
            </Botao>
          </div>
        </div>
        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] md:aspect-[5/4]">
            <Image src={fotoGuia} alt="Pastor-alemão preto deitado num gramado cheio de flores amarelas." fill sizes="(max-width: 768px) 92vw, 52vw" className="object-cover" />
          </div>
          {/* a capa do PDF, como um impresso apoiado na foto */}
          <a
            href="/guia-de-cuidados.pdf"
            download
            aria-hidden
            tabIndex={-1}
            className="absolute -bottom-8 left-5 flex aspect-[210/297] w-[38%] max-w-[220px] -rotate-3 flex-col justify-between bg-[linear-gradient(180deg,#b9bed4_0%,#d3c4d3_30%,#eccbbd_58%,#93a3b5_85%,#2c394a_100%)] p-4 text-papel shadow-[0_24px_50px_-20px_rgb(34_37_43/0.55)] transition-transform hover:-rotate-1 md:-left-10"
          >
            <span className="font-serifa text-[0.95rem] font-light text-ardosia">Íris</span>
            <span>
              <span className="block bg-papel px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase text-tinta [font-stretch:87.5%] w-fit">Guia de cuidados</span>
              <span className="mt-2 block font-serifa text-[clamp(1rem,1.6vw,1.375rem)] leading-[1] font-light text-ardosia">Pelo bonito. Rotina simples.</span>
            </span>
            <span className="font-mono text-[0.5625rem] uppercase [font-stretch:87.5%]">2 páginas · PDF · 96 KB</span>
          </a>
        </div>
      </div>
    </section>
  );
}
