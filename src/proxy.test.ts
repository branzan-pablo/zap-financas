import { describe, it, expect } from "vitest";
import { redirecionamentoDeAuth } from "./proxy";

/**
 * O proxy redirecionava também o POST de uma Server Action, e o cliente do Next
 * recebia um 307 onde esperava o payload da action.
 *
 * Verificado em produção antes da correção:
 *
 *     POST /signup    → 307    (o proxy mandou para /dashboard)
 *     POST /dashboard → 200    (o browser reenviou o POST)
 *     console: "An unexpected response was received from the server."
 *
 * O usuário via o error boundary — nunca a tela de login. O caso espelho é o
 * grave: sessão expira, a pessoa salva uma transação, e em vez de ir para o
 * login vê "Algo deu errado" no meio de um lançamento de dinheiro.
 */

const base = {
  temSessao: false,
  rotaApp: false,
  rotaAuth: false,
  acaoDeServidor: false,
};

describe("redirecionamentoDeAuth — navegação", () => {
  it("sem sessão em rota do app vai para o login", () => {
    expect(redirecionamentoDeAuth({ ...base, rotaApp: true })).toBe("/login");
  });

  it("com sessão em rota de auth vai para o dashboard", () => {
    expect(
      redirecionamentoDeAuth({ ...base, temSessao: true, rotaAuth: true })
    ).toBe("/dashboard");
  });

  it("com sessão em rota do app não redireciona", () => {
    expect(
      redirecionamentoDeAuth({ ...base, temSessao: true, rotaApp: true })
    ).toBeNull();
  });

  it("sem sessão em rota de auth não redireciona", () => {
    expect(redirecionamentoDeAuth({ ...base, rotaAuth: true })).toBeNull();
  });

  it("rota pública não redireciona em nenhum dos casos", () => {
    expect(redirecionamentoDeAuth(base)).toBeNull();
    expect(redirecionamentoDeAuth({ ...base, temSessao: true })).toBeNull();
  });
});

describe("redirecionamentoDeAuth — Server Action nunca é redirecionada", () => {
  // Cada um destes redirecionaria numa navegação. Em action, todos devem passar:
  // a action chama `supabase.auth.getUser()` e decide sozinha, e um `redirect()`
  // vindo de dentro dela o Next sabe entregar ao cliente.
  it("sessão expirada durante um lançamento não vira erro de servidor", () => {
    expect(
      redirecionamentoDeAuth({ ...base, rotaApp: true, acaoDeServidor: true })
    ).toBeNull();
  });

  it("cadastro enviado com sessão ativa não vira erro de servidor", () => {
    expect(
      redirecionamentoDeAuth({
        ...base,
        temSessao: true,
        rotaAuth: true,
        acaoDeServidor: true,
      })
    ).toBeNull();
  });
});
