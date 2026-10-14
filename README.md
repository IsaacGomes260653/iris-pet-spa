# Íris Pet Spa

> **Marca fictícia.** Projeto de portfólio. A Íris Pet Spa não existe: nomes, unidades, números, endereços e depoimentos são inventados.

Site de uma rede de petshop (banho, tosa, spa, loja e Táxi Dog) contado como um passeio ao amanhecer em primeira pessoa, com rolagem cinematográfica. A experiência de rolagem foi inspirada no site da Seasats; todo o código, os textos e a mídia são próprios ou de fontes com licença livre.

## O que tem

- **O passeio:** em primeira pessoa, a mão segura a guia e uma cachorra preta anda à frente enquanto o mundo troca entre ponte, alameda, trilha e gramado com neblina. Frases e cards de serviços passam pela câmera; o passeio termina na porta de uma loja Íris.
- **Banho e tosa:** seção fixada em que cada vídeo (banho, tosa e finalização) cresce até a tela inteira, com os detalhes de cada passo, indicador e botão de pausa.
- **Lojas:** começo da seção do mapa, com 62 unidades fictícias em cidades reais (`src/content/lojas.ts`). O globo 3D está em construção.

Tudo responde a `prefers-reduced-motion` e tem versão para celular.

## Tecnologias

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · GSAP + ScrollTrigger · Lenis · Three.js / React Three Fiber · Phosphor Icons

## Como rodar

```bash
npm install
npm run dev
```

- `http://localhost:3000`: o site.
- `http://localhost:3000/estilo`: a direção de arte (tipografia, paleta, componentes, fotos).

Para a versão de produção: `npm run build` e `npm start`.

## Processo

As branches de experimento ficam publicadas para mostrar o caminho até a abertura atual:

- `passeio-3d`: a primeira versão do passeio em 3D em tempo real (React Three Fiber, modelos com compressão Draco).
- `passeio-render`: a tentativa de pré-renderizar o passeio no Blender (`render/cena.py`, com pelo, névoa volumétrica e câmera em primeira pessoa).
- `main`: a versão escolhida, com fotos reais, a cachorra recortada fixa no centro e a fachada montada.

## Mídia

- Fotos do Unsplash e vídeos do Pexels, com a origem de cada arquivo em [`CREDITS.md`](CREDITS.md).
- A correção de cor de amanhecer é aplicada por `scripts/gradear.py`, e os recortes e a montagem da fachada por `scripts/preparar-passeio.py` (Python com Pillow e numpy). Os vídeos são cortados e codificados por `scripts/videos.sh` (ffmpeg).
- Os originais em alta ficam fora do Git, em `media-src/`.

## Créditos

Fotos e vídeos: ver [`CREDITS.md`](CREDITS.md). Fontes: Literata, Hanken Grotesk e Martian Mono (SIL Open Font License). Ícones: Phosphor (MIT).
