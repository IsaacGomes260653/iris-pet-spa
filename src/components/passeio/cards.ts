// Os cards pelo caminho do passeio, como funções contínuas da rolagem (sem tempo, sem saltos). Serve aos dois
// passeios (fotos e quadros renderizados): o componente só mede o palco e aplica o resultado.

type Trajeto = [number, number, -1 | 1, number];

/**
 * Cards por cenário: [cenário, início dentro do trecho, lado, card]. O primeiro de cada cenário é o da frase ativa;
 * as janelas se sobrepõem, então no desktop há sempre um card perto e outro chegando.
 */
export const roteiro: Trajeto[] = [
  [0, 0.15, 1, 0], [0, 0.4, -1, 2], // o primeiro só nasce depois do hero
  [1, 0, -1, 1], [1, 0.4, 1, 7],
  [2, 0, 1, 3], [2, 0.2, -1, 4], [2, 0.4, 1, 5],
  [3, 0, -1, 8], [3, 0.2, 1, 6],
];
export const DURACAO = 0.8; // do card nascer ao longe até passar pela câmera, em fração do trecho do cenário
// no celular, dois por cenário em janelas mais curtas; a ração (a foto mais fraca) fica de fora
export const roteiroCelular: Trajeto[] = [
  [0, 0.15, 1, 0], [0, 0.5, -1, 2],
  [1, 0, -1, 1], [1, 0.45, 1, 7],
  [2, 0, 1, 4], [2, 0.45, -1, 5],
  [3, 0, -1, 8], [3, 0.45, 1, 6],
];
export const DURACAO_CELULAR = 0.6;

/** O que o card precisa saber da tela, medido uma vez por tamanho de janela (px). */
export type Palco = {
  w: number;
  h: number;
  cardW: number; // a foto na escala 1
  cardH: number;
  topo: number; // o topo da foto nunca sobe acima daqui (abaixo da lista de frases, com lugar para a etiqueta)
  caoTopo: number; // onde começa a cachorra (a cabeça)
  caoMeia: number; // meia largura da zona da cachorra, com folga
};

/**
 * Estado de um card num ponto da rolagem. Centro em px (relativo ao centro da tela) e escala; desfoque da distância
 * (`longe`, só na foto) e da passagem (`perto`, no card inteiro); `nevoa` de 1 (longe: lavado, claro) a 0 (perto: cor
 * cheia), aplicada como filtro de cor; a etiqueta com a sua opacidade e escala.
 */
export type Quadro = {
  x: number;
  y: number;
  escala: number;
  opacidade: number;
  longe: number;
  perto: number;
  nevoa: number;
  etiqueta: number;
  etiquetaEscala: number;
};

const FOLGA = 36; // o topo da foto desce de `topo` até esta distância (escala 1) enquanto ela se aproxima

export const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Perspectiva: o card é uma placa ao lado do caminho; `k` (= 1/profundidade) é a escala. Ele nasce minúsculo perto do
 * ponto de fuga, desacelera enquanto está ao lado da cachorra (é quando se lê) e acelera ao passar pela câmera, saindo
 * pela borda (passada a escala 1, a lateral ainda ganha um empurrão que cresce com o quadrado: a saída é rápida e
 * contínua). Tudo vem de `k`, que é suave em `u`: nada salta. A lateral é a mínima que, assim que a foto desce até a
 * altura da cachorra, já a deixa fora da zona dela, mas nunca maior que a que deixa a foto inteira na tela na escala 1
 * (em telas estreitas ou baixas, ler a foto vale mais). O topo nunca sobe acima de `topo`.
 * `u` vai de 0 (nasce) a 1 (passou); fora disso, não existe.
 */
export function quadroDoCard(u: number, lado: -1 | 1, palco: Palco, etiquetaW: number): Quadro | null {
  if (u <= 0 || u >= 1) return null;
  const t = u - 0.5;
  const k = Math.exp(0.9 * t + 12 * t ** 3) / 1.2; // 0,12 → 0,83 (devagar no meio) → 5,9
  const { w, h, cardW, cardH, topo, caoTopo, caoMeia } = palco;
  // a escala em que a base da foto chega à altura da cabeça da cachorra; dali em diante a foto fica ao lado dela
  const kc = Math.max(0.05, (caoTopo - topo) / (FOLGA + cardH));
  const livre = cardW / 2 + caoMeia / kc + 4;
  const cabe = w / 2 - 8 - cardW / 2;
  const lateral = Math.max(cardW / 2 + 8, Math.min(livre, cabe));
  const x = lado * (lateral * k + Math.max(0, k - 1) ** 2 * w * 0.35);
  const y = topo + (FOLGA + cardH / 2) * k - h / 2;
  const etiquetaEscala = Math.min(1.25, Math.max(0.75, k));
  return {
    x,
    y,
    escala: k,
    // entra rápido e sai no fim; a distância é feita pela cor (névoa), não pela transparência
    opacidade: suave(0, 0.08, u) * (1 - suave(0.93, 1, u)),
    longe: 2.5 * (1 - suave(0.3, 0.6, k)),
    perto: 3 * suave(2, 4, k),
    nevoa: 1 - suave(0.25, 0.7, k),
    // aparece quando a foto já é quase tão larga quanto ela; some antes de a foto passar da borda
    etiqueta: suave(etiquetaW * etiquetaEscala * 0.9, etiquetaW * etiquetaEscala + 8, cardW * k) * (1 - suave(1.5, 2, k)),
    etiquetaEscala,
  };
}
