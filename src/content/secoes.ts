import guia from "@/assets/fotos/foto-guia.jpg";
import banhoTosa from "@/assets/fotos/foto-pacote-banho-tosa.jpg";
import essencial from "@/assets/fotos/foto-pacote-essencial.jpg";
import spa from "@/assets/fotos/foto-pacote-spa.jpg";
import raioX from "@/assets/fotos/foto-raio-x.jpg";
import esp1 from "@/assets/fotos/foto-especialista-1.jpg";
import esp2 from "@/assets/fotos/foto-especialista-2.jpg";
import esp3 from "@/assets/fotos/foto-especialista-3.jpg";
import esp4 from "@/assets/fotos/foto-especialista-4.jpg";
import esp5 from "@/assets/fotos/foto-especialista-5.jpg";
import esp6 from "@/assets/fotos/foto-especialista-6.jpg";

export { guia as fotoGuia, raioX as fotoRaioX };

/** Índice das seções (numeração no estilo da referência e, depois, na barra de progresso). */
export const indice = {
  passeio: "01",
  banho: "02",
  lojas: "03",
  pacotes: "04",
  raioX: "05",
  rede: "06",
  especialistas: "07",
  clientes: "08",
  guia: "09",
  agendar: "10",
} as const;

export type PacoteId = "essencial" | "banho-tosa" | "spa";

export const pacotes: { id: PacoteId; nome: string; curto: string; frase: string; foto: typeof essencial; alt: string }[] = [
  { id: "essencial", nome: "Banho Essencial", curto: "Essencial", frase: "O básico muito bem feito.", foto: essencial, alt: "Pastora-alemã preta sentada, olhando para a câmera, sobre fundo claro." },
  { id: "banho-tosa", nome: "Banho & Tosa", curto: "Banho & Tosa", frase: "Limpo, cheiroso e no corte certo.", foto: banhoTosa, alt: "Pastor-alemão preto sorrindo, deitado entre flores amarelas." },
  { id: "spa", nome: "Spa Premium", curto: "Spa", frase: "Uma tarde inteira só para ele.", foto: spa, alt: "Pastor-alemão de pelo longo, escuro e brilhante, em retrato sobre fundo escuro." },
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

export type Ponto = { id: string; nome: string; texto: string; x: number; y: number; pacotes: PacoteId[] };

/** Pontos do Raio-X sobre a foto (x e y em % da imagem) e em quais pacotes cada cuidado entra. */
export const pontos: Ponto[] = [
  { id: "orelhas", nome: "Orelhas", texto: "Limpeza com algodão e solução própria, sem cotonete.", x: 57.5, y: 22, pacotes: ["banho-tosa", "spa"] },
  { id: "olhos", nome: "Olhos", texto: "Contorno limpo com gaze e soro, sem shampoo por perto.", x: 45, y: 33, pacotes: ["spa"] },
  { id: "dentes", nome: "Dentes", texto: "Escovação com pasta para cães e checagem da gengiva.", x: 44.6, y: 43, pacotes: ["spa"] },
  { id: "pelagem", nome: "Pelagem", texto: "Shampoo pelo tipo de pelo e escovação até o subpelo.", x: 75, y: 44, pacotes: ["essencial", "banho-tosa", "spa"] },
  { id: "patas", nome: "Patas", texto: "Pelos entre os dedos aparados e almofadas hidratadas.", x: 49, y: 89, pacotes: ["banho-tosa", "spa"] },
  { id: "unhas", nome: "Unhas", texto: "Corte na medida, sem atingir a parte viva.", x: 88, y: 87, pacotes: ["essencial", "banho-tosa", "spa"] },
];

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
