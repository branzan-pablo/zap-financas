/* eslint-disable @typescript-eslint/no-unused-vars -- stub: params entram quando os métodos forem implementados (Fase 1 real). */
import type { OpenFinanceProvider } from "./provider";
import type {
  OFAccount,
  OFCard,
  OFConnectToken,
  OFInstitution,
  OFInvestment,
  OFItem,
  OFTransaction,
} from "./types";

/**
 * Provider Pluggy — STUB.
 *
 * Esqueleto da integração real de Open Finance (Fase 1 com contrato Pluggy).
 * Cada método será preenchido com chamadas à API Pluggy usando
 * PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET (server-only).
 *
 * Enquanto não há contrato, `getOpenFinanceProvider()` devolve o mock; este
 * arquivo só entra quando OPENFINANCE_PROVIDER=pluggy. Lançar erro explícito
 * evita silenciosamente "funcionar" sem credenciais.
 *
 * Docs: https://docs.pluggy.ai/
 */
export class PluggyOpenFinanceProvider implements OpenFinanceProvider {
  readonly nome = "pluggy";

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string
  ) {}

  private naoImplementado(metodo: string): never {
    throw new Error(
      `PluggyOpenFinanceProvider.${metodo} ainda não implementado — ` +
        `pendente de contrato/sandbox Pluggy (Fase 1 real).`
    );
  }

  async listInstitutions(): Promise<OFInstitution[]> {
    return this.naoImplementado("listInstitutions");
  }
  async createConnectToken(): Promise<OFConnectToken> {
    return this.naoImplementado("createConnectToken");
  }
  async createItem(_institutionId: string): Promise<OFItem> {
    return this.naoImplementado("createItem");
  }
  async fetchItem(_itemId: string): Promise<OFItem> {
    return this.naoImplementado("fetchItem");
  }
  async fetchAccounts(_itemId: string): Promise<OFAccount[]> {
    return this.naoImplementado("fetchAccounts");
  }
  async fetchTransactions(
    _itemId: string,
    _since?: string
  ): Promise<OFTransaction[]> {
    return this.naoImplementado("fetchTransactions");
  }
  async fetchCards(_itemId: string): Promise<OFCard[]> {
    return this.naoImplementado("fetchCards");
  }
  async fetchInvestments(_itemId: string): Promise<OFInvestment[]> {
    return this.naoImplementado("fetchInvestments");
  }
}
