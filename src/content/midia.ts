import ponte from "@/assets/passeio/passeio-1-ponte.jpg";
import cidade from "@/assets/passeio/passeio-2-cidade.jpg";
import trilha from "@/assets/passeio/passeio-3-trilha.jpg";
import gramado from "@/assets/passeio/passeio-4-gramado.jpg";
import lojaCelular from "@/assets/passeio/cena-loja-celular.jpg";
import lojaDesktop from "@/assets/passeio/cena-loja-desktop.jpg";
import banho from "@/assets/cards/card-banho.jpg";
import tosa from "@/assets/cards/card-tosa.jpg";
import spa from "@/assets/cards/card-spa.jpg";
import racao from "@/assets/cards/card-racao.jpg";
import petiscos from "@/assets/cards/card-petiscos.jpg";
import brinquedos from "@/assets/cards/card-brinquedos.jpg";
import camas from "@/assets/cards/card-camas.jpg";
import coleiras from "@/assets/cards/card-coleiras.jpg";
import taxiDog from "@/assets/cards/card-taxi-dog.jpg";

/** Cenários do passeio, em ordem. `foco` é o object-position no desktop (fotos verticais recortadas). */
export const cenas = [
  { nome: "Ponte de madeira", foto: ponte, foco: "50% 34%", alt: "Em primeira pessoa, um cão de orelhas em pé anda de guia à frente numa ponte de madeira estreita." },
  { nome: "Calçada", foto: cidade, foco: "50% 22%", alt: "Cão preto de orelhas em pé e guia vermelha, de costas, olhando a calçada à frente." },
  { nome: "Trilha", foto: trilha, foco: "50% 60%", alt: "Cão preto de guia caminha numa trilha de folhas secas, entre árvores, com sombras longas da manhã." },
  { nome: "Gramado", foto: gramado, foco: "50% 46%", alt: "Uma mão segura a guia de um cão preto que corre à frente num gramado aberto." },
  { nome: "Porta da loja Íris", foto: lojaDesktop, fotoCelular: lojaCelular, foco: "50% 50%", alt: "Fachada creme da loja Íris Pet Spa ao amanhecer, com toldo listrado e vitrines acesas." },
];

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
