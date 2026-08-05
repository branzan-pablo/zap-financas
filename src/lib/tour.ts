/**
 * Tour de onboarding — definição dos passos e filtragem. PURO e testável.
 *
 * Os passos são DECLARATIVOS: cada um aponta para um `alvo` (um
 * `[data-tour="..."]` no DOM) ou não tem alvo, virando um cartão centralizado.
 *
 * Por que filtrar em runtime: a dashboard de quem acabou de se cadastrar é uma
 * tela diferente (early return para "conecte seu banco"), então herói, score e
 * resumo simplesmente não existem ainda. E no mobile não há sidebar. Em vez de
 * manter duas listas de passos que divergem com o tempo, mantemos UMA lista e
 * descartamos os passos cujo alvo não está visível — o mesmo tour serve os dois
 * estados e os dois tamanhos de tela.
 */

export type LadoBalao = "top" | "bottom" | "left" | "right";

export type PassoTour = {
  id: string;
  titulo: string;
  descricao: string;
  /** Seletor lógico: casa com [data-tour="<alvo>"]. Ausente = passo centralizado. */
  alvo?: string;
  icone: string;
  /** Lado preferido do balão; a detecção de colisão pode mudar. */
  lado?: LadoBalao;
  /** Link opcional no rodapé do passo. */
  link?: { href: string; texto: string };
};

export const PASSOS: PassoTour[] = [
  {
    id: "boas-vindas",
    icone: "👋",
    titulo: "Bem-vindo ao Zap Finanças",
    descricao:
      "Em um minuto eu mostro onde fica cada coisa. Você pode pular quando quiser e refazer depois em Configurações.",
  },
  {
    id: "nav",
    alvo: "nav",
    icone: "🧭",
    lado: "right",
    titulo: "Por onde andar",
    descricao:
      "Contas, transações, cartões, orçamentos e investimentos ficam aqui. É o mesmo menu no computador e no celular.",
  },
  {
    id: "posso-gastar",
    alvo: "posso-gastar",
    icone: "💸",
    lado: "bottom",
    titulo: "O número que importa",
    descricao:
      "Quanto ainda dá para gastar este mês sem apertar o orçamento. Ele desconta o que já saiu e o que ainda vai sair, como assinaturas.",
  },
  {
    id: "score",
    alvo: "score",
    icone: "💚",
    lado: "bottom",
    titulo: "Sua saúde financeira",
    descricao:
      "Uma nota de 0 a 100 com o que pesa a favor e contra. Logo abaixo dela aparece o que fazer para melhorar.",
  },
  {
    id: "alertas",
    alvo: "alertas",
    icone: "🔔",
    lado: "bottom",
    titulo: "Aviso antes do problema",
    descricao:
      "Limite estourando, fatura prestes a fechar e cobrança duplicada aparecem aqui — e também chegam no seu WhatsApp.",
  },
  {
    id: "resumo",
    alvo: "resumo",
    icone: "📊",
    lado: "top",
    titulo: "O mês em quatro números",
    descricao:
      "Saldo em contas, fatura aberta, investimentos e quanto já saiu no mês.",
  },
  {
    id: "conectar",
    alvo: "conectar",
    icone: "🏦",
    lado: "bottom",
    titulo: "Comece conectando um banco",
    descricao:
      "Pelo Open Finance, em modo somente leitura — você autoriza no app do seu banco e revoga quando quiser. É o que liga saldo, fatura e categorização automática.",
  },
  {
    id: "whatsapp",
    icone: "💬",
    titulo: "E o principal: o WhatsApp",
    descricao:
      "Mande “gastei 50 no mercado”, um áudio com vários gastos ou a foto da nota fiscal — eu registro e categorizo. Pergunte “saldo” ou “como estou?” a qualquer hora.",
    link: { href: "/configuracoes/whatsapp", texto: "Vincular meu número" },
  },
];

/**
 * Mantém os passos centralizados (sem alvo) e, entre os ancorados, apenas os que
 * têm alvo presente na tela. `existe` é injetado para manter a função pura.
 */
export function filtrarPassos(
  passos: PassoTour[],
  existe: (alvo: string) => boolean
): PassoTour[] {
  return passos.filter((p) => !p.alvo || existe(p.alvo));
}
