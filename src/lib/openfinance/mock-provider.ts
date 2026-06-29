import type { OpenFinanceProvider } from "./provider";
import type {
  OFAccount,
  OFConnectToken,
  OFInstitution,
  OFInvestment,
  OFItem,
  OFTransaction,
} from "./types";

/**
 * Provider de Open Finance MOCK — dados determinísticos, sem rede.
 *
 * Usado enquanto não temos contrato/sandbox da Pluggy. Tudo é derivado por
 * seed do `itemId`/`accountId`, então:
 *   • o mesmo input sempre produz o mesmo output (testável);
 *   • rodar o sync N vezes não cria duplicatas (mesmos `transactionId`).
 *
 * NÃO usa Math.random nem Date.now em caminho de geração — datas relativas
 * derivam de uma âncora calculada uma vez por chamada.
 */

// --- PRNG determinístico ----------------------------------------------------

/** Hash de string → uint32 (FNV-1a). */
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Gerador mulberry32: a partir de um seed, devolve floats [0,1). */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

function money(r: () => number, min: number, max: number): number {
  return Math.round((min + r() * (max - min)) * 100) / 100;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// --- Catálogo ---------------------------------------------------------------

const INSTITUTIONS: readonly OFInstitution[] = [
  { id: "nubank", nome: "Nubank", cor: "#820ad1", tipo: "banco" },
  { id: "itau", nome: "Itaú", cor: "#ec7000", tipo: "banco" },
  { id: "bradesco", nome: "Bradesco", cor: "#cc092f", tipo: "banco" },
  { id: "inter", nome: "Inter", cor: "#ff7a00", tipo: "banco" },
  { id: "c6", nome: "C6 Bank", cor: "#242424", tipo: "banco" },
  { id: "xp", nome: "XP Investimentos", cor: "#0f1419", tipo: "investimento" },
];

/** Estabelecimentos por natureza — a descrição também guia a categorização. */
const COMPRAS: readonly { desc: string; min: number; max: number }[] = [
  { desc: "iFood *Restaurante", min: 28, max: 95 },
  { desc: "Uber *Trip", min: 9, max: 48 },
  { desc: "99 *Pop", min: 8, max: 40 },
  { desc: "Supermercado Pao de Acucar", min: 60, max: 420 },
  { desc: "Carrefour", min: 40, max: 380 },
  { desc: "Drogasil", min: 15, max: 160 },
  { desc: "Posto Shell", min: 80, max: 300 },
  { desc: "Amazon.com.br", min: 25, max: 350 },
  { desc: "Mercado Livre", min: 20, max: 500 },
  { desc: "Padaria Sao Jose", min: 8, max: 45 },
  { desc: "Cinema Cinemark", min: 30, max: 90 },
  { desc: "Zara", min: 90, max: 460 },
];

/** Assinaturas recorrentes (valor fixo, mensal). */
const ASSINATURAS: readonly { desc: string; valor: number }[] = [
  { desc: "Netflix.com", valor: 44.9 },
  { desc: "Spotify", valor: 21.9 },
  { desc: "Amazon Prime", valor: 14.9 },
];

/** Compras parceladas — geram metadados de parcela. */
const PARCELADAS: readonly { desc: string; total: number; valorParcela: number }[] = [
  { desc: "Magazine Luiza - Geladeira", total: 10, valorParcela: 289.9 },
  { desc: "Fast Shop - Notebook", total: 12, valorParcela: 416.58 },
  { desc: "Centauro - Tenis", total: 6, valorParcela: 83.32 },
];

// --- Implementação ----------------------------------------------------------

export class MockOpenFinanceProvider implements OpenFinanceProvider {
  readonly nome = "mock";

  async listInstitutions(): Promise<OFInstitution[]> {
    return [...INSTITUTIONS];
  }

  async createConnectToken(): Promise<OFConnectToken> {
    // Token fake; validade simbólica de 30 min a partir de agora.
    const expira = new Date(Date.now() + 30 * 60_000);
    return { token: "mock-connect-token", expiraEm: expira.toISOString() };
  }

  async createItem(institutionId: string): Promise<OFItem> {
    const inst =
      INSTITUTIONS.find((i) => i.id === institutionId) ?? INSTITUTIONS[0];
    return {
      // itemId estável por instituição → reconectar não duplica contas.
      itemId: `mock-item-${inst.id}`,
      institutionId: inst.id,
      institutionNome: inst.nome,
      status: "atualizado",
      criadoEm: new Date().toISOString(),
    };
  }

  async fetchItem(itemId: string): Promise<OFItem> {
    const instId = itemId.replace("mock-item-", "");
    const inst = INSTITUTIONS.find((i) => i.id === instId) ?? INSTITUTIONS[0];
    return {
      itemId,
      institutionId: inst.id,
      institutionNome: inst.nome,
      status: "atualizado",
      criadoEm: new Date().toISOString(),
    };
  }

  async fetchAccounts(itemId: string): Promise<OFAccount[]> {
    const instId = itemId.replace("mock-item-", "");
    const inst = INSTITUTIONS.find((i) => i.id === instId) ?? INSTITUTIONS[0];
    const r = rng(hash(itemId));

    if (inst.tipo === "investimento") {
      return [
        {
          accountId: `${itemId}-inv`,
          nome: `${inst.nome} • Investimentos`,
          banco: inst.nome,
          tipo: "investimento",
          saldo: money(r, 5000, 80000),
          moeda: "BRL",
        },
      ];
    }

    // Banco: conta corrente + cartão de crédito.
    return [
      {
        accountId: `${itemId}-cc`,
        nome: `${inst.nome} • Conta`,
        banco: inst.nome,
        tipo: "corrente",
        saldo: money(r, 800, 12000),
        moeda: "BRL",
      },
      {
        accountId: `${itemId}-card`,
        nome: `${inst.nome} • Cartão`,
        banco: inst.nome,
        tipo: "cartao",
        saldo: -money(r, 200, 4500), // fatura aberta (negativo)
        moeda: "BRL",
      },
    ];
  }

  async fetchTransactions(
    itemId: string,
    since?: string
  ): Promise<OFTransaction[]> {
    const accounts = await this.fetchAccounts(itemId);
    const anchor = new Date(); // âncora única por chamada
    const sinceTime = since ? new Date(since).getTime() : -Infinity;
    const txs: OFTransaction[] = [];

    for (const acc of accounts) {
      if (acc.tipo === "investimento") continue;
      const r = rng(hash(acc.accountId));

      // Conta corrente recebe salário mensal (crédito).
      if (acc.tipo === "corrente") {
        const salario = money(r, 3500, 14000);
        for (let m = 0; m < 3; m++) {
          const d = new Date(anchor);
          d.setMonth(d.getMonth() - m);
          d.setDate(5);
          txs.push({
            transactionId: `${acc.accountId}-salario-${m}`,
            accountId: acc.accountId,
            valor: salario,
            descricao: "Pagamento Salario",
            data: ymd(d),
            tipo: "credito",
          });
        }
      }

      // ~30 compras nos últimos 90 dias.
      const n = 28 + Math.floor(r() * 8);
      for (let i = 0; i < n; i++) {
        const diasAtras = Math.floor(r() * 90);
        const d = new Date(anchor);
        d.setDate(d.getDate() - diasAtras);
        const c = pick(r, COMPRAS);
        txs.push({
          transactionId: `${acc.accountId}-tx-${i}`,
          accountId: acc.accountId,
          valor: -money(r, c.min, c.max),
          descricao: c.desc,
          data: ymd(d),
          tipo: "debito",
        });
      }

      // Assinaturas recorrentes (3 meses), só no cartão.
      if (acc.tipo === "cartao") {
        for (const a of ASSINATURAS) {
          for (let m = 0; m < 3; m++) {
            const d = new Date(anchor);
            d.setMonth(d.getMonth() - m);
            d.setDate(12);
            txs.push({
              transactionId: `${acc.accountId}-assin-${a.desc}-${m}`,
              accountId: acc.accountId,
              valor: -a.valor,
              descricao: a.desc,
              data: ymd(d),
              tipo: "debito",
            });
          }
        }

        // Uma compra parcelada (parcela atual derivada por seed).
        const p = pick(r, PARCELADAS);
        const atual = 1 + Math.floor(r() * Math.min(p.total, 4));
        const d = new Date(anchor);
        d.setDate(15);
        txs.push({
          transactionId: `${acc.accountId}-parc-${p.desc}`,
          accountId: acc.accountId,
          valor: -p.valorParcela,
          descricao: `${p.desc} ${atual}/${p.total}`,
          data: ymd(d),
          tipo: "debito",
          parcela: { atual, total: p.total },
        });
      }
    }

    // Filtro incremental + ordenação estável (data desc, depois id).
    return txs
      .filter((t) => new Date(t.data).getTime() >= sinceTime)
      .sort(
        (a, b) =>
          new Date(b.data).getTime() - new Date(a.data).getTime() ||
          a.transactionId.localeCompare(b.transactionId)
      );
  }

  async fetchInvestments(itemId: string): Promise<OFInvestment[]> {
    const instId = itemId.replace("mock-item-", "");
    const inst = INSTITUTIONS.find((i) => i.id === instId) ?? INSTITUTIONS[0];
    if (inst.tipo !== "investimento") return [];

    const r = rng(hash(`${itemId}-inv`));
    const posicoes: { nome: string; tipo: OFInvestment["tipo"] }[] = [
      { nome: "CDB Banco XP 110% CDI", tipo: "cdb" },
      { nome: "Tesouro Selic 2029", tipo: "tesouro" },
      { nome: "Fundo Multimercado XP", tipo: "fundo" },
      { nome: "PETR4", tipo: "acao" },
    ];

    return posicoes.map((pos, idx) => {
      const aplicado = money(r, 1000, 30000);
      const rend = Math.round((r() * 18 - 2) * 100) / 100; // -2% a +16%
      return {
        investmentId: `${itemId}-inv-${idx}`,
        accountId: `${itemId}-inv`,
        nome: pos.nome,
        tipo: pos.tipo,
        valorAplicado: aplicado,
        valorAtual: Math.round(aplicado * (1 + rend / 100) * 100) / 100,
        rendimentoPct: rend,
      };
    });
  }
}
