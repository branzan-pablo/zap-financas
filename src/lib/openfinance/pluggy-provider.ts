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
 * Provider Pluggy (Open Finance) — integração real.
 *
 * Contrato verificado ao vivo contra a API sandbox (jan/2026):
 *   • auth:         POST /auth {clientId, clientSecret} → {apiKey}  (header X-API-KEY)
 *   • connectors:   GET /connectors?sandbox=true
 *   • item:         POST /items {connectorId, parameters} → poll GET /items/{id}
 *   • accounts:     GET /accounts?itemId=   (type BANK|CREDIT, creditData)
 *   • transactions: GET /v2/transactions?accountId=  (cursor `next`; o v1 está 410)
 *   • investments:  GET /investments?itemId=
 *   • connect token:POST /connect_token → {accessToken}  (widget Pluggy Connect)
 *
 * ⚠️ Produção usa o widget Pluggy Connect no frontend para criar o item (o
 * usuário digita as credenciais no iframe do Pluggy, não no nosso form). Aqui,
 * `createItem` cria um item de SANDBOX (connector "Pluggy Bank", credenciais de
 * teste) para o fluxo funcionar ponta a ponta sem o widget. Ver docs/ p/ o
 * plano de produção.
 */

const API = "https://api.pluggy.ai";
const STATUS_FINAL = ["UPDATED", "LOGIN_ERROR", "OUTDATED", "ERROR"];

type PluggyConnector = { id: number; name: string; type: string; primaryColor?: string };
type PluggyAccount = {
  id: string;
  type: "BANK" | "CREDIT";
  subtype?: string;
  name: string;
  balance: number;
  currencyCode?: string;
  creditData?: {
    brand?: string;
    creditLimit?: number;
    balanceCloseDate?: string;
    balanceDueDate?: string;
  };
};
type PluggyTx = {
  id: string;
  description?: string;
  amount: number;
  date: string;
  type?: "DEBIT" | "CREDIT";
  creditCardMetadata?: { installmentNumber?: number; totalInstallments?: number } | null;
};
type PluggyInvestment = {
  id: string;
  name: string;
  type?: string;
  balance?: number;
  amount?: number;
  amountProfit?: number;
  annualRate?: number;
  lastTwelveMonthsRate?: number;
  date?: string;
  dueDate?: string;
};

