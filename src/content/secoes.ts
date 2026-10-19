import guia from "@/assets/fotos/foto-guia.jpg";
import banhoTosa from "@/assets/fotos/foto-pacote-banho-tosa.jpg";
import essencial from "@/assets/fotos/foto-pacote-essencial.jpg";
import spa from "@/assets/fotos/foto-pacote-spa.jpg";
import bTosaAntes from "@/assets/antes-depois/banho-tosa-antes.jpg";
import bTosaDepois from "@/assets/antes-depois/banho-tosa-depois.jpg";
import essAntes from "@/assets/antes-depois/essencial-antes.jpg";
import essDepois from "@/assets/antes-depois/essencial-depois.jpg";
import spaAntes from "@/assets/antes-depois/spa-antes.jpg";
import spaDepois from "@/assets/antes-depois/spa-depois.jpg";
import esp1 from "@/assets/fotos/foto-especialista-1.jpg";
import esp2 from "@/assets/fotos/foto-especialista-2.jpg";
import esp3 from "@/assets/fotos/foto-especialista-3.jpg";
import esp4 from "@/assets/fotos/foto-especialista-4.jpg";
import esp5 from "@/assets/fotos/foto-especialista-5.jpg";
import esp6 from "@/assets/fotos/foto-especialista-6.jpg";

export { guia as fotoGuia };

/** Índice das seções (numeração no estilo da referência e, depois, na barra de progresso). */
export const indice = {
  passeio: "01",
  banho: "02",
  lojas: "03",
  pacotes: "04",
  antesDepois: "05",
  rede: "06",
  especialistas: "07",
  clientes: "08",
  duvidas: "09",
  guia: "10",
  agendar: "11",
} as const;

export type PacoteId = "essencial" | "banho-tosa" | "spa";

export type Porte = "P" | "M" | "G";

/** Um pacote e os detalhes que abrem no card (valores fictícios: a marca é fictícia). */
export type Pacote = {
  id: PacoteId;
  nome: string;
  curto: string;
  frase: string;
  foto: typeof essencial;
  alt: string;
  inclui: string[];
  duracao: string;
  precos: Record<Porte, number>;
  indicado: string;
  frequencia: string;
  adicionais: { nome: string; preco: number }[];
};

export const pacotes: Pacote[] = [
  {
    id: "essencial",
    nome: "Banho Essencial",
    curto: "Essencial",
    frase: "O básico muito bem feito.",
    foto: essencial,
    alt: "Pastora-alemã preta sentada, olhando para a câmera, sobre fundo claro.",
    inclui: ["Banho com shampoo neutro hipoalergênico", "Secagem com toalha e secador silencioso", "Escovação que tira o pelo morto", "Corte de unhas e higiene"],
    duracao: "1 h",
    precos: { P: 69, M: 89, G: 119 },
    indicado: "Pelo curto e a rotina entre uma tosa e outra",
    frequencia: "A cada 15 dias",
    adicionais: [{ nome: "Hidratação leve", preco: 25 }, { nome: "Limpeza de ouvidos", preco: 15 }, { nome: "Táxi Dog", preco: 30 }],
  },
  {
    id: "banho-tosa",
    nome: "Banho & Tosa",
    curto: "Banho & Tosa",
    frase: "Limpo, cheiroso e no corte certo.",
    foto: banhoTosa,
    alt: "Pastor-alemão preto sorrindo, deitado entre flores amarelas.",
    inclui: ["Banho com shampoo pelo tipo de pelo", "Tosa padrão da raça ou na tesoura", "Secagem com soprador morno e escova", "Unhas, ouvidos e higiene", "Perfume suave e lenço"],
    duracao: "2 h",
    precos: { P: 129, M: 159, G: 199 },
    indicado: "Todas as raças, sobretudo pelo médio e longo",
    frequencia: "A cada 30 a 45 dias",
    adicionais: [{ nome: "Hidratação", preco: 35 }, { nome: "Escovação de dentes", preco: 20 }, { nome: "Táxi Dog", preco: 30 }],
  },
  {
    id: "spa",
    nome: "Spa Premium",
    curto: "Spa",
    frase: "Uma tarde inteira só para ele.",
    foto: spa,
    alt: "Pastor-alemão de pelo longo, escuro e brilhante, em retrato sobre fundo escuro.",
    inclui: ["Banho dermatológico e condicionador", "Máscara nutritiva com tempo de pausa", "Secagem lenta, fio a fio", "Tosa na tesoura com acabamento à mão", "Dentes escovados e massagem", "Táxi Dog de ida e volta"],
    duracao: "3 h",
    precos: { P: 219, M: 259, G: 319 },
    indicado: "Pele sensível, pelo longo ou duplo e datas especiais",
    frequencia: "A cada 30 dias",
    adicionais: [{ nome: "Ozonioterapia", preco: 60 }, { nome: "Cromoterapia", preco: 40 }, { nome: "Ensaio de fotos", preco: 50 }],
  },
];

/** A ficha técnica: uma linha por item, uma coluna por pacote (mesma ordem de `pacotes`). */
export const ficha: { item: string; valores: [string, string, string] }[] = [
  { item: "Duração", valores: ["1 hora", "2 horas", "3 horas"] },
  { item: "Indicado para", valores: ["Pelo curto e rotina", "Todas as raças", "Pele sensível e pelo longo"] },
  { item: "Shampoo", valores: ["Neutro hipoalergênico", "Escolhido pelo tipo de pelo", "Dermatológico + condicionador"] },
  { item: "Secagem", valores: ["Toalha e secador silencioso", "Soprador morno e escova", "Secagem lenta, fio a fio"] },
  { item: "Tosa", valores: ["Higiênica", "Padrão da raça ou na tesoura", "Na tesoura, acabamento à mão"] },
  { item: "Hidratação", valores: ["—", "Leve", "Máscara nutritiva"] },
  { item: "Extras", valores: ["Corte de unhas", "Unhas, ouvidos e perfume suave", "Dentes, massagem e Táxi Dog"] },
  { item: "A partir de", valores: ["R$ 69", "R$ 129", "R$ 219"] },
];

