# Estudo da referência — seasats.com

Estudo feito em 01/10/2026 navegando a página com Playwright (desktop 1440×900 e celular 390×844), lendo o DOM e os estilos calculados, e cruzando com prints próprias (guardadas só localmente, em `docs/referencias/`, fora do repositório por serem capturas de um site de terceiros).

- Capturas em sequência (locais, fora do repositório): 46 telas no desktop e 24 no celular, rotuladas pelo `scrollY`.
- Nada daqui será copiado (código, textos, imagens, vídeos). O que reaproveitamos é o **mecanismo**: ritmo, fixação, transições, hierarquia tipográfica.

---

## 1. Visão geral

| Medida | Desktop | Celular |
|---|---|---|
| Altura total da página | 34.212 px (≈ 38 telas) | 28.184 px (≈ 33 telas) |
| Rolagem suave | Lenis (classe `lenis` no `<html>`) | idem |
| Animação de "câmera" | `<canvas>` com **sequência de quadros** comandada pela rolagem (não é vídeo) | idem, recorte vertical |
| Globo | WebGL, canvas 2880×1307 (DPR 2) | globo mais aproximado |
| Vídeos | todos `muted loop autoplay playsinline`, com versão `_mobile` separada | — |

**Ritmo geral:** a página alterna trechos **fixados** (a rolagem vira linha do tempo) com trechos de **rolagem livre**:

```
Hero 1 tela (livre) → Voo/frases 5,6 telas (fixo) → Deploy/Detect/React 4,5 telas (fixo)
→ Globo 1 tela → Produtos + comparativo (livre) → Histórias de produto ≈ 20 telas (fixo, por produto)
→ Liderança → Carreiras → Imprensa → Chamada final → Rodapé (livres)
```

Não há divisórias nem bordas entre seções. Toda passagem é feita por **troca de fundo** (crossfade de gradiente), névoa ou deslizamento.

---

## 2. Elementos globais

### 2.1 Moldura + índice lateral (o "indicador de progresso")
- **No topo (scroll 0):** a página inteira fica dentro de uma moldura off-white `#FFFDFD` de 10 px com cantos arredondados (~12 px). À direita, um painel de 220 px com o **índice das seções** em blocos coloridos:
  - `Home`, `01 Capabilities`, `02 Past Missions` → pêssego-rosado `#D7C5BA`
  - `Products`, `01 Comparison` … `04 Heavyfish` → sálvia `#B7C8BE`
  - `Leadership` `#8E9489` → `Careers` `#757D70` → `Press` `#4B5746` → `Contact` `#2B3922` (verdes cada vez mais escuros, texto branco)
  - Números das subseções em cinza claro antes do nome (`01 Capabilities`). Fonte sans 15 px.
- **Ao começar a rolar:** moldura e painel se recolhem, o hero vira tela cheia e sobra só uma **barra vertical de 6 px** colada na borda direita, segmentada com as mesmas cores, com altura de cada segmento **proporcional ao tamanho da seção**.
- Um **triângulo ▶ de 10 px** desliza ao lado da barra marcando a posição atual.
- **Passar o mouse na borda direita** reabre o painel (a página encolhe de novo para o "cartão" com moldura) e mostra uma miniatura da seção mais próxima do cursor.
- No celular a barra some; fica só o botão `MENU` (pílula branca, mono 12 px) no canto superior direito.

> **Observação importante:** o "▶" que aparece no canto superior direito das prints **não é um botão de som/play** — é o marcador da barra de progresso (ele desce junto com a rolagem). A Seasats não tem controle de som. Proposta para a Íris na tabela da seção 5.

### 2.2 Logo
Wordmark no canto superior esquerdo (≈ 28 px da borda, 144 px de largura), branco sobre fundos escuros e grafite `#232323` sobre fundos claros — troca de cor junto com o tema.

### 2.3 Fundo por tema (camada fixa)
Uma camada `position: fixed` com gradientes que fazem **crossfade** quando uma seção entra:

