/** Número e nome da seção, em mono, como o índice da referência ("04 · Pacotes"). */
export function Rotulo({ numero, children, claro = false }: { numero: string; children: string; claro?: boolean }) {
  return (
    <p className={`flex items-center gap-3 font-mono text-rotulo uppercase [font-stretch:87.5%] ${claro ? "text-papel-suave" : "text-tinta-suave"}`}>
      <span>{numero}</span>
      <span aria-hidden className="h-px w-8 bg-current opacity-50" />
      <span>{children}</span>
    </p>
  );
}
