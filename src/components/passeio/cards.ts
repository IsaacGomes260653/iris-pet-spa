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
  [3, 0, -1, 8], [3, 0.2, 1, 6], // o último termina junto com o passeio, antes da chegada
];
export const DURACAO_CELULAR = 0.8;

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
  // o empurrão da saída: 0,2 da tela, ou o que for preciso para a foto já estar fora da cachorra quando chegar à altura
  // dela (no celular, a lateral é curta e é o empurrão que a tira da frente)
  const falta = caoMeia + 4 - (lateral - cardW / 2) * kc;
  const empurra = kc > 1.05 && falta > 0 ? Math.max(0.2, falta / ((kc - 1) ** 2 * w)) : 0.2;
  const x = lado * (lateral * k + Math.max(0, k - 1) ** 2 * w * empurra);
  const y = topo + (FOLGA + cardH / 2) * k - h / 2;
  // a etiqueta cresce um pouco com a foto (no celular, no máximo o tamanho real)
  const etiquetaEscala = Math.min(w < 768 ? 1 : 1.25, Math.max(0.75, k));
  // quanto falta para a ponta de fora da etiqueta (no canto de dentro da foto) chegar à borda da tela
  const sobra = w / 2 - (Math.abs(x) - (cardW * k) / 2 + etiquetaW * etiquetaEscala);
  return {
    x,
    y,
    escala: k,
    // entra rápido e sai no fim; a distância é feita pela cor (névoa), não pela transparência
    opacidade: suave(0, 0.08, u) * (1 - suave(0.93, 1, u)),
    longe: 2.5 * (1 - suave(0.3, 0.6, k)),
    perto: 3 * suave(1.3, 1.8, k), // começa antes de a foto sair, para a passagem se ver
    nevoa: 1 - suave(0.25, 0.7, k),
    // aparece quando a foto já é quase tão larga quanto ela; some antes de a sua ponta chegar à borda da tela
    etiqueta: suave(etiquetaW * etiquetaEscala * 0.9, etiquetaW * etiquetaEscala + 8, cardW * k) * suave(0, 24, sobra),
    etiquetaEscala,
  };
}