| Tema | Gradiente (de cima para baixo) |
|---|---|
| Claro (padrão) | `#EEF4EF` 59% → `#FFEFD2` 84% → `#E2FFDB` 98% → `#FFFFFF` |
| Verde (missões) | `#4E9A85` → `#183F34` 53% → `#2B3922` 76% |
| Laranja (Quickfish/rodapé) | `#E08826` → `#ECA43B` → `#CA612A` 34% → `#752210` 75% → `#370E0A` |
| Hero/voo (fallback do vídeo) | `#A3BAC6` → `#CBC7C9` 26% → `#C3BABA` 49% → `#6C818E` 74% → `#203543` |

O tema claro é a "assinatura": quase branco esverdeado em cima, faixa **pêssego** perto de 85% e um **verde-menta** no rodapé da tela. É o que dá o ar de "amanhecer" mesmo nas seções brancas.

### 2.4 Tipografia (3 famílias, uma por função)
| Função | Fonte | Detalhes medidos |
|---|---|---|
| Títulos | `seasonMix` (serifa de traço fino, peso 400) | H1 124 px / entrelinha 0,9 / tracking −1%; H2 80 px / 1,0; H3 64 px / 1,0 |
| Texto | `seasonSans` (grotesca) | 16–24 px, entrelinha 1,4 |
| Rótulos, botões, dados | `supplyMono` (mono) | 12–14 px, MAIÚSCULAS, tracking normal |

Cores de texto: grafite `#232323` no claro, off-white `#FFFDFD` no escuro.

### 2.5 Etiquetas e botões
- **Etiqueta de card** ("PATH OF HURRICANES"): caixa branca sólida, mono maiúsculo preto, encostada na **borda superior direita** da foto, sem raio. Escala junto com o card (fica minúscula quando o card está longe).
- **Botão**: pílula branca (`#FFFDFD`, raio ~6 px) com texto mono 14 px + quadradinho escuro `#2B3922` com seta. No hover o texto "rola" (há duas cópias do rótulo que trocam de lugar).
- **Filtros/abas**: contêiner branco com raio ~8 px; item ativo com fundo `#2B3922` e texto branco (ou a cor do produto).

---

## 3. Seção a seção

### S0 — Hero · `0 → 900 px` (1 tela)
- **O que se vê:** vídeo em loop de um barco autônomo parado num mar espelhado ao amanhecer, névoa lavanda/rosada no horizonte, água azul-acinzentada escura embaixo. Título branco enorme centralizado em 2 linhas, botão `EXPLORE PRODUCTS` centralizado embaixo.
- **Na rolagem:** a moldura e o índice se recolhem (hero vira tela cheia), o título some, e o vídeo é substituído pelo canvas: a câmera se afasta do barco e então "embarca", até ficar em primeira pessoa no convés.
- **Passagem:** contínua — o hero já é o primeiro quadro do voo.

### S1 — O voo com as frases · `900 → 5.940 px` (≈ 5,6 telas, fixado)
Referência direta da nossa Seção 1.
- **Câmera:** primeira pessoa no convés (proa e cúpula do radar no centro inferior), avançando devagar sobre o mar. A rolagem comanda os quadros, então andar = rolar.
- **Lista de frases (topo, centralizada):** 6 frases em serifa ~30 px, entrelinha apertada. A ativa fica branca 100%, as outras a ~45% de opacidade. Troca a cada **~450 px (meia tela)**. Não há rolagem da lista — só a opacidade muda.
- **Cards pelo caminho:** cada frase tem uma foto com etiqueta mono. O card nasce **pequeno perto do horizonte** (~180 px de largura, etiqueta ilegível de tão pequena), cresce e se afasta do centro para a esquerda ou direita (alternando), chega a ~430 px nítido e então **passa pela câmera**: enorme, cortado pela borda da tela, translúcido e desfocado (profundidade de campo). Há sempre 2–3 cards em profundidades diferentes ao mesmo tempo.
- **Fim do voo (3.150 → 4.500):** a câmera recua (aparecem antenas desfocadas em primeiro plano), depois sobe para uma vista aérea da frota (5 barcos em formação). Frase de desfecho em serifa ~60 px centralizada **na parte de baixo**.
- **Passagem (4.500 → 5.400):** a cena "entra na névoa": o gradiente claro (branco-esverdeado → pêssego → menta) sobe por cima da imagem, o texto se dissolve e os 3 cards de vídeo da próxima seção surgem de baixo. Não há corte.
- **Celular:** mesma sequência em recorte vertical; frases menores; 2 cards menores sobrepostos.

