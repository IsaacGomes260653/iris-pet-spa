# Mídia para baixar à mão

A chave do Pexels está pausada e o Unsplash não tem vídeo nem áudio. Os itens abaixo precisam de download manual.
Depois de baixar, salve **exatamente** com o nome e na pasta indicados (a pasta `media-src/` fica fora do Git) e me mande o link da página de cada arquivo, para o `CREDITS.md`.
Eu cuido da conversão e da otimização (MP4 H.264 + WebM até ~4 MB, versão mobile, poster AVIF/WebP, correção de cor).

## Vídeos (Fase 3 — Banho e tosa em ação)

Fontes: [Pexels Vídeos](https://www.pexels.com/videos/) ou [Pixabay Vídeos](https://pixabay.com/videos/) (licenças livres, sem atribuição obrigatória).
Para os três vídeos:
- **Formato:** horizontal 16:9, 1080p ou mais, de 8 a 20 s.
- **Enquadramento:** sujeito no centro (vou recortar em 4:5 para o celular).
- **Luz:** quente e suave.
- **Cachorro:** de preferência caramelo ou golden.
- **Evite:** marcas, logos e rostos de pessoas em close.

| # | Arquivo | Buscar por | O que precisa aparecer |
|---|---|---|---|
| 1 | `media-src/videos/banho.mp4` | `dog bath`, `dog shower grooming`, `washing dog` | Espuma no pelo, mãos massageando, água morna |
| 2 | `media-src/videos/tosa.mp4` | `dog grooming scissors`, `dog haircut`, `pet groomer` | Tesoura ou máquina aparando o pelo com calma |
| 3 | `media-src/videos/finalizacao.mp4` | `dog blow dry`, `dog grooming dryer`, `brushing dog fur` | Secador ou escova, pelo solto e brilhando, cachorro tranquilo |

## Áudio (Fase 6 — botão SOM)

Fonte: [Pixabay — efeitos sonoros](https://pixabay.com/sound-effects/) (Licença de Conteúdo Pixabay, uso livre). O som só toca quando o visitante liga o botão; nunca automaticamente.

| # | Arquivo | Buscar por | Duração |
|---|---|---|---|
| 4 | `media-src/audio/parque.mp3` | `park ambience birds`, `morning birds park` | 40 s a 2 min, que dê para tocar em loop |
| 5 | `media-src/audio/passos.mp3` *(opcional)* | `footsteps grass`, `footsteps leaves` | 10 a 30 s |

## Fotos que não existem no Unsplash (Fase 2 — o passeio)

Fonte: [Pexels](https://www.pexels.com/) (licença livre). Mesmo enquadramento da referência `docs/referencias/pov-cachorro-4-fotos.png`:
- **Câmera:** na altura do peito, mão segurando a guia na parte de baixo, cachorro caramelo ou golden andando à frente, no centro.
- **Formato:** vertical 3:4 ou 9:16, com pelo menos 2000 px de altura.

| # | Arquivo | Buscar por | Hoje está no lugar |
|---|---|---|---|
| 6 | `media-src/passeio-2-cidade.jpg` | `dog crosswalk pov`, `walking dog crosswalk leash`, `dog leash city pov` | Foto do Unsplash na calçada, sem faixa de pedestres (provisória) |
| 7 | `media-src/passeio-5-loja.jpg` *(opcional)* | `dog pet shop entrance`, `dog waiting store door` | Golden na porta de uma loja, em P&B (vai virar montagem com o logo Íris) |

Depois de salvar as fotos 6 e 7, rode `python scripts/gradear.py` (ou me avise que eu rodo).
