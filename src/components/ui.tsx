import Image, { type StaticImageData } from "next/image";

/** Etiqueta mono branca de canto vivo (como "PATH OF HURRICANES" na referência). */
export function Etiqueta({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block bg-papel px-2.5 pt-[0.4375rem] pb-[0.375rem] font-mono text-rotulo leading-[1.25] uppercase text-tinta [font-stretch:87.5%] ${className}`}>
      {children}
    </span>
  );
}

/** Pílula branca com quadradinho verde-água; o rótulo "rola" no hover. */
export function Botao({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="group inline-flex min-h-11 items-center gap-3 rounded-md bg-papel py-1.5 pr-1.5 pl-4 font-mono text-[0.8125rem] uppercase text-tinta [font-stretch:87.5%] shadow-[0_6px_24px_-12px_rgb(15_47_49/0.45)] transition-transform duration-200 ease-saida active:scale-[0.97]"
    >
      <span className="relative overflow-hidden leading-5">
        <span className="block transition-transform duration-300 ease-saida group-hover:-translate-y-full motion-reduce:transition-none">
          {children}
        </span>
        <span aria-hidden className="absolute inset-0 translate-y-full transition-transform duration-300 ease-saida group-hover:translate-y-0 motion-reduce:transition-none">
          {children}
        </span>
      </span>
      <span className="grid size-8 place-items-center rounded-[4px] bg-acao text-papel">
        <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 7h10M8 3l4 4-4 4" />
        </svg>
      </span>
    </a>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-serifa text-[1.875rem] font-light leading-none tracking-[-0.03em] ${className}`}>
      Íris<span className="sr-only"> Pet Spa</span>
    </span>
  );
}

/**
 * Foto de cena em tela cheia. No celular (retrato) cobre a tela; em telas largas a foto
 * vertical fica centralizada sobre uma versão desfocada dela mesma, com as bordas esfumadas.
 */
export function CenaFoto({ foto, alt, preload = false }: { foto: StaticImageData; alt: string; preload?: boolean }) {
  // em tela larga, a foto vertical é recortada no máximo até 3:4 para não virar uma tarja estreita
  const proporcao = Math.max(foto.width / foto.height, 3 / 4);
  return (
    <div className="absolute inset-0 overflow-hidden bg-ardosia">
      <Image src={foto} alt="" aria-hidden fill sizes="96px" quality={60} className="scale-110 object-cover blur-3xl brightness-90" />
      <div
        style={{ "--ar": proporcao } as React.CSSProperties}
        className="absolute inset-0 paisagem:right-auto paisagem:left-1/2 paisagem:aspect-(--ar) paisagem:-translate-x-1/2 paisagem:mask-x-from-82% paisagem:mask-x-to-100%"
      >
        <Image
          src={foto}
          alt={alt}
          fill
          preload={preload}
          sizes={`(min-aspect-ratio: 4/5) ${Math.ceil(100 * proporcao)}vh, 100vw`}
          className="object-cover"
        />
      </div>
    </div>
  );
}
