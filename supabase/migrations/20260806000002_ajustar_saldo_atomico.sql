-- =============================================================================
-- Zap Finanças — Ajuste atômico de saldo (corrige race condition)
-- =============================================================================
-- PROBLEMA
--   O lançamento manual fazia read-modify-write em JS:
--
--     const { data: conta } = await supabase.from("accounts").select("saldo")…
--     const novoSaldo = (conta.saldo ?? 0) + assinado;
--     await supabase.from("accounts").update({ saldo: novoSaldo })…
--
--   Entre o SELECT e o UPDATE cabe outra escrita. Dois lançamentos concorrentes
--   (o app e o WhatsApp ao mesmo tempo, ou dois cliques) leem o MESMO saldo e o
--   segundo sobrescreve o primeiro: um dos gastos some do saldo. Em app
--   financeiro isso é corrupção silenciosa de dado.
--
-- CORREÇÃO
--   Um único UPDATE que lê e escreve na mesma instrução. O Postgres trava a
--   linha pela duração do statement, então o delta de cada chamada se acumula —
--   qualquer que seja a ordem ou a concorrência.
--
--   SECURITY INVOKER (default): a função roda com o papel de quem chama, então a
--   policy "accounts: acesso próprio" continua valendo — ninguém mexe no saldo
--   de conta alheia. NÃO usar SECURITY DEFINER aqui: bypassaria o RLS e
--   transformaria a função num vetor de escrita cross-user.
-- =============================================================================

create or replace function public.ajustar_saldo(
  p_conta_id uuid,
  p_delta    numeric
)
returns numeric
language sql
security invoker
set search_path = public
as $$
  update public.accounts
     set saldo = round(coalesce(saldo, 0) + p_delta, 2)
   where id = p_conta_id
     -- Só contas MANUAIS: em conta de Open Finance quem manda no saldo é o
     -- banco, e o próximo sync sobrescreveria qualquer ajuste nosso.
     and pluggy_account_id is null
  returning saldo;
$$;

comment on function public.ajustar_saldo(uuid, numeric) is
  'Soma p_delta ao saldo de uma conta manual, de forma atômica. Respeita RLS.';

revoke all on function public.ajustar_saldo(uuid, numeric) from public;
grant execute on function public.ajustar_saldo(uuid, numeric) to authenticated, service_role;
