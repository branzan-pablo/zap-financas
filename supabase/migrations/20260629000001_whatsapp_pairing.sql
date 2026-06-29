-- =============================================================================
-- Zap Finanças — Pareamento de WhatsApp (Fase 3)
-- =============================================================================
-- Fluxo: usuário gera um código no app (sem informar o número) → envia o código
-- pelo WhatsApp → o webhook descobre o número e ativa o vínculo.
--
-- Por isso `telefone` precisa aceitar NULL enquanto o pareamento está pendente
-- (só é preenchido quando o código chega pelo WhatsApp).
-- =============================================================================

alter table public.whatsapp_links
  alter column telefone drop not null;

-- Busca rápida por código durante o pareamento.
create index if not exists whatsapp_links_codigo_idx
  on public.whatsapp_links (codigo_pareamento)
  where codigo_pareamento is not null;