/**
 * Antes e depois de cada pacote: fotos reais do MESMO cão (Flickr, CC BY 2.0), recortadas e alinhadas em
 * scripts/preparar-antes-depois.py. `feito` é a lista que acompanha o slider, na ordem do atendimento.
 */
export const antesDepois: Record<
  PacoteId,
  { antes: typeof essAntes; depois: typeof essAntes; cao: string; feito: string[]; autor: string; pagina: string }
> = {
  essencial: {
    antes: essAntes,
    depois: essDepois,
    cao: "Springer spaniel preto e branco",
    feito: ["Banho com shampoo neutro", "Secagem e escovação até o subpelo", "Pelos das patas e das orelhas acertados", "Unhas cortadas na medida"],
    autor: "dwolfgra",
    pagina: "https://www.flickr.com/photos/87965047@N00/2858404410",
  },
  "banho-tosa": {
    antes: bTosaAntes,
    depois: bTosaDepois,
    cao: "Poodle mestiço de pelo claro",
    feito: ["Banho com shampoo para pelo encaracolado", "Tosa no corpo todo, na tesoura e na máquina", "Rosto e olhos livres do pelo", "Secagem com escova e lenço no pescoço"],
    autor: "funkblast",
    pagina: "https://www.flickr.com/photos/92799036@N00/16937812322",
  },
  spa: {
    antes: spaAntes,
    depois: spaDepois,
    cao: "Shih-tzu preto",
    feito: ["Banho dermatológico e máscara nutritiva", "Desembaraço fio a fio", "Tosa na tesoura com rosto aberto", "Secagem lenta, perfume suave e lenço"],
    autor: "kerotab",
    pagina: "https://www.flickr.com/photos/73889777@N00/23227160071",
  },
};

/** A rede em números (inventados: a marca é fictícia). */
export const numeros: { valor: number; casas?: number; prefixo?: string; sufixo?: string; rotulo: string }[] = [
  { valor: 62, rotulo: "Unidades" },
  { valor: 54, rotulo: "Cidades" },
  { valor: 48000, rotulo: "Banhos por mês" },
  { valor: 4.8, casas: 1, rotulo: "Nota média" },
  { valor: 120000, rotulo: "Km de Táxi Dog por mês" },
];

export const especialistas = [
  { nome: "Carla Menezes", papel: "Veterinária dermatologista", foto: esp1, alt: "Veterinária de jaleco abraçada a um husky." },
  { nome: "Rafael Duarte", papel: "Veterinário clínico", foto: esp2, alt: "Veterinário de jaleco segurando um dachshund." },
  { nome: "Helena Prado", papel: "Tosadora-chefe, raças de pelo longo", foto: esp3, alt: "Tosadora de óculos sorrindo com um shih-tzu no colo." },
  { nome: "Bia Santana", papel: "Groomer, especialista em tesoura", foto: esp4, alt: "Groomer de cabelo cacheado rindo, abraçada a um cachorro peludo." },
  { nome: "Thiago Rocha", papel: "Banho e spa", foto: esp5, alt: "Profissional de suéter cinza segurando um dachshund." },
  { nome: "Diego Arantes", papel: "Motorista do Táxi Dog", foto: esp6, alt: "Motorista sorrindo, deitado na grama ao lado de um schnauzer." },
];

export const depoimentos = [
  { texto: "A Luna tinha pavor de secador. Voltou dormindo no Táxi Dog e cheirosa até o dia seguinte.", nome: "Marina", pet: "tutora da Luna", origem: "Google ★ 4,9" },
  { texto: "Tosa na tesoura de verdade, do jeito que o pastor dele pede. E mandaram foto no meio do banho.", nome: "Paulo", pet: "tutor do Thor", origem: "Instagram" },
  { texto: "O Táxi Dog chegou no horário e me avisou cada passo. Facilita muito a semana.", nome: "Renata", pet: "tutora do Bento", origem: "Táxi Dog" },
  { texto: "O spa foi o presente de aniversário dela. Saiu com lenço e tudo.", nome: "Camila", pet: "tutora da Pipoca", origem: "Google ★ 5,0" },
];

export const perguntas = [
  { p: "Preciso agendar ou posso ir direto?", r: "Dá para chegar sem hora, mas com agendamento ele é atendido no horário e sem espera." },
  { p: "Meu cachorro tem medo de secador. E agora?", r: "Usamos secadores de baixo ruído e começamos pela toalha. Se ele não se sentir bem, a secagem é feita no tempo dele." },
  { p: "Vocês atendem cães de porte grande?", r: "Sim. Todas as unidades têm banheira e mesa para cães grandes, e a equipe é treinada para raças de pelo duplo." },
  { p: "Posso acompanhar o banho?", r: "Pode. Muitas unidades têm vidro para o salão, e mandamos fotos durante o atendimento." },
  { p: "Como funciona o Táxi Dog?", r: "Buscamos e levamos em casa, com caixa de transporte ou cinto próprio, e você acompanha cada passo pelo celular." },
  { p: "Quais vacinas são exigidas?", r: "V8 ou V10 e antirrábica em dia. Leve a carteirinha na primeira visita." },
];