### S2 — "Deploy in minutes. Detect from miles. React at once." · `5.040 → 9.090 px` (≈ 4,5 telas, fixado)
Referência da nossa Seção 2.
- **Estado inicial:** fundo claro. Título em 3 linhas centralizadas, serifa grafite, cada linha é uma frase curta com ponto final. Fileira de **3 cards de vídeo** (~215×120, raio ~8 px) colada na base da tela.
- **Na rolagem:** o card 1 cresce até **ocupar a tela inteira** (sobra só um respiro de ~8 px e cantos arredondados — é um FLIP a partir da fileira). A frase correspondente vai para o **canto superior esquerdo** (64 px, branca). Embaixo surgem **4 colunas** com ícone, título curto (sans 20 px) e descrição; em cima de cada coluna, uma linha fina com um **trecho branco que avança** (progresso dentro do capítulo).
- Cada capítulo dura ≈ 1–1,3 tela; o vídeo troca para o card 2 e depois para o 3 (mesma moldura cheia, sem voltar para a fileira no meio).
- **Passagem:** no fim do 3º vídeo, uma camada **verde-água** tinge o vídeo por cima até ele sumir, e o fundo vira o tema verde da próxima seção.
- **Celular:** nada fixado. Empilhado: título → card de vídeo → lista de recursos, três vezes.

### S3 — "Mission after mission" (globo) · `8.550 → 9.990 px`
Referência da nossa Seção 3.
- **Layout:** fundo verde (`#4E9A85` → `#183F34` → `#2B3922`). Título 80 px branco **alinhado à esquerda** no terço superior, subtítulo sans 20 px em 3 linhas ("Click and drag to explore…").
- **Globo:** textura realista com oceano tingido de verde-azulado e continentes bege-esverdeados, halo de atmosfera verde-claro. Ocupa **a metade de baixo** da tela, cortado pela borda inferior, centrado na região de atuação.
- **Marcadores:** círculos **pontilhados** com ícone branco no centro; rotas em **linha pontilhada** com ícones percorrendo a rota.
- **Interação:** arrastar gira; passar/clicar num marcador abre ao lado uma miniatura redonda + título serifa + subtítulo.
- **Filtros em pílula** na base, centralizados: `ALL · COMMERCIAL · DEFENSE · SCIENCE`.
- **Passagem:** o globo sobe com a página e a seção clara seguinte **desliza por cima** (único corte "seco" da página).
- **Celular:** globo bem aproximado + carrossel de cards de missão (data mono, título, `READ MORE +`).

### S4 — "Satellites at sea" · `9.990 → 10.863 px` (livre)
Título 124 px centralizado grafite, subtítulo centralizado, e uma composição dos 3 produtos sobrepostos (recortados, sem fundo) que sobe com parallax.

### S5 — Comparativo em ficha técnica · `10.863 → 12.046 px` (livre)
- Título em 2 linhas à esquerda + parágrafo à direita (grid de 2 colunas assimétrico).
- 3 colunas: cabeçalho com foto sobre o **gradiente do tema** de cada produto (prévia da cor da história dele), nome em serifa 36 px centralizado, adjetivos em sans.
- Linhas de especificação em **mono maiúsculo 14 px**, coluna de rótulos à esquerda (`ROLE`, `TOP SPEED`, `WEIGHT`…), células com fundo translúcido claro e raio 8 px, divisórias finas.
- **Celular:** abas para trocar o produto exibido.

### S6 — Histórias de produto · `12.046 → 29.800 px` (≈ 20 telas, fixadas por produto)
- Nome do produto em serifa 124 px à esquerda + parágrafo grande à direita.
- **Render fixado** que gira/aproxima com a rolagem (sequência de quadros): perfil → close na proa → vista de cima → perfil de novo. Cards de vídeo flutuam por cima em profundidades diferentes (parallax).
- Blocos de texto ("The vessel, in brief"), lista de virtudes à esquerda (ícone, título, frase, linhas finas).
- **Visão técnica:** pontos `+` clicáveis sobre o render (hotspots), abas `BASE MODEL · SECURITY · HYDROGRAPHIC · ENVIRONMENTAL` que trocam o texto e a lista de specs (mono, rótulo à esquerda, valor à direita), botão `DOWNLOAD FULL STATS`, chave **X-RAY VIEW** no canto inferior esquerdo.
- **Seletor fixo** em pílula na base (silhueta + nome mono) — o ativo ganha a cor do produto.
- **Troca de tema por produto:** claro → laranja → verde, por crossfade do fundo fixo.

