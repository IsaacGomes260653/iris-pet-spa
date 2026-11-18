import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Literata, Martian_Mono } from "next/font/google";
import { FundoTema } from "@/components/FundoTema";
import { RolagemSuave } from "@/components/RolagemSuave";
import "lenis/dist/lenis.css";
import "./globals.css";

const literata = Literata({ variable: "--font-literata", subsets: ["latin"], axes: ["opsz"] });
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"] });
const martian = Martian_Mono({ variable: "--font-martian", subsets: ["latin"], axes: ["wdth"] });

// O Next não põe o basePath nas URLs dos metadados: a imagem e o endereço de
// compartilhamento levam o caminho do GitHub Pages explicitamente.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const titulo = "Íris Pet Spa — banho, tosa e spa em todo o Brasil";
const compartilhamento =
  "Projeto de portfólio de Isaac Gomes de Moraes: uma rede de petshop fictícia contada como um passeio em primeira pessoa, com rolagem cinematográfica e globo 3D.";
const imagem = {
  url: `${base}/og.jpg`,
  width: 1200,
  height: 630,
  alt: "Abertura do site: a mão segura a guia de uma cachorra preta numa ponte de madeira, sob o título “Cuidado a cada passo.”",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://isaacgomes260653.github.io"),
  title: titulo,
  description:
    "Banho, tosa, spa, loja e Táxi Dog numa das maiores redes de petshop do Brasil. Agende o banho do seu pet.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${base}/`,
    siteName: "Íris Pet Spa",
    title: titulo,
    description: compartilhamento,
    images: [imagem],
  },
  twitter: { card: "summary_large_image", title: titulo, description: compartilhamento, images: [imagem] },
};

export const viewport: Viewport = { themeColor: "#2c394a" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${literata.variable} ${hanken.variable} ${martian.variable}`}>
      <body>
        <FundoTema />
        <RolagemSuave />
        {children}
      </body>
    </html>
  );
}
