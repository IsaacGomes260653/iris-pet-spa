/** Caminho de um arquivo de public/ com o prefixo do site (no GitHub Pages, /iris-pet-spa; local, nenhum). */
export const publico = (caminho: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${caminho}`;
