export type Servico = "banho-tosa" | "loja" | "spa" | "taxi-dog";

export type Loja = {
  id: string;
  nome: string;
  cidade: string;
  uf: string;
  regiao: "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul";
  endereco: string;
  servicos: Servico[];
  horario: string;
  nota: number;
  lat: number;
  lng: number;
};

export const nomesServico: Record<Servico, string> = {
  "banho-tosa": "Banho & tosa",
  loja: "Loja",
  spa: "Spa",
  "taxi-dog": "Táxi Dog",
};

/** Unidades fictícias da Íris em cidades reais, com as coordenadas reais de cada cidade ou bairro. Endereços inventados. */
export const lojas: Loja[] = [
  { id: "manaus-adrianopolis", nome: "Íris Adrianópolis", cidade: "Manaus", uf: "AM", regiao: "Norte", endereco: "Rua das Acácias, 120", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.6, lat: -3.1019, lng: -60.0119 },
  { id: "belem-nazare", nome: "Íris Nazaré", cidade: "Belém", uf: "PA", regiao: "Norte", endereco: "Avenida dos Ipês, 157", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.9, lat: -1.4558, lng: -48.4902 },
  { id: "santarem", nome: "Íris Santarém", cidade: "Santarém", uf: "PA", regiao: "Norte", endereco: "Rua do Sabiá, 194", servicos: ["banho-tosa", "loja", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.8, lat: -2.443, lng: -54.7083 },
  { id: "porto-velho", nome: "Íris Porto Velho", cidade: "Porto Velho", uf: "RO", regiao: "Norte", endereco: "Rua das Hortênsias, 231", servicos: ["banho-tosa", "spa"], horario: "Seg a sáb, 8h às 20h", nota: 4.7, lat: -8.7612, lng: -63.9004 },
  { id: "rio-branco", nome: "Íris Rio Branco", cidade: "Rio Branco", uf: "AC", regiao: "Norte", endereco: "Avenida das Palmeiras, 268", servicos: ["banho-tosa", "loja", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.6, lat: -9.9754, lng: -67.8249 },
  { id: "macapa", nome: "Íris Macapá", cidade: "Macapá", uf: "AP", regiao: "Norte", endereco: "Rua dos Girassóis, 305", servicos: ["banho-tosa", "loja"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.9, lat: 0.0349, lng: -51.0694 },
  { id: "boa-vista", nome: "Íris Boa Vista", cidade: "Boa Vista", uf: "RR", regiao: "Norte", endereco: "Rua da Aurora, 342", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.8, lat: 2.8235, lng: -60.6758 },
  { id: "palmas", nome: "Íris Palmas", cidade: "Palmas", uf: "TO", regiao: "Norte", endereco: "Alameda dos Jacarandás, 379", servicos: ["banho-tosa", "loja"], horario: "Todos os dias, 8h às 22h", nota: 4.7, lat: -10.1844, lng: -48.3336 },
  { id: "salvador-rio-vermelho", nome: "Íris Rio Vermelho", cidade: "Salvador", uf: "BA", regiao: "Nordeste", endereco: "Rua das Camélias, 416", servicos: ["banho-tosa", "spa", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.6, lat: -13.0108, lng: -38.4907 },
  { id: "feira-de-santana", nome: "Íris Feira de Santana", cidade: "Feira de Santana", uf: "BA", regiao: "Nordeste", endereco: "Avenida Beira-Rio, 453", servicos: ["banho-tosa", "loja", "spa"], horario: "Seg a sáb, 8h às 20h", nota: 4.9, lat: -12.2664, lng: -38.9663 },
  { id: "vitoria-da-conquista", nome: "Íris Vitória da Conquista", cidade: "Vitória da Conquista", uf: "BA", regiao: "Nordeste", endereco: "Rua dos Pinheiros Altos, 490", servicos: ["banho-tosa", "loja", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.8, lat: -14.8619, lng: -40.8444 },
  { id: "recife-boa-viagem", nome: "Íris Boa Viagem", cidade: "Recife", uf: "PE", regiao: "Nordeste", endereco: "Rua do Orvalho, 527", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.7, lat: -8.1186, lng: -34.9022 },
  { id: "caruaru", nome: "Íris Caruaru", cidade: "Caruaru", uf: "PE", regiao: "Nordeste", endereco: "Rua das Acácias, 564", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.6, lat: -8.276, lng: -35.9819 },
  { id: "petrolina", nome: "Íris Petrolina", cidade: "Petrolina", uf: "PE", regiao: "Nordeste", endereco: "Avenida dos Ipês, 601", servicos: ["banho-tosa"], horario: "Todos os dias, 8h às 22h", nota: 4.9, lat: -9.3891, lng: -40.503 },
  { id: "fortaleza-aldeota", nome: "Íris Aldeota", cidade: "Fortaleza", uf: "CE", regiao: "Nordeste", endereco: "Rua do Sabiá, 638", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.8, lat: -3.74, lng: -38.505 },
  { id: "juazeiro-do-norte", nome: "Íris Juazeiro do Norte", cidade: "Juazeiro do Norte", uf: "CE", regiao: "Nordeste", endereco: "Rua das Hortênsias, 675", servicos: ["banho-tosa", "loja", "spa"], horario: "Seg a sáb, 8h às 20h", nota: 4.7, lat: -7.2131, lng: -39.315 },
  { id: "sao-luis", nome: "Íris São Luís", cidade: "São Luís", uf: "MA", regiao: "Nordeste", endereco: "Avenida das Palmeiras, 712", servicos: ["banho-tosa", "loja", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.6, lat: -2.5307, lng: -44.3068 },
  { id: "teresina", nome: "Íris Teresina", cidade: "Teresina", uf: "PI", regiao: "Nordeste", endereco: "Rua dos Girassóis, 749", servicos: ["banho-tosa", "loja"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.9, lat: -5.0892, lng: -42.8016 },
  { id: "natal-ponta-negra", nome: "Íris Ponta Negra", cidade: "Natal", uf: "RN", regiao: "Nordeste", endereco: "Rua da Aurora, 786", servicos: ["banho-tosa", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.8, lat: -5.88, lng: -35.17 },
  { id: "joao-pessoa-tambau", nome: "Íris Tambaú", cidade: "João Pessoa", uf: "PB", regiao: "Nordeste", endereco: "Alameda dos Jacarandás, 823", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.7, lat: -7.115, lng: -34.825 },
  { id: "campina-grande", nome: "Íris Campina Grande", cidade: "Campina Grande", uf: "PB", regiao: "Nordeste", endereco: "Rua das Camélias, 860", servicos: ["banho-tosa", "loja", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.6, lat: -7.2307, lng: -35.8817 },
  { id: "maceio-pajucara", nome: "Íris Pajuçara", cidade: "Maceió", uf: "AL", regiao: "Nordeste", endereco: "Avenida Beira-Rio, 897", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.9, lat: -9.665, lng: -35.712 },
  { id: "aracaju", nome: "Íris Aracaju", cidade: "Aracaju", uf: "SE", regiao: "Nordeste", endereco: "Rua dos Pinheiros Altos, 934", servicos: ["banho-tosa", "loja", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.8, lat: -10.9472, lng: -37.0731 },
  { id: "brasilia-asa-sul", nome: "Íris Asa Sul", cidade: "Brasília", uf: "DF", regiao: "Centro-Oeste", endereco: "Rua do Orvalho, 971", servicos: ["banho-tosa", "spa", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.7, lat: -15.816, lng: -47.908 },
  { id: "brasilia-aguas-claras", nome: "Íris Águas Claras", cidade: "Brasília", uf: "DF", regiao: "Centro-Oeste", endereco: "Rua das Acácias, 128", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.6, lat: -15.84, lng: -48.028 },
  { id: "goiania-setor-bueno", nome: "Íris Setor Bueno", cidade: "Goiânia", uf: "GO", regiao: "Centro-Oeste", endereco: "Avenida dos Ipês, 165", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.9, lat: -16.706, lng: -49.27 },
  { id: "anapolis", nome: "Íris Anápolis", cidade: "Anápolis", uf: "GO", regiao: "Centro-Oeste", endereco: "Rua do Sabiá, 202", servicos: ["banho-tosa", "loja", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.8, lat: -16.3281, lng: -48.9534 },
  { id: "campo-grande", nome: "Íris Campo Grande", cidade: "Campo Grande", uf: "MS", regiao: "Centro-Oeste", endereco: "Rua das Hortênsias, 239", servicos: ["banho-tosa", "loja", "spa"], horario: "Seg a sáb, 8h às 20h", nota: 4.7, lat: -20.4697, lng: -54.6201 },
  { id: "dourados", nome: "Íris Dourados", cidade: "Dourados", uf: "MS", regiao: "Centro-Oeste", endereco: "Avenida das Palmeiras, 276", servicos: ["banho-tosa", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.6, lat: -22.2211, lng: -54.8056 },
  { id: "cuiaba", nome: "Íris Cuiabá", cidade: "Cuiabá", uf: "MT", regiao: "Centro-Oeste", endereco: "Rua dos Girassóis, 313", servicos: ["banho-tosa", "loja"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.9, lat: -15.6014, lng: -56.0979 },
  { id: "rondonopolis", nome: "Íris Rondonópolis", cidade: "Rondonópolis", uf: "MT", regiao: "Centro-Oeste", endereco: "Rua da Aurora, 350", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.8, lat: -16.4673, lng: -54.6372 },
  { id: "sao-paulo-pinheiros", nome: "Íris Pinheiros", cidade: "São Paulo", uf: "SP", regiao: "Sudeste", endereco: "Alameda dos Jacarandás, 387", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.7, lat: -23.567, lng: -46.693 },
  { id: "sao-paulo-moema", nome: "Íris Moema", cidade: "São Paulo", uf: "SP", regiao: "Sudeste", endereco: "Rua das Camélias, 424", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.6, lat: -23.601, lng: -46.664 },
  { id: "sao-paulo-santana", nome: "Íris Santana", cidade: "São Paulo", uf: "SP", regiao: "Sudeste", endereco: "Avenida Beira-Rio, 461", servicos: ["banho-tosa", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.9, lat: -23.502, lng: -46.625 },
  { id: "campinas-cambui", nome: "Íris Cambuí", cidade: "Campinas", uf: "SP", regiao: "Sudeste", endereco: "Rua dos Pinheiros Altos, 498", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.8, lat: -22.894, lng: -47.052 },
  { id: "santos-gonzaga", nome: "Íris Gonzaga", cidade: "Santos", uf: "SP", regiao: "Sudeste", endereco: "Rua do Orvalho, 535", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.7, lat: -23.967, lng: -46.333 },
  { id: "ribeirao-preto", nome: "Íris Ribeirão Preto", cidade: "Ribeirão Preto", uf: "SP", regiao: "Sudeste", endereco: "Rua das Acácias, 572", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.6, lat: -21.1775, lng: -47.8103 },
  { id: "sao-jose-dos-campos", nome: "Íris São José dos Campos", cidade: "São José dos Campos", uf: "SP", regiao: "Sudeste", endereco: "Avenida dos Ipês, 609", servicos: ["banho-tosa", "loja"], horario: "Todos os dias, 8h às 22h", nota: 4.9, lat: -23.2237, lng: -45.9009 },
  { id: "sorocaba", nome: "Íris Sorocaba", cidade: "Sorocaba", uf: "SP", regiao: "Sudeste", endereco: "Rua do Sabiá, 646", servicos: ["banho-tosa", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.8, lat: -23.5015, lng: -47.4526 },
  { id: "rio-de-janeiro-botafogo", nome: "Íris Botafogo", cidade: "Rio de Janeiro", uf: "RJ", regiao: "Sudeste", endereco: "Rua das Hortênsias, 683", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.7, lat: -22.951, lng: -43.184 },
  { id: "rio-de-janeiro-barra-da-tijuca", nome: "Íris Barra da Tijuca", cidade: "Rio de Janeiro", uf: "RJ", regiao: "Sudeste", endereco: "Avenida das Palmeiras, 720", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.6, lat: -23.0, lng: -43.365 },
  { id: "niteroi-icarai", nome: "Íris Icaraí", cidade: "Niterói", uf: "RJ", regiao: "Sudeste", endereco: "Rua dos Girassóis, 757", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.9, lat: -22.905, lng: -43.11 },
  { id: "petropolis", nome: "Íris Petrópolis", cidade: "Petrópolis", uf: "RJ", regiao: "Sudeste", endereco: "Rua da Aurora, 794", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.8, lat: -22.505, lng: -43.179 },
  { id: "belo-horizonte-savassi", nome: "Íris Savassi", cidade: "Belo Horizonte", uf: "MG", regiao: "Sudeste", endereco: "Alameda dos Jacarandás, 831", servicos: ["banho-tosa", "spa", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.7, lat: -19.937, lng: -43.934 },
  { id: "belo-horizonte-pampulha", nome: "Íris Pampulha", cidade: "Belo Horizonte", uf: "MG", regiao: "Sudeste", endereco: "Rua das Camélias, 868", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.6, lat: -19.851, lng: -43.968 },
  { id: "uberlandia", nome: "Íris Uberlândia", cidade: "Uberlândia", uf: "MG", regiao: "Sudeste", endereco: "Avenida Beira-Rio, 905", servicos: ["banho-tosa", "loja", "spa"], horario: "Seg a sáb, 8h às 20h", nota: 4.9, lat: -18.9186, lng: -48.2772 },
  { id: "juiz-de-fora", nome: "Íris Juiz de Fora", cidade: "Juiz de Fora", uf: "MG", regiao: "Sudeste", endereco: "Rua dos Pinheiros Altos, 942", servicos: ["banho-tosa", "loja", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.8, lat: -21.7642, lng: -43.3496 },
  { id: "vitoria-praia-do-canto", nome: "Íris Praia do Canto", cidade: "Vitória", uf: "ES", regiao: "Sudeste", endereco: "Rua do Orvalho, 979", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.7, lat: -20.297, lng: -40.295 },
  { id: "vila-velha", nome: "Íris Vila Velha", cidade: "Vila Velha", uf: "ES", regiao: "Sudeste", endereco: "Rua das Acácias, 136", servicos: ["banho-tosa", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.6, lat: -20.3297, lng: -40.2925 },
  { id: "curitiba-batel", nome: "Íris Batel", cidade: "Curitiba", uf: "PR", regiao: "Sul", endereco: "Avenida dos Ipês, 173", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.9, lat: -25.442, lng: -49.288 },
  { id: "curitiba-santa-felicidade", nome: "Íris Santa Felicidade", cidade: "Curitiba", uf: "PR", regiao: "Sul", endereco: "Rua do Sabiá, 210", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.8, lat: -25.405, lng: -49.33 },
  { id: "londrina", nome: "Íris Londrina", cidade: "Londrina", uf: "PR", regiao: "Sul", endereco: "Rua das Hortênsias, 247", servicos: ["banho-tosa", "loja", "spa"], horario: "Seg a sáb, 8h às 20h", nota: 4.7, lat: -23.3045, lng: -51.1696 },
  { id: "maringa", nome: "Íris Maringá", cidade: "Maringá", uf: "PR", regiao: "Sul", endereco: "Avenida das Palmeiras, 284", servicos: ["banho-tosa", "loja", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.6, lat: -23.4205, lng: -51.9333 },
  { id: "cascavel", nome: "Íris Cascavel", cidade: "Cascavel", uf: "PR", regiao: "Sul", endereco: "Rua dos Girassóis, 321", servicos: ["banho-tosa"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.9, lat: -24.9555, lng: -53.4552 },
  { id: "florianopolis-lagoa-da-conceicao", nome: "Íris Lagoa da Conceição", cidade: "Florianópolis", uf: "SC", regiao: "Sul", endereco: "Rua da Aurora, 358", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.8, lat: -27.603, lng: -48.468 },
  { id: "joinville", nome: "Íris Joinville", cidade: "Joinville", uf: "SC", regiao: "Sul", endereco: "Alameda dos Jacarandás, 395", servicos: ["banho-tosa", "loja"], horario: "Todos os dias, 8h às 22h", nota: 4.7, lat: -26.3045, lng: -48.8487 },
  { id: "blumenau", nome: "Íris Blumenau", cidade: "Blumenau", uf: "SC", regiao: "Sul", endereco: "Rua das Camélias, 432", servicos: ["banho-tosa", "loja", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.6, lat: -26.9194, lng: -49.0661 },
  { id: "chapeco", nome: "Íris Chapecó", cidade: "Chapecó", uf: "SC", regiao: "Sul", endereco: "Avenida Beira-Rio, 469", servicos: ["banho-tosa", "loja", "spa"], horario: "Seg a sáb, 8h às 20h", nota: 4.9, lat: -27.1004, lng: -52.6152 },
  { id: "porto-alegre-moinhos-de-vento", nome: "Íris Moinhos de Vento", cidade: "Porto Alegre", uf: "RS", regiao: "Sul", endereco: "Rua dos Pinheiros Altos, 506", servicos: ["banho-tosa", "spa", "taxi-dog"], horario: "Todos os dias, 8h às 22h", nota: 4.8, lat: -30.025, lng: -51.201 },
  { id: "porto-alegre-menino-deus", nome: "Íris Menino Deus", cidade: "Porto Alegre", uf: "RS", regiao: "Sul", endereco: "Rua do Orvalho, 543", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sex, 8h às 19h · sáb, 8h às 16h", nota: 4.7, lat: -30.054, lng: -51.222 },
  { id: "caxias-do-sul", nome: "Íris Caxias do Sul", cidade: "Caxias do Sul", uf: "RS", regiao: "Sul", endereco: "Rua das Acácias, 580", servicos: ["banho-tosa", "loja", "spa", "taxi-dog"], horario: "Seg a sáb, 8h às 20h", nota: 4.6, lat: -29.1678, lng: -51.1794 },
  { id: "pelotas", nome: "Íris Pelotas", cidade: "Pelotas", uf: "RS", regiao: "Sul", endereco: "Avenida dos Ipês, 617", servicos: ["banho-tosa", "loja"], horario: "Todos os dias, 8h às 22h", nota: 4.9, lat: -31.7654, lng: -52.3376 },
];
