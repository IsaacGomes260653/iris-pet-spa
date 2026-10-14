import Image from "next/image";
import { Botao } from "@/components/ui";
import { fotoGuia, indice } from "@/content/secoes";
import { Rotulo } from "./Rotulo";

export function Guia() {
  return (
    <section id="guia" data-tema="creme" aria-labelledby="titulo-guia" className="relative z-10 px-5 py-[14svh] md:px-[6vw]">
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-[6vw]">
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
        <div className="relative aspect-[3/2] overflow-hidden rounded-[14px]">
          <Image src={fotoGuia} alt="Pastor-alemão preto deitado num gramado cheio de flores amarelas." fill sizes="(max-width: 768px) 92vw, 44vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}
