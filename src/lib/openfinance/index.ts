import type { OpenFinanceProvider } from "./provider";
import { MockOpenFinanceProvider } from "./mock-provider";
import { PluggyOpenFinanceProvider } from "./pluggy-provider";

export type { OpenFinanceProvider } from "./provider";
export type * from "./types";

/**
 * Factory do provider de Open Finance — escolhe a implementação por env.
 *
 *   OPENFINANCE_PROVIDER=pluggy  + PLUGGY_CLIENT_ID/SECRET  → Pluggy real
 *   (qualquer outro caso, fora de produção)                 → mock
 *
 * ⚠️ FAIL CLOSED EM PRODUÇÃO. O mock gera contas e transações fictícias. Cair
 * nele em produção — por env var ausente ou com typo — encheria o extrato real
 * de usuários com dados inventados, indistinguíveis dos verdadeiros. Melhor
 * quebrar alto na hora do que corromper dados financeiros em silêncio.
 */
export function getOpenFinanceProvider(): OpenFinanceProvider {
  const provider = process.env.OPENFINANCE_PROVIDER;
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (provider === "pluggy") {
    if (!clientId || !clientSecret) {
      throw new Error(
        "OPENFINANCE_PROVIDER=pluggy requer PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET."
      );
    }
    return new PluggyOpenFinanceProvider(clientId, clientSecret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Em produção, OPENFINANCE_PROVIDER precisa ser 'pluggy'. " +
        "O provider mock injeta transações fictícias e nunca pode rodar em produção."
    );
  }

  return new MockOpenFinanceProvider();
}
