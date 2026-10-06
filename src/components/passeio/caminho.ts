import * as THREE from "three";

/**
 * O passeio inteiro é um único caminho (metros, câmera olhando para -z):
 * ponte de madeira → alameda de ipês → gramado com neblina → porta da loja Íris.
 */
export const caminho = new THREE.CatmullRomCurve3(
  [
    [0, 0, 6], [0, 0, -6], [0, 0, -18], [0, 0, -27], // ponte
    [0.7, 0, -35], [1.7, 0, -45], [1.9, 0, -57], [1.3, 0, -69], // ipês
    [0, 0, -80], [-2.2, 0, -92], [-3.0, 0, -103], // gramado
    [-2.6, 0, -113], [-2.2, 0, -121], [-2.2, 0, -124.6], // chegada
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  "centripetal",
);

export const COMPRIMENTO = caminho.getLength();
export const PORTA_Z = -127; // fachada da loja

// a câmera para ~10 m antes da porta (a fachada inteira no quadro); a cachorra anda 1,8 m à frente dela
export const DIANTEIRA = 1.8;
export const FIM = COMPRIMENTO - 6.5 - DIANTEIRA;

export const pontoEm = (s: number, alvo = new THREE.Vector3()) =>
  caminho.getPointAt(THREE.MathUtils.clamp(s / COMPRIMENTO, 0, 1), alvo);
export const tangenteEm = (s: number, alvo = new THREE.Vector3()) =>
  caminho.getTangentAt(THREE.MathUtils.clamp(s / COMPRIMENTO, 0, 1), alvo);

/** Trechos do mundo, em metros de caminho. */
export const trechos = { ponte: [0, 33], ipes: [33, 76], gramado: [76, 116] } as const;

export const frases = [
  { s: 0, texto: "O banho que acalma." },
  { s: 18, texto: "A tosa que respeita cada raça." },
  { s: 34, texto: "O spa que ele merece." },
  { s: 45, texto: "A loja com tudo que ele ama." },
  { s: 88, texto: "O Táxi Dog que busca e leva." },
];

/** Cards de serviços e produtos pelo caminho: posição em metros, lado e altura. */
export const posicoesCards = [
  { s: 20, lado: 1, y: 1.25 }, // banho
  { s: 29, lado: -1, y: 1.15 }, // tosa
  { s: 38, lado: 1, y: 1.3 }, // spa
  { s: 48, lado: -1, y: 1.2 }, // rações
  { s: 58, lado: 1, y: 1.25 }, // petiscos
  { s: 68, lado: -1, y: 1.15 }, // brinquedos
  { s: 82, lado: 1, y: 1.3 }, // camas
  { s: 92, lado: -1, y: 1.2 }, // coleiras
  { s: 102, lado: 1, y: 1.25 }, // táxi dog
];

/** Pose da mão que segura a guia (espaço da câmera, metros e radianos). */
export type AjusteMao = {
  alvo: [number, number, number]; // onde a palma fica no quadro
  inclina: number; // antebraço subindo da base do quadro
  giro: number;
  rola: number;
  eixo?: "x" | "y" | "z";
  sinal?: number;
};
export const MAO_PADRAO: AjusteMao = { alvo: [0.14, -0.2, -0.5], inclina: 1.3, giro: -1.0, rola: 0, eixo: "z", sinal: 1 }; // dorso da mão para a câmera, dedos fechados na guia
export const MAO_CELULAR: AjusteMao = { ...MAO_PADRAO, alvo: [0.12, -0.32, -0.62] }; // entra pela direita, não pelo meio