### S7 — Liderança · `29.773 px`
Título à esquerda; 6 retratos (cantos arredondados, fundo verde-oliva) em carrossel com setas no canto superior direito; nome em serifa 20 px + cargo em sans cinza.

### S8 — Carreiras · `30.375 px`
Título em 2 linhas de 120 px à esquerda ("Join the crew. / Build the future."); foto arredondada à esquerda; texto + botão com seta ↗ à direita.

### S9 — Imprensa · `31.155 px`
Card grande à esquerda + lista de 4 à direita: etiqueta da fonte (pílula mono verde-clara), título em serifa, `TIPO | DATA` em mono, miniatura à direita.

### S10 — Chamada final · `32.253 px`
"Take action" em 124 px centralizado; linha com 3 frases curtas; botão `CONTACT US`; cidade e e-mail centralizados; peças do produto subindo da base.

### S11 — Rodapé · `33.312 px`
- Tema laranja com silhueta do produto e montanhas/nuvens desfocadas.
- **Easter egg à esquerda:** `DISTANCE SCROLLED` → **3.3 METERS** (dígitos mono grandes) e `AV SCROLL SPEED` → **0.098 KNOTS**, seguidos de uma frase poética que muda conforme a velocidade ("como uma pena num mar parado").
- Centro: links em serifa; direita: contato em mono; **wordmark gigante** ocupando a largura inteira na base.

---

## 4. O que faz a Seasats parecer "cara"

1. **Uma ideia por tela.** Cada momento tem um título, uma imagem e no máximo uma interação.
2. **Rolagem = câmera.** O visitante não "lê uma página", ele anda (voo) e aproxima (vídeos, renders).
3. **Profundidade real.** Cards em 3 planos, desfoque de quem passa perto, render com sombras.
4. **Cor contínua.** O fundo nunca troca de repente; sempre há um gradiente intermediário.
5. **Serifa leve e grande + mono pequena.** O contraste de escala (124 px × 12 px) faz todo o trabalho; quase não há peso bold.
6. **Detalhe que recompensa quem explora:** marcador ▶, hover do índice, texto que rola nos botões, rodapé que mede a rolagem.

---

## 5. Tabela — Seção da Seasats → Seção da Íris

