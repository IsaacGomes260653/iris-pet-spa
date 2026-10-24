// Os cards pelo caminho do passeio, como funções contínuas da rolagem (sem tempo, sem saltos). Serve aos dois
// passeios (fotos e quadros renderizados): o componente só mede o palco e aplica o resultado.

/**
 * Cards por cenário: [cenário, início dentro do trecho, lado, card]. O primeiro de cada cenário é o da frase ativa;
 * as janelas se sobrepõem, então no desktop há sempre um card perto e outro chegando. No celular, só o principal.
 */
export const roteiro: [number, number, -1 | 1, number][] = [
  [0, 0.12, 1, 0], [0, 0.4, -1, 2], // o primeiro só nasce depois do hero
  [1, 0, -1, 1], [1, 0.4, 1, 7],
  [2, 0, 1, 3], [2, 0.2, -1, 4], [2, 0.4, 1, 5],
  [3, 0, -1, 8], [3, 0.2, 1, 6],
];
export const DURACAO = 0.8; // do card nascer ao longe até passar pela câmera, em fração do trecho do cenário

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

/** Estado de um card num ponto da rolagem: centro (px, relativo ao centro da tela), escala, desfoque e opacidades. */
export type Quadro = { x: number; y: number; escala: number; desfoque: number; opacidade: number; etiqueta: number };

const FOLGA = 10; // distância entre o topo da foto e a linha `topo`, na escala 1

export const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Perspectiva: o card é uma placa ao lado do caminho; `k` (= 1/profundidade) é a escala. Ele nasce minúsculo perto do
 * ponto de fuga, desacelera enquanto está ao lado da cachorra (é quando se lê) e acelera ao passar pela câmera, saindo
 * pela borda. Posição e escala vêm todas de `k`, que é suave em `u`: nada salta. A lateral é a mínima que, assim que a
 * foto desce até a altura da cachorra, já a deixa fora da zona dela, mas nunca maior que a que deixa a foto inteira na
 * tela na escala 1 (em telas estreitas ou baixas, ler a foto vale mais; no celular ela passa pela cabeça da cachorra
 * já saindo da tela). O topo nunca sobe acima de `topo`. `u` vai de 0 (nasce) a 1 (passou); fora disso, não existe.
 */
export function quadroDoCard(u: number, lado: -1 | 1, palco: Palco, etiquetaW: number): Quadro | null {
  if (u <= 0 || u >= 1) return null;
  const t = u - 0.5;
  const k = Math.exp(0.9 * t + 12 * t ** 3) / 1.2; // 0,12 → 0,83 (devagar no meio) → 5,9
  const { cardW, cardH, topo, caoTopo, caoMeia } = palco;
  // a escala em que a base da foto chega à altura da cabeça da cachorra; dali em diante a foto fica ao lado dela
  const kc = Math.max(0.05, (caoTopo - topo) / (FOLGA + cardH));
  const livre = cardW / 2 + caoMeia / kc + 4;
  const cabe = palco.w / 2 - 8 - cardW / 2;
  const lateral = Math.max(cardW / 2 + 8, Math.min(livre, cabe));
  const x = lado * lateral * k;
  const y = topo + (FOLGA + cardH / 2) * k - palco.h / 2;
  // distância: um pouco de névoa e desfoque ao longe; perto demais, o borrão de quem passa rápido
  const desfoque = 2.5 * (1 - suave(0.3, 0.6, k)) + 6 * suave(2, 4.5, k);
  const opacidade = suave(0, 0.12, u) * (0.7 + 0.3 * suave(0.1, 0.35, u)) * (1 - suave(0.93, 1, u));
  // a etiqueta só aparece quando a foto já é quase tão larga quanto ela
  const etiqueta = suave(etiquetaW * 0.9, etiquetaW + 8, cardW * k);
  return { x, y, escala: k, desfoque, opacidade, etiqueta };
}
