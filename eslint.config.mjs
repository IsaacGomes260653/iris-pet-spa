import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // A cena 3D segue o modelo imperativo do three.js: objetos criados uma vez (useMemo/useRef)
    // são mutados a cada quadro dentro do useFrame. As regras de imutabilidade do React Compiler
    // não se aplicam a esse laço de renderização.
    files: ["src/components/passeio/**"],
    rules: { "react-hooks/immutability": "off", "react-hooks/refs": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
