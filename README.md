# Íris Pet Spa

> **Marca fictícia.** Projeto de portfólio. A Íris Pet Spa não existe: nomes, unidades, números, endereços e depoimentos são inventados.

Site de uma rede de petshop (banho, tosa, spa, loja e Táxi Dog) contado como um passeio ao amanhecer em primeira pessoa, com rolagem cinematográfica.

## Tecnologias

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · GSAP + ScrollTrigger · Lenis · React Three Fiber

## Como rodar

```bash
npm install
npm run dev
```

- `http://localhost:3000`: o site.
- `http://localhost:3000/estilo`: a direção de arte (tipografia, paleta, componentes, fotos).

## Mídia

Fotos do Unsplash, com a origem de cada arquivo em [`CREDITS.md`](CREDITS.md). A correção de cor de amanhecer é aplicada por `scripts/gradear.py` (requer Python com Pillow e numpy) a partir dos originais em `media-src/`, que ficam fora do Git.
