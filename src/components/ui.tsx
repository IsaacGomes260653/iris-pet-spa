/** Etiqueta mono branca de canto vivo (como "PATH OF HURRICANES" na referência). */
export function Etiqueta({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block bg-papel px-2.5 pt-[0.4375rem] pb-[0.375rem] font-mono text-rotulo leading-[1.25] uppercase text-tinta [font-stretch:87.5%] ${className}`}>
      {children}
    </span>
  );
}

/**
 * Pílula branca com quadradinho verde-água; o rótulo "rola" no hover. `compacto` encolhe no celular (barra do topo);
 * `escuro` é a versão verde-água para fundos claros (cards brancos).
 */
export function Botao({
  href,
  children,
  compacto = false,
  escuro = false,
  baixar = false,
}: {
  href: string;
  children: string;
  compacto?: boolean;
  escuro?: boolean;
  baixar?: boolean;
}) {
  return (
    <a
      href={href}
      download={baixar || undefined}
      className={`group inline-flex min-h-11 items-center gap-3 rounded-md py-1.5 pr-1.5 pl-4 font-mono ${escuro ? "bg-agua-funda text-papel" : "bg-papel text-tinta"} ${compacto ? "max-md:min-h-8 max-md:gap-2 max-md:py-1 max-md:pr-1 max-md:pl-3 max-md:text-[0.6875rem]" : ""} text-[0.8125rem] uppercase [font-stretch:87.5%] shadow-[0_6px_24px_-12px_rgb(15_47_49/0.45)] transition-transform duration-200 ease-saida active:scale-[0.97]`}
    >
      <span className="relative overflow-hidden leading-5">
        <span className="block transition-transform duration-300 ease-saida group-hover:-translate-y-full motion-reduce:transition-none">
          {children}
        </span>
        <span aria-hidden className="absolute inset-0 translate-y-full transition-transform duration-300 ease-saida group-hover:translate-y-0 motion-reduce:transition-none">
          {children}
        </span>
      </span>
      <span className={`grid size-8 place-items-center rounded-[4px] text-papel ${escuro ? "bg-papel/15" : "bg-acao"} ${compacto ? "max-md:size-6" : ""}`}>
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