| # | Seasats | Íris Pet Spa (nossa versão) | Fase |
|---|---|---|---|
| G1 | Moldura off-white + índice de seções em blocos coloridos (aparece no topo e no hover da borda) | Mesma mecânica com o índice da Íris: `Início`, `01 O passeio`, `02 Banho & tosa`, `03 Lojas`, `Pacotes`, `Raio-X`, `A rede`, `Especialistas`, `Clientes`, `Agendar` — blocos em lavanda/pêssego → creme/menta → verdes-água cada vez mais escuros | 6 |
| G2 | Barra de 6 px segmentada + marcador ▶ | Barra segmentada com as cores das 3 paletas da Íris, segmentos proporcionais ao tamanho real das seções, marcador em forma de triângulo; clique no segmento leva à seção | 6 |
| G3 | Logo discreto no canto superior esquerdo, troca de cor com o tema | Wordmark "Íris" (serifa leve) no mesmo lugar, troca branco/grafite conforme o fundo | 1 / 6 |
| G4 | *(não existe — o ▶ é o marcador)* | **Botão de som** no canto superior direito, pílula branca com ícone e rótulo mono `SOM`. Desligado por padrão; ao ligar, toca um ambiente de parque (passarinhos, passos, coleira). **Precisa da sua decisão** (ver relatório) | 6 |
| G5 | Fundo fixo com crossfade de gradientes por tema | Mesmo sistema com os 3 temas pedidos: (1) amanhecer lavanda/pêssego/azul-acinzentado, (2) creme → pêssego → menta, (3) verde-água profundo | 1 |
| G6 | Botão pílula + quadradinho com seta, texto que rola no hover | Mesmo padrão: `AGENDAR BANHO`, `COMO CHEGAR`, `BAIXAR GUIA` | 1 |
| S0 | Hero: vídeo do barco ao amanhecer + título 124 px + `EXPLORE PRODUCTS` | Hero = **primeiro quadro do passeio** (ponte de madeira no parque ao amanhecer, mão com a guia, cachorro caramelo à frente) + título serifa leve "Cuidado a cada passo." + `AGENDAR BANHO`. Ao rolar, o título some e o passeio começa | 2 |
| S1 | Voo em primeira pessoa no convés + lista de 6 frases + cards que passam pela câmera | **O passeio em primeira pessoa**: 5 cenários (ponte → faixa de pedestres → praia → trilha → porta da loja Íris), ~5 telas fixadas, zoom lento dentro do cenário e zoom forte + desfoque + crossfade na troca. Lista de 5 frases no topo ("O banho que acalma." / "A tosa que respeita cada raça." / "A loja com tudo que ele ama." / "O spa que ele merece." / "O Táxi Dog que busca e leva."). 2 cards por cenário (ver abaixo) | 2 |
| S1b | Câmera sobe para vista aérea + frase de desfecho na base | **Chegada na porta da loja Íris**: logo aparece na fachada/vidro, frase de desfecho na base: "Todo passeio termina aqui." | 2 |
| S1c | Névoa clara sobe e dissolve a cena; vídeos surgem de baixo | O amanhecer "clareia" até o creme (tema 2); os 3 cards de vídeo de banho/tosa sobem da base | 2 / 3 |
| S2 | "Deploy in minutes. / Detect from miles. / React at once." + 3 vídeos que expandem para tela cheia com 4 colunas de recursos | **Banho e tosa em ação**: "Banho em minutos. / Tosa sob medida. / Carinho do começo ao fim." + vídeos Banho, Tosa e Finalização. Cada um expande (GSAP Flip), com etiqueta mono, legenda curta do passo e 4 colunas (ex.: Banho → água morna na medida, shampoo por tipo de pelo, secagem silenciosa, ouvidos protegidos). No fim os três voltam para a fileira (pedido seu; a Seasats não volta). Indicador do vídeo ativo + botão pausar | 3 |
| S2b | Vídeo tingido de verde-água até sumir | Mesmo efeito: o 3º vídeo é tingido de verde-água e o fundo vira o tema 3 | 3 / 4 |
| S3 | "Mission after mission" + globo na metade de baixo + marcadores pontilhados + rotas + filtros | **"Patinha após patinha"** + "A Íris está em todo o Brasil. Arraste para explorar nossas unidades." Globo R3F (NASA Blue Marble) centrado no Brasil, marcadores pontilhados pulsantes com patinha, rotas pontilhadas do Táxi Dog, filtros `TODAS · BANHO & TOSA · LOJAS · SPA · TÁXI DOG`, card da unidade ao clicar, botão "Ver em lista" | 4 |
| S4 | "Satellites at sea" + composição dos 3 produtos | **Abertura dos pacotes**: "Um cuidado para cada pelagem." + composição de 3 fotos de pets (um por pacote) subindo com parallax | 5 |
| S5 | Comparativo em ficha técnica (3 colunas, mono, abas no celular) | **Comparativo de pacotes**: Banho Essencial · Banho & Tosa · Spa Premium. Linhas mono: `DURAÇÃO`, `INDICADO PARA`, `SHAMPOO`, `SECAGEM`, `TOSA`, `HIDRATAÇÃO`, `EXTRAS`, `A PARTIR DE`. Cabeçalho de cada coluna com o gradiente do seu tema. Abas no celular | 5 |
| S6 | Render fixado girando + hotspots + abas + X-RAY + seletor fixo + troca de tema por produto | **Raio-X do Cuidado**: foto de perfil de um cachorro fixada, pontos `+` (olhos, orelhas, dentes, pelagem, patas, unhas) que mudam conforme o pacote escolhido no seletor fixo em pílula; lista "o que está incluso" em mono; chave "RAIO-X" mostra a camada de cuidados. Fundo troca de tema por pacote. Bem mais curto que o da Seasats (≈ 3 telas, não 20) | 5 |
| — | *(sem equivalente; os dígitos mono do rodapé inspiram)* | **A rede em números**: contadores animados em mono grande (unidades, cidades, banhos/mês, nota média, km de Táxi Dog) | 5 |
| S7 | Liderança: retratos em carrossel com setas | **Especialistas**: carrossel arrastável de tosadores, groomers e veterinárias (foto, nome em serifa, especialidade em sans) | 5 |
| S9 | Imprensa: card grande + lista com etiqueta de fonte | **Depoimentos**: card grande + lista, etiqueta mono da origem (`GOOGLE ★ 4,9`, `INSTAGRAM`, `TÁXI DOG`) + **Perguntas frequentes** (acordeão) | 5 |
| S8 | Carreiras: título 2 linhas + foto + texto + botão | **Guia de cuidados**: "Pelo bonito. / Rotina simples." + foto + texto + `BAIXAR GUIA (PDF)` (PDF gerado de verdade) | 5 |
| S10 | "Take action" + 3 frases curtas + `CONTACT US` | **Chamada final**: "Hora do banho." + "Escolha a unidade. Marque o horário. Ele volta cheiroso." + `AGENDAR BANHO` + central/WhatsApp | 5 |
| S11 | Rodapé laranja: metros rolados + velocidade em nós + frase + wordmark gigante | **Rodapé**: `DISTÂNCIA ROLADA` em **patinhas**, `VELOCIDADE` em **latidos por segundo**, frase divertida conforme a velocidade ("Ritmo de cachorro idoso no sofá." / "Isso é um golden vendo um esquilo."), links, contato e wordmark "Íris" gigante | 5 |

