import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Literata, Martian_Mono } from "next/font/google";
import { FundoTema } from "@/components/FundoTema";
import { RolagemSuave } from "@/components/RolagemSuave";
import "lenis/dist/lenis.css";
import "./globals.css";

const literata = Literata({ variable: "--font-literata", subsets: ["latin"], axes: ["opsz"] });
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"] });
const martian = Martian_Mono({ variable: "--font-martian", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: "Íris Pet Spa — banho, tosa e spa em todo o Brasil",
  description:
    "Banho, tosa, spa, loja e Táxi Dog numa das maiores redes de petshop do Brasil. Agende o banho do seu pet.",
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
