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
 * Contrato de um provider de Open Finance.
 *
 * Toda implementação (mock, Pluggy, Belvo…) cumpre esta interface. O resto do
 * app fala APENAS com ela — trocar de fornecedor não toca em UI nem no sync.
 *
 * Ver implementações:
 *  - [mock-provider.ts](./mock-provider.ts) — dados determinísticos, sem rede.
 *  - [pluggy-provider.ts](./pluggy-provider.ts) — stub p/ a Fase 1 real.
 */
export interface OpenFinanceProvider {
  /** Nome curto da implementação ativa (telemetria/debug). */
  readonly nome: string;

  /** Instituições disponíveis no widget de conexão. */
  listInstitutions(): Promise<OFInstitution[]>;

  /** Token efêmero p/ abrir o widget de consentimento. */
  createConnectToken(): Promise<OFConnectToken>;

  /**
   * Cria (ou recupera) o item resultante do consentimento numa instituição.
   * No mundo real isto acontece após o usuário concluir o Pluggy Connect.
   */
  createItem(institutionId: string): Promise<OFItem>;

  fetchItem(itemId: string): Promise<OFItem>;
  fetchAccounts(itemId: string): Promise<OFAccount[]>;
  /** `since` (YYYY-MM-DD) permite sync incremental; omitido = histórico completo. */
  fetchTransactions(itemId: string, since?: string): Promise<OFTransaction[]>;
  fetchCards(itemId: string): Promise<OFCard[]>;
  fetchInvestments(itemId: string): Promise<OFInvestment[]>;
}
