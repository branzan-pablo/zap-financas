import { describe, it, expect } from "vitest";
import { destinoSeguro } from "./route";

/**
 * `next` chega pela URL, e a URL chega por e-mail — ou seja, de fora.
 *
 * O ataque que isto impede: mandar para a vítima um link legítimo NOSSO, com
 * `?next=//site-falso.com`. Ela clica, autentica de verdade no nosso domínio, e
 * é redirecionada para uma cópia da tela pedindo os dados do banco. Como o
 * login aconteceu mesmo, nada parece errado.
 *
 * Não dá para cobrir isto por fora: uma requisição com `next` malicioso e token
 * inválido é barrada no token, antes de chegar aqui — o teste passaria sem a
 * proteção existir. Por isso a garantia mora neste arquivo.
 */

describe("destinoSeguro", () => {
  it.each([
    "/dashboard",
    "/reset-password",
    "/configuracoes/whatsapp",
    "/transacoes?mes=2026-08",
  ])("aceita caminho interno: %s", (next) => {
    expect(destinoSeguro(next)).toBe(next);
  });

  it.each([
    ["//site-falso.com", "protocol-relative — o navegador trata como host externo"],
    ["//site-falso.com/login", "idem, com caminho"],
    ["https://site-falso.com", "URL absoluta"],
    ["http://site-falso.com", "URL absoluta sem TLS"],
    ["javascript:alert(1)", "esquema executável"],
    ["dashboard", "sem barra inicial — viraria relativo à rota atual"],
  ])("recusa %s (%s)", (next) => {
    expect(destinoSeguro(next)).toBe("/dashboard");
  });

  it.each([null, ""])("cai no padrão quando ausente (%s)", (next) => {
    expect(destinoSeguro(next)).toBe("/dashboard");
  });
});
