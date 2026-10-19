export { default as cachorra } from "@/assets/passeio/cachorra.png";
export { default as mao } from "@/assets/passeio/mao.png";
import banho from "@/assets/cards/card-banho.jpg";
import tosa from "@/assets/cards/card-tosa.jpg";
import spa from "@/assets/cards/card-spa.jpg";
import racao from "@/assets/cards/card-racao.jpg";
import petiscos from "@/assets/cards/card-petiscos.jpg";
import brinquedos from "@/assets/cards/card-brinquedos.jpg";
import camas from "@/assets/cards/card-camas.jpg";
import coleiras from "@/assets/cards/card-coleiras.jpg";
import taxiDog from "@/assets/cards/card-taxi-dog.jpg";

/** Pontos do passeio renderizado (imagens paradas em public/passeio): um por frase e a chegada. */
export const pontosPasseio = [
  { nome: "Alameda", arquivo: "chave-0" },
  { nome: "Raios de sol", arquivo: "chave-1" },
  { nome: "Jacarandás", arquivo: "chave-2" },
  { nome: "Rumo à loja", arquivo: "chave-3" },
  { nome: "Porta da loja Íris", arquivo: "chave-chegada" },
];

export const altPasseio =
  "Em primeira pessoa, ao amanhecer: a mão segura a guia de uma pastora-alemã preta que caminha à frente, de costas, por uma alameda de jacarandás com névoa, rumo à loja Íris no fim do caminho.";

export const cards = [
  { rotulo: "Banho — água morna", foto: banho, alt: "Cão preto de orelhas em pé tomando um jato de água de mangueira no gramado." },
  { rotulo: "Tosa — na tesoura", foto: tosa, alt: "Tosador apara com tesoura o pelo de um cão marrom-escuro no salão." },
  { rotulo: "Spa — hidratação", foto: spa, alt: "Cão escuro enrolado numa toalha clara depois do banho, olhando para a câmera." },
  { rotulo: "Loja — rações premium", foto: racao, alt: "Tigela azul cheia de ração vista de cima, sobre fundo creme." },
  { rotulo: "Petiscos naturais", foto: petiscos, alt: "Pastor-alemão de boca aberta pegando um petisco no ar, sobre fundo escuro." },
  { rotulo: "Brinquedos", foto: brinquedos, alt: "Pastora-alemã preta deitada numa almofada com um brinquedo vermelho." },
  { rotulo: "Camas e casinhas", foto: camas, alt: "Pastor-alemão preto deitado sobre uma manta macia." },
  { rotulo: "Coleiras e guias", foto: coleiras, alt: "Pastor-alemão de coleira azul-petróleo e guia, sentado na calçada ao pôr do sol." },
  { rotulo: "Táxi Dog", foto: taxiDog, alt: "Cão de orelhas em pé sorrindo pela janela aberta de um carro." },
];
