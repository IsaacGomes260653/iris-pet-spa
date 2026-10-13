import ponte from "@/assets/passeio/fundo-1-ponte.jpg";
import alameda from "@/assets/passeio/fundo-2-alameda.jpg";
import trilha from "@/assets/passeio/fundo-3-trilha.jpg";
import gramado from "@/assets/passeio/fundo-4-gramado.jpg";
import loja from "@/assets/passeio/fundo-5-loja.jpg";
export { default as cachorra } from "@/assets/passeio/cachorra.png";
import banho from "@/assets/cards/card-banho.jpg";
import tosa from "@/assets/cards/card-tosa.jpg";
import spa from "@/assets/cards/card-spa.jpg";
import racao from "@/assets/cards/card-racao.jpg";
import petiscos from "@/assets/cards/card-petiscos.jpg";
import brinquedos from "@/assets/cards/card-brinquedos.jpg";
import camas from "@/assets/cards/card-camas.jpg";
import coleiras from "@/assets/cards/card-coleiras.jpg";
import taxiDog from "@/assets/cards/card-taxi-dog.jpg";

/** Cenários do passeio, em ordem (só o fundo; a cachorra é uma camada fixa por cima). `foco` é o object-position. */
export const cenas = [
  { nome: "Ponte de madeira", foto: ponte, foco: "50% 60%", alt: "Ponte de madeira estreita atravessando a mata, com o corrimão levando ao fundo." },
  { nome: "Alameda florida", foto: alameda, foco: "50% 55%", alt: "Caminho de terra sob um túnel de árvores floridas de rosa." },
  { nome: "Trilha", foto: trilha, foco: "50% 62%", alt: "Estrada de terra entre árvores altas, com névoa ao fundo." },
  { nome: "Gramado com neblina", foto: gramado, foco: "50% 58%", alt: "Trilha num gramado com neblina da manhã e árvores ao longe." },
  { nome: "Porta da loja Íris", foto: loja, foco: "50% 72%", alt: "Do outro lado da rua, a fachada branca da loja Íris Pet Spa, com toldo verde-sálvia, vitrines e dois bancos na calçada." },
];

export const altCachorra = "Em primeira pessoa, a guia vai da mão até a coleira de uma cachorra preta que caminha à frente, de costas.";

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
