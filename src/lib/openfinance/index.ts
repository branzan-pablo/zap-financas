import type { OpenFinanceProvider } from "./provider";
import { MockOpenFinanceProvider } from "./mock-provider";
import { PluggyOpenFinanceProvider } from "./pluggy-provider";

export type { OpenFinanceProvider } from "./provider";
export type * from "./types";

/**
 * Factory do provider de Open Finance — escolhe a implementação por env.
 *
 * Mesma filosofia das demais camadas: real quando configurado,
 * fallback seguro caso contrário.
 *
 *   OPENFINANCE_PROVIDER=pluggy  + PLUGGY_CLIENT_ID/SECRET  → Pluggy real
 *   (qualquer outro caso)                                   → mock
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

  return new MockOpenFinanceProvider();
}
