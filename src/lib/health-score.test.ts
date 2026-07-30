import { describe, expect, it } from "vitest";
import { calcularScore, nivelDe, type EntradaScore } from "./health-score";

const base: EntradaScore = {
  rendaMes: 10000,
  gastoMes: 8000,
  saldoContas: 12000,
  totalInvestido: 12000,
  faturaTotal: 2000,
  custoAssinaturas: 500,
  numDuplicatas: 0,
  orcamentos: [{ status: "ok" }, { status: "ok" }],
};

describe("calcularScore", () => {
  it("cenário saudável tem nota alta", () => {
    const r = calcularScore({
      ...base,
      gastoMes: 7000, // sobra 30%
      saldoContas: 30000,
      totalInvestido: 20000, // ~7 meses de reserva
      faturaTotal: 1000, // 10% da renda
      custoAssinaturas: 300, // 3%
    });
    expect(r.score).toBeGreaterThanOrEqual(80);
    expect(r.nivel).toBe("excelente");
    expect(r.dicas).toEqual([]);
  });

  it("cenário ruim tem nota baixa e dicas", () => {
    const r = calcularScore({
      rendaMes: 5000,
      gastoMes: 6000, // gastou mais do que entrou
      saldoContas: 0,
      totalInvestido: 0, // sem reserva
      faturaTotal: 3500, // 70% da renda
      custoAssinaturas: 1200, // 24%
      numDuplicatas: 2,
      orcamentos: [{ status: "estouro" }, { status: "estouro" }],
    });
    expect(r.score).toBeLessThan(40);
    expect(r.nivel).toBe("critico");
    expect(r.dicas.length).toBeGreaterThan(0);
  });

  it("score fica sempre entre 0 e 100", () => {
    const pessimo = calcularScore({
      rendaMes: 1000,
      gastoMes: 100000,
      saldoContas: -5000,
      totalInvestido: 0,
      faturaTotal: 90000,
      custoAssinaturas: 5000,
      numDuplicatas: 10,
      orcamentos: [{ status: "estouro" }],
    });
    expect(pessimo.score).toBeGreaterThanOrEqual(0);
    const otimo = calcularScore({
      rendaMes: 10000,
      gastoMes: 1000,
      saldoContas: 500000,
      totalInvestido: 500000,
      faturaTotal: 0,
      custoAssinaturas: 0,
      numDuplicatas: 0,
      orcamentos: [{ status: "ok" }],
    });
    expect(otimo.score).toBeLessThanOrEqual(100);
    expect(otimo.score).toBe(100);
  });

  describe("honestidade: componentes não avaliáveis não punem", () => {
    it("sem orçamento definido, o componente sai da conta (nem punição, nem bônus)", () => {
      const semOrcamento = calcularScore({ ...base, orcamentos: [] });
      const comTodosOk = calcularScore(base);
      const comEstourados = calcularScore({
        ...base,
        orcamentos: [{ status: "estouro" }, { status: "estouro" }],
      });

      expect(semOrcamento.componentes.some((c) => c.chave === "orcamentos")).toBe(false);
      // Não punido: quem não definiu orçamento fica MELHOR que quem estoura.
      expect(semOrcamento.score).toBeGreaterThan(comEstourados.score);
      // Sem bônus grátis: não supera quem tem disciplina comprovada.
      expect(semOrcamento.score).toBeLessThanOrEqual(comTodosOk.score);
    });

    it("sem renda registrada, componentes dependentes de renda saem", () => {
      const r = calcularScore({ ...base, rendaMes: 0 });
      const chaves = r.componentes.map((c) => c.chave);
      expect(chaves).not.toContain("poupanca");
      expect(chaves).not.toContain("cartao");
      expect(chaves).not.toContain("assinaturas");
      expect(chaves).toContain("reserva");
    });

    it("os pesos são redistribuídos para somar 100", () => {
      for (const entrada of [base, { ...base, rendaMes: 0 }, { ...base, orcamentos: [] }]) {
        const r = calcularScore(entrada);
        const soma = r.componentes.reduce((s, c) => s + c.peso, 0);
        expect(soma).toBeGreaterThan(99);
        expect(soma).toBeLessThan(101);
      }
    });

    it("usuário sem nenhum dado não recebe nota negativa nem quebra", () => {
      const r = calcularScore({
        rendaMes: 0,
        gastoMes: 0,
        saldoContas: 0,
        totalInvestido: 0,
        faturaTotal: 0,
        custoAssinaturas: 0,
        numDuplicatas: 0,
        orcamentos: [],
      });
      // Só "desperdício" é avaliável (sem duplicatas = perfeito).
      expect(r.componentes.map((c) => c.chave)).toEqual(["desperdicio"]);
      expect(r.score).toBe(100);
    });
  });

  it("dicas priorizam o componente que mais derruba a nota", () => {
    const r = calcularScore({
      ...base,
      gastoMes: 10000, // sobra 0% → poupança (peso 30) zerada
      custoAssinaturas: 1500, // 15% → assinaturas (peso 10) fraca
    });
    expect(r.dicas[0]).toContain("gastando menos do que entra");
  });

  it("duplicatas derrubam o componente de desperdício", () => {
    const uma = calcularScore({ ...base, numDuplicatas: 1 });
    const duas = calcularScore({ ...base, numDuplicatas: 2 });
    expect(uma.score).toBeGreaterThan(duas.score);
    expect(duas.componentes.find((c) => c.chave === "desperdicio")!.nota).toBe(0);
  });
});

describe("nivelDe", () => {
  it("classifica nas faixas", () => {
    expect(nivelDe(95)).toBe("excelente");
    expect(nivelDe(80)).toBe("excelente");
    expect(nivelDe(79)).toBe("bom");
    expect(nivelDe(60)).toBe("bom");
    expect(nivelDe(59)).toBe("atencao");
    expect(nivelDe(40)).toBe("atencao");
    expect(nivelDe(39)).toBe("critico");
    expect(nivelDe(0)).toBe("critico");
  });
});
