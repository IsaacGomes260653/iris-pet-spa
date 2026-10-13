import posterBanho from "@/assets/videos/banho-poster.jpg";
import posterFinalizacao from "@/assets/videos/finalizacao-poster.jpg";
import posterTosa from "@/assets/videos/tosa-poster.jpg";

export type Passo = {
  id: "banho" | "tosa" | "finalizacao";
  nome: string;
  frase: string;
  rotulo: string;
  legenda: string;
  poster: typeof posterBanho;
  detalhes: { icone: "gota" | "frasco" | "orelha" | "maos" | "tesoura" | "regua" | "patinha" | "toalha" | "vento" | "escova" | "flor" | "relogio"; titulo: string; texto: string }[];
};

/** Os três passos do banho e tosa, na ordem em que acontecem no salão. */
export const passos: Passo[] = [
  {
    id: "banho",
    nome: "Banho",
    frase: "Banho em minutos.",
    rotulo: "Passo 1 — banho",
    legenda: "Água morna na medida e shampoo escolhido para o tipo de pelo.",
    poster: posterBanho,
    detalhes: [
      { icone: "gota", titulo: "Água na medida", texto: "Temperatura conferida a cada banho, nunca quente demais." },
      { icone: "frasco", titulo: "Shampoo por pelagem", texto: "Fórmulas para pelo curto, longo, escuro ou sensível." },
      { icone: "orelha", titulo: "Ouvidos protegidos", texto: "Algodão nas orelhas e cuidado redobrado perto dos olhos." },
      { icone: "maos", titulo: "Massagem que acalma", texto: "Movimentos lentos que deixam o banho tranquilo." },
    ],
  },
  {
    id: "tosa",
    nome: "Tosa",
    frase: "Tosa sob medida.",
    rotulo: "Passo 2 — tosa",
    legenda: "Corte pensado para a raça, o pelo e a rotina de cada cão.",
    poster: posterTosa,
    detalhes: [
      { icone: "regua", titulo: "Corte por raça", texto: "Padrão da raça ou do jeito que a família prefere." },
      { icone: "tesoura", titulo: "Acabamento na tesoura", texto: "Rosto, patas e contorno finalizados à mão." },
      { icone: "relogio", titulo: "Sem pressa", texto: "Pausas sempre que ele precisar descansar." },
      { icone: "patinha", titulo: "Unhas e patas", texto: "Unhas aparadas e pelos entre os dedos limpos." },
    ],
  },
  {
    id: "finalizacao",
    nome: "Finalização",
    frase: "Carinho do começo ao fim.",
    rotulo: "Passo 3 — finalização",
    legenda: "Toalha macia, secagem sem susto e escova até o pelo brilhar.",
    poster: posterFinalizacao,
    detalhes: [
      { icone: "toalha", titulo: "Toalha macia", texto: "Primeiro a toalha, para tirar o excesso sem barulho." },
      { icone: "vento", titulo: "Secagem silenciosa", texto: "Secador de baixo ruído, morno, a uma distância segura." },
      { icone: "escova", titulo: "Escova certa", texto: "Desembaraça sem puxar e solta o subpelo morto." },
      { icone: "flor", titulo: "Perfume suave", texto: "Só um toque, que não incomoda o faro dele." },
    ],
  },
];
