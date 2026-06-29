import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade — Zap Finanças",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-svh bg-paper px-4 py-12">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-slate hover:text-ink">
          ← Início
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-slate">
          Como o Zap Finanças trata seus dados, em conformidade com a LGPD (Lei
          13.709/2018).
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink/90">
          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              1. Dados que coletamos
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate">
              <li>Cadastro: nome, email e telefone (para o WhatsApp).</li>
              <li>
                Financeiros via Open Finance: contas, saldos, transações,
                cartões, faturas e investimentos — sempre com seu consentimento e
                em modo de leitura.
              </li>
              <li>Mensagens trocadas com o assistente no WhatsApp.</li>
              <li>Dados de pagamento processados pelo provedor (não armazenamos cartão).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              2. Para que usamos
            </h2>
            <p className="mt-2 text-slate">
              Para prestar o serviço: consolidar suas finanças, categorizar
              transações, projetar faturas, gerar alertas e responder no
              WhatsApp. Não vendemos seus dados.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              3. Com quem compartilhamos
            </h2>
            <p className="mt-2 text-slate">
              Apenas com operadores necessários ao funcionamento, sob contrato:
              Open Finance (Pluggy), pagamentos (Mercado Pago), infraestrutura
              (Supabase/Vercel) e IA para categorização e respostas. Cada um
              trata os dados estritamente para a finalidade contratada.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              4. Seus direitos
            </h2>
            <p className="mt-2 text-slate">
              Você pode, a qualquer momento, em{" "}
              <span className="font-medium text-ink">Configurações</span>:
              exportar todos os seus dados e excluir sua conta (apagando os dados
              permanentemente). Também pode revogar consentimentos de conexões
              bancárias.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              5. Segurança
            </h2>
            <p className="mt-2 text-slate">
              Dados isolados por usuário (RLS), acesso por sessão autenticada,
              segredos protegidos no servidor e cálculos financeiros no backend.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">6. Contato</h2>
            <p className="mt-2 text-slate">
              Dúvidas sobre privacidade ou para exercer seus direitos, fale com
              nosso encarregado (DPO) pelo email de suporte.
            </p>
          </section>

          <p className="border-t border-line pt-6 text-xs text-slate">
            Documento informativo, sujeito a revisão jurídica antes do lançamento
            público. Última atualização: junho de 2026.
          </p>
        </div>
      </article>
    </div>
  );
}
