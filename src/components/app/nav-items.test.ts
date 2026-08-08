import { describe, it, expect } from "vitest";
import { NAV, CONFIG, ABAS_MOBILE, isActive } from "./nav-items";

/**
 * A `MobileNav` referenciava o `NAV` por índice (`NAV[5]`, `NAV[7]`). Ao remover
 * "Metas" do meio da lista, as abas deslizavam sem avisar: "Investimentos"
 * viraria "Orçamentos" e uma entrada da folha "Mais" viraria `undefined`.
 *
 * Agora a divisão é por rota. Estes testes existem para que a próxima remoção
 * seja barrada aqui, e não descoberta no celular de um usuário.
 */

describe("NAV", () => {
  it("não tem rota duplicada", () => {
    const hrefs = NAV.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("toda seção tem rota, rótulo e ícone", () => {
    for (const item of NAV) {
      expect(item.href.startsWith("/")).toBe(true);
      expect(item.label.length).toBeGreaterThan(0);
      // Ícone do lucide é `forwardRef` — objeto, não função. Só precisa existir.
      expect(item.Icon).toBeTruthy();
    }
  });

  it("não expõe /metas — a rota foi removida com a página", () => {
    expect(NAV.some((i) => i.href === "/metas")).toBe(false);
  });

  it("Configurações fica fora do NAV (vai para a folha 'Mais')", () => {
    expect(NAV.some((i) => i.href === CONFIG.href)).toBe(false);
  });
});

describe("ABAS_MOBILE", () => {
  it("toda aba aponta para uma seção que existe no NAV", () => {
    // O invariante que importa: uma aba órfã vira `undefined` na barra.
    for (const href of ABAS_MOBILE) {
      expect(NAV.some((i) => i.href === href)).toBe(true);
    }
  });

  it("são 4 — a barra tem 5 colunas, e a quinta é o botão 'Mais'", () => {
    expect(ABAS_MOBILE).toHaveLength(4);
  });

  it("o que não é aba sobra para 'Mais', sem perder nem repetir seção", () => {
    const abas = NAV.filter((i) => ABAS_MOBILE.includes(i.href as (typeof ABAS_MOBILE)[number]));
    const mais = NAV.filter((i) => !ABAS_MOBILE.includes(i.href as (typeof ABAS_MOBILE)[number]));
    expect(abas.length + mais.length).toBe(NAV.length);
    expect(abas.some((i) => mais.includes(i))).toBe(false);
  });
});

describe("isActive", () => {
  it("casa a rota exata e as subrotas", () => {
    expect(isActive("/configuracoes", "/configuracoes")).toBe(true);
    expect(isActive("/configuracoes/whatsapp", "/configuracoes")).toBe(true);
  });

  it("não casa rota que apenas começa com o mesmo texto", () => {
    // "/contas-antigas" não é subrota de "/contas".
    expect(isActive("/contas-antigas", "/contas")).toBe(false);
  });
});