export class PluggyOpenFinanceProvider implements OpenFinanceProvider {
  readonly nome = "pluggy";
  private apiKey: string | null = null;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string
  ) {}

  // --- Auth ------------------------------------------------------------------

  private async getApiKey(): Promise<string> {
    if (this.apiKey) return this.apiKey;
    const res = await fetch(`${API}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: this.clientId, clientSecret: this.clientSecret }),
    });
    if (!res.ok) throw new Error(`Pluggy auth falhou: ${res.status} ${await res.text()}`);
    const { apiKey } = (await res.json()) as { apiKey: string };
    this.apiKey = apiKey;
    return apiKey;
  }

  private async api<T>(path: string, init?: RequestInit): Promise<T> {
    const key = await this.getApiKey();
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { "X-API-KEY": key, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`Pluggy ${path} falhou: ${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  }

  // --- Provider --------------------------------------------------------------

  async listInstitutions(): Promise<OFInstitution[]> {
    const { results } = await this.api<{ results: PluggyConnector[] }>(
      "/connectors?sandbox=true"
    );
    // No sandbox, os connectors "Pluggy Bank" aceitam as credenciais de teste.
    return results
      .filter((c) => c.name.startsWith("Pluggy Bank"))
      .slice(0, 6)
      .map((c) => ({
        id: String(c.id),
        nome: c.name,
        cor: c.primaryColor ? `#${c.primaryColor.replace("#", "")}` : "#00457C",
        tipo: c.type === "INVESTMENT" ? "investimento" : "banco",
      }));
  }

  async createConnectToken(): Promise<OFConnectToken> {
    const { accessToken } = await this.api<{ accessToken: string }>("/connect_token", {
      method: "POST",
      body: JSON.stringify({}),
    });
    return { token: accessToken, expiraEm: new Date(Date.now() + 30 * 60_000).toISOString() };
  }

  async createItem(institutionId: string): Promise<OFItem> {
    // Sandbox: credenciais de teste do connector "Pluggy Bank".
    const item = await this.api<{ id: string; status: string }>("/items", {
      method: "POST",
      body: JSON.stringify({
        connectorId: Number(institutionId),
        parameters: { user: "user-ok", password: "password-ok" },
      }),
    });
    // Aguarda o item terminar de atualizar (produção: o widget já entrega UPDATED).
    let current = item;
    for (let i = 0; i < 25 && !STATUS_FINAL.includes(current.status); i++) {
      await new Promise((r) => setTimeout(r, 3000));
      current = await this.api<{ id: string; status: string }>(`/items/${item.id}`);
    }
    return this.mapItem(current.id, current.status);
  }

  async fetchItem(itemId: string): Promise<OFItem> {
    const it = await this.api<{ id: string; status: string }>(`/items/${itemId}`);
    return this.mapItem(it.id, it.status);
  }

  async fetchAccounts(itemId: string): Promise<OFAccount[]> {
    const { results } = await this.api<{ results: PluggyAccount[] }>(
      `/accounts?itemId=${itemId}`
    );
    return results.map((a) => ({
      accountId: a.id,
      nome: a.name,
      banco: a.name,
      tipo: this.mapAccountTipo(a),
      saldo: a.balance,
      moeda: a.currencyCode ?? "BRL",
    }));
  }

  async fetchTransactions(itemId: string): Promise<OFTransaction[]> {
    const accounts = await this.fetchAccounts(itemId);
    const txs: OFTransaction[] = [];
    for (const acc of accounts) {
      if (acc.tipo === "investimento") continue;
      // Cursor pagination via `next`.
      let url: string | null = `/v2/transactions?accountId=${acc.accountId}`;
      let guard = 0;
      while (url && guard++ < 50) {
        const page: { results: PluggyTx[]; next?: string | null } = await this.api(url);
        for (const t of page.results) {
          const parcela =
            t.creditCardMetadata?.totalInstallments && t.creditCardMetadata.totalInstallments > 1
              ? {
                  atual: t.creditCardMetadata.installmentNumber ?? 1,
                  total: t.creditCardMetadata.totalInstallments,
                }
              : undefined;
          txs.push({
            transactionId: t.id,
            accountId: acc.accountId,
            valor: t.amount,
            descricao: t.description ?? "Transação",
            data: t.date.slice(0, 10),
            tipo: t.type === "CREDIT" ? "credito" : "debito",
            parcela,
          });
        }
        // `next` pode vir como URL completa ou caminho relativo.
        url = page.next ? page.next.replace(API, "") : null;
      }
    }
    return txs;
  }

  async fetchCards(itemId: string): Promise<OFCard[]> {
    const { results } = await this.api<{ results: PluggyAccount[] }>(
      `/accounts?itemId=${itemId}`
    );
    return results
      .filter((a) => a.type === "CREDIT")
      .map((a) => ({
        cardId: a.id,
        accountId: a.id,
        nome: a.name,
        bandeira: (a.creditData?.brand ?? "").toLowerCase() || "outro",
        limite: a.creditData?.creditLimit ?? 0,
        diaFechamento: this.dia(a.creditData?.balanceCloseDate) ?? 1,
        diaVencimento: this.dia(a.creditData?.balanceDueDate) ?? 10,
      }));
  }

  async fetchInvestments(itemId: string): Promise<OFInvestment[]> {
    const { results } = await this.api<{ results: PluggyInvestment[] }>(
      `/investments?itemId=${itemId}`
    );
    return results.map((i) => {
      const atual = i.balance ?? i.amount ?? 0;
      // Aplicado ≈ atual − lucro (amountOriginal do Pluggy é por cota, não total).
      const aplicado = i.amountProfit != null ? atual - i.amountProfit : atual;
      return {
        investmentId: i.id,
        accountId: itemId, // Pluggy não amarra investimento a uma account; usamos o item
        nome: i.name,
        tipo: this.mapInvestimentoTipo(i.type),
        valorAplicado: Math.round(aplicado * 100) / 100,
        valorAtual: atual,
        rendimentoPct: i.lastTwelveMonthsRate ?? i.annualRate ?? 0,
        dataAplicacao: i.date?.slice(0, 10),
        dataVencimento: i.dueDate?.slice(0, 10),
      };
    });
  }

  // --- Helpers ---------------------------------------------------------------

  private mapItem(id: string, status: string): OFItem {
    return {
      itemId: id,
      institutionId: "",
      institutionNome: "Pluggy",
      status: status === "UPDATED" ? "atualizado" : status === "UPDATING" ? "atualizando" : "erro",
      criadoEm: new Date().toISOString(),
    };
  }

  private mapAccountTipo(a: PluggyAccount): OFAccount["tipo"] {
    if (a.type === "CREDIT") return "cartao";
    if (a.subtype === "SAVINGS_ACCOUNT") return "poupanca";
    return "corrente";
  }

  private mapInvestimentoTipo(tipo?: string): OFInvestment["tipo"] {
    switch (tipo) {
      case "MUTUAL_FUND":
        return "fundo";
      case "EQUITY":
      case "ETF":
        return "acao";
      case "FIXED_INCOME":
        return "cdb";
      default:
        return "outro";
    }
  }

  private dia(iso?: string): number | null {
    if (!iso) return null;
    return new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).getDate();
  }
}
