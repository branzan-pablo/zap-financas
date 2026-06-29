-- =============================================================================
-- Zap Finanças — Seed de categorias globais (Fase 1)
-- =============================================================================
-- Categorias com user_id = NULL são GLOBAIS: visíveis a todos os usuários
-- (a RLS de categories já permite "ver globais e próprias").
--
-- `regras` é um array JSON de palavras-chave normalizadas (minúsculas, sem
-- acento) usado pelo matcher determinístico em src/lib/categorization/rules.ts.
-- A ordem do array de inserção define a PRIORIDADE de match (primeiro vence),
-- então categorias mais específicas (Mercado, Assinaturas) vêm antes das
-- genéricas (Compras).
--
-- Idempotente: nomes globais são únicos por convenção; reaplicar não duplica.
-- =============================================================================

insert into public.categories (user_id, nome, icone, cor, tipo, regras)
values
  (null, 'Salário',        '💰', '#16a34a', 'receita',
     '["salario","pagamento salario","provento","holerite"]'::jsonb),
  (null, 'Rendimentos',    '📈', '#0d9488', 'receita',
     '["rendimento","dividendo","juros","cashback","resgate"]'::jsonb),
  (null, 'Mercado',        '🛒', '#ca8a04', 'despesa',
     '["supermercado","pao de acucar","carrefour","atacad","mercado livre nao","hortifruti","assai"]'::jsonb),
  (null, 'Alimentação',    '🍽️', '#ea580c', 'despesa',
     '["ifood","restaurante","padaria","lanchonete","bar ","hamburgueria","pizzaria","cafe"]'::jsonb),
  (null, 'Transporte',     '🚗', '#2563eb', 'despesa',
     '["uber","99 ","99pop","99 *pop","posto","shell","ipiranga","petrobras","combustivel","estacionamento","metro"]'::jsonb),
  (null, 'Saúde',          '💊', '#dc2626', 'despesa',
     '["drogasil","farmacia","drogaria","droga ","hospital","laboratorio","consulta","dentista"]'::jsonb),
  (null, 'Assinaturas',    '🔁', '#7c3aed', 'despesa',
     '["netflix","spotify","amazon prime","prime video","disney","hbo","max ","youtube premium","apple.com"]'::jsonb),
  (null, 'Lazer',          '🎬', '#db2777', 'despesa',
     '["cinema","cinemark","teatro","show","ingresso","steam","playstation","xbox"]'::jsonb),
  (null, 'Casa & Contas',  '🏠', '#0891b2', 'despesa',
     '["energia","enel","luz ","agua ","sabesp","internet","vivo","claro","tim ","oi ","aluguel","condominio","gas "]'::jsonb),
  (null, 'Educação',       '📚', '#4f46e5', 'despesa',
     '["curso","faculdade","escola","udemy","alura","livraria","ensino"]'::jsonb),
  (null, 'Compras',        '🛍️', '#9333ea', 'despesa',
     '["amazon","mercado livre","magazine","magalu","zara","centauro","fast shop","americanas","shopping","renner","riachuelo"]'::jsonb),
  (null, 'Transferências', '↔️', '#64748b', 'transferencia',
     '["transferencia","ted ","doc ","pix enviado","pix para"]'::jsonb),
  (null, 'Investimentos',  '🏦', '#059669', 'despesa',
     '["cdb","tesouro","fundo ","aplicacao","corretora","xp investimentos","previdencia"]'::jsonb),
  (null, 'Outros',         '📌', '#94a3b8', 'despesa',
     '[]'::jsonb)
on conflict do nothing;
