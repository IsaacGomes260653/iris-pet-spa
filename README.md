# Íris Pet Spa

> **Marca fictícia.** Projeto de portfólio. A Íris Pet Spa não existe: nomes, unidades, números, preços, endereços e depoimentos são inventados.

Site de uma rede de petshop (banho, tosa, spa, loja e Táxi Dog) contado como um passeio ao amanhecer em primeira pessoa, com rolagem cinematográfica. A experiência de rolagem foi inspirada no site da Seasats; todo o código, os textos e a mídia são próprios ou de fontes com licença livre.

## O que tem

1. **O passeio:** em primeira pessoa, a mão segura a guia e uma cachorra preta anda à frente enquanto o mundo troca entre ponte, alameda, trilha e gramado com neblina. Frases e cards de serviços passam pela câmera; no fim ela entra na loja Íris.
2. **Banho e tosa:** seção fixada em que cada vídeo (banho, tosa e finalização) cresce até a tela inteira, com os detalhes de cada passo, indicador e botão de pausa.
3. **Lojas:** globo 3D (React Three Fiber, textura NASA Blue Marble) com 62 unidades fictícias em cidades reais, filtros em pílula, rotas do Táxi Dog, card da unidade e uma lista acessível com busca.
4. **Pacotes:** comparativo em ficha técnica.
5. **Raio-X do cuidado:** pontos na foto que mudam conforme o pacote, e uma chave que revela a "radiografia".
6. **A rede em números:** contadores animados.
7. **Especialistas:** carrossel arrastável.
8. **Clientes e dúvidas:** depoimentos e perguntas frequentes.
9. **Guia de cuidados:** um PDF de verdade, gerado por `scripts/gerar-guia.mjs`.
10. **Agendar:** a chamada final, com a cachorra esperando na porta.
11. **Rodapé:** a rolagem medida em patinhas e a velocidade em latidos por segundo.

Por toda a página: índice lateral segmentado com o marcador ▶, o botão **SOM** (ambiente de parque, desligado por padrão, nunca toca sozinho) e o fundo que troca de tema (amanhecer, creme e verde-água).

## Acessibilidade e desempenho

- `prefers-reduced-motion` respeitado em todas as seções: sem zoom, sem rotação do globo, vídeos parados e seções empilhadas.
- Pausa para os vídeos e para o som; link "Pular a abertura"; foco visível em duas camadas; o globo tem uma lista equivalente navegável por teclado.
- Mídia otimizada: AVIF/WebP responsivos, vídeos em MP4 (H.264) e WebM com versões para celular, posters que só carregam perto da seção, globo carregado só quando a seção se aproxima.
- Lighthouse (build de produção, local):

| | Performance | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| Desktop | 99 | 100 | 100 | 100 |
| Celular | 83 | 100 | 100 | 100 |

No celular, o LCP medido na execução é de 0,9 s; a nota de performance é puxada pela estimativa do Lighthouse com CPU 4× mais lenta (o JavaScript das animações e do 3D).

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

## Mídia e scripts

- Fotos do Unsplash, vídeos do Pexels, textura da Terra da NASA e som do Freesound, com a origem de cada arquivo em [`CREDITS.md`](CREDITS.md).
- `scripts/gradear.py`: correção de cor única de amanhecer. `scripts/preparar-passeio.py`: recortes da cachorra e da mão e montagem da fachada. `scripts/preparar-globo.py`: textura do globo. `scripts/videos.sh`: cortes e codificação dos vídeos (ffmpeg). `scripts/gerar-guia.mjs`: o PDF do guia.
- `scripts/capturar-*.mjs`: capturas com Playwright em vários pontos da rolagem (desktop e celular).
- Os originais em alta ficam fora do Git, em `media-src/`.

## Créditos

Fotos, vídeos, textura e som: ver [`CREDITS.md`](CREDITS.md). Fontes: Literata, Hanken Grotesk e Martian Mono (SIL Open Font License). Ícones: Phosphor (MIT).
