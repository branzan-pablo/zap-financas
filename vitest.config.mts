import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    // Cobre apenas as funções puras de domínio (categorização, mock provider).
    // Não usamos jsdom: nada aqui depende de DOM.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      // Espelha o paths "@/*" do tsconfig para os imports dos testes.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