### Cards do passeio (proposta, 2 por cenário; no celular só o primeiro)

| Cenário | Frase ativa | Card principal | Card secundário |
|---|---|---|---|
| 1. Ponte de madeira no parque | O banho que acalma. | `BANHO — ESPUMA DE AVEIA` | `COLEIRAS E GUIAS` |
| 2. Faixa de pedestres | A tosa que respeita cada raça. | `TOSA — NA TESOURA` | `BRINQUEDOS` |
| 3. Praia | A loja com tudo que ele ama. | `LOJA — RAÇÕES PREMIUM` | `PETISCOS NATURAIS` |
| 4. Trilha do parque | O spa que ele merece. | `SPA — HIDRATAÇÃO` | `CAMAS E CASINHAS` |
| 5. Porta da loja Íris | O Táxi Dog que busca e leva. | `TÁXI DOG` | `AGENDA ONLINE` |

### Ritmo proposto para a Seção 1 (desktop)
A Seasats gasta ~0,5 tela por frase porque o voo é contínuo. Com fotos paradas, cada cenário precisa de mais tempo para o zoom "andar":

```
0,00 – 0,85  cenário 1 (zoom lento 1,00 → 1,10; cards 1 e 2 se aproximam)
0,85 – 1,00  transição (zoom 1,10 → 1,35 + desfoque + crossfade)
… repete para os cenários 2, 3 e 4 …
4,00 – 5,00  cenário 5: chegada na loja, logo, frase de desfecho, fundo clareia para o creme
```

---

## 6. Diferenças que vão exigir cuidado

1. **Continuidade.** A Seasats tem um render 3D contínuo; nós teremos 5 fotos paradas. Sem cuidado, vira "slideshow com zoom". O que compensa: correção de cor única (amanhecer), mesma altura de câmera e mesma posição da mão/guia em todas as fotos, cards em 3 profundidades e transição com desfoque de movimento.
2. **Mesmo cachorro em todas as fotos.** Bancos gratuitos raramente têm uma série POV com o mesmo cão em 5 lugares. Vamos buscar o mais próximo possível (caramelo/golden, mesmo enquadramento) e uniformizar a cor; pode não ficar idêntico.
3. **Cards com etiqueta "WORD — fragment" em mono maiúsculo** é um padrão que pode soar como clichê de template; aqui ele é **pedido explícito** e faz parte da linguagem da referência, então fica — mas usado só nos cards do passeio, nos botões e nas fichas técnicas, não acima de todo título.
4. **Seasats não volta os vídeos para a fileira** no fim da S2; você pediu que voltem. Vamos fazer como pedido.
