/**
 * DTOs neutros de Open Finance.
 *
 * Estes tipos são a fronteira entre QUALQUER provider (mock, Pluggy, Belvo…)
 * e o resto do app. O sync ([sync.ts](./sync.ts)) mapeia destes DTOs para as
 * linhas das tabelas Supabase — nenhuma camada acima do provider conhece o
 * formato bruto do fornecedor.
 *
 * Regra: mudar de fornecedor = trocar a implementação do provider, sem tocar
 * nestes tipos nem no sync.
 */

/** Instituição financeira oferecida no widget de conexão. */
export type OFInstitution = {
  id: string;
  nome: string;
  cor: string; // hex de marca, p/ o widget
  tipo: "banco" | "cartao" | "investimento";
};

/** Token efêmero para abrir o widget de consentimento (Pluggy Connect). */
export type OFConnectToken = {
  token: string;
  expiraEm: string; // ISO
};

/** Item = uma conexão consentida com uma instituição (pode conter N contas). */
export type OFItem = {
  itemId: string;
  institutionId: string;
  institutionNome: string;
  status: "atualizando" | "atualizado" | "erro";
  criadoEm: string; // ISO
};

/** Conta dentro de um item. */
export type OFAccount = {
  accountId: string;
  nome: string;
  banco: string;
  tipo: "corrente" | "poupanca" | "cartao" | "investimento" | "outro";
  saldo: number;
  moeda: string; // "BRL"
};

/** Transação dentro de uma conta. */
export type OFTransaction = {
  transactionId: string; // estável entre syncs → idempotência
  accountId: string;
  valor: number; // positivo = crédito, negativo = débito
  descricao: string;
  data: string; // YYYY-MM-DD
  tipo: "debito" | "credito" | "transferencia";
  /** Metadados de parcelamento, quando o provider os expõe. */
  parcela?: { atual: number; total: number };
};

/** Cartão de crédito vinculado a uma conta do tipo 'cartao'. */
export type OFCard = {
  cardId: string; // id estável do cartão no provider → idempotência
  accountId: string; // conta (tipo cartao) à qual o cartão pertence
  nome: string;
  bandeira: string; // 'visa' | 'mastercard' | 'elo' | ...
  limite: number;
  diaFechamento: number; // 1..31
  diaVencimento: number; // 1..31
};

/** Posição de investimento dentro de um item. */
export type OFInvestment = {
  investmentId: string;
  accountId: string;
  nome: string;
  tipo: "cdb" | "lci" | "lca" | "tesouro" | "fundo" | "acao" | "cripto" | "outro";
  valorAplicado: number;
  valorAtual: number;
  rendimentoPct: number;
  dataAplicacao?: string; // YYYY-MM-DD
  dataVencimento?: string; // YYYY-MM-DD
};
