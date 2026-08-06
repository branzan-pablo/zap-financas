#!/usr/bin/env node
/**
 * Verifica o template do manifest do `x-signature` do Mercado Pago.
 *
 * POR QUE ESTE SCRIPT EXISTE
 *   `assinaturaValida()` em src/lib/payments/mercadopago-provider.ts monta o
 *   manifest assim:
 *
 *     id:{data.id};request-id:{x-request-id};ts:{ts};
 *
 *   Esse formato veio da documentação, nunca de uma notificação real. Se estiver
 *   errado por um caractere, o HMAC não bate, o webhook devolve 401 em TODA
 *   notificação, e o resultado é o pior tipo de falha: o cliente paga, o Mercado
 *   Pago registra a cobrança, e o acesso nunca é liberado. Sem erro visível
 *   além de um warning no log.
 *
 *   Rodar este script com uma notificação real de sandbox transforma "achamos
 *   que está certo" em "conferimos". Ele testa o template atual e, se falhar,
 *   varre variações conhecidas para dizer QUAL é o certo.
 *
 * COMO USAR
 *   1. No painel do MP (modo teste) → Webhooks → "Simular notificação".
 *   2. Capture a requisição que chegou (log da Vercel, ngrok, ou webhook.site):
 *      precisa da URL completa e dos headers `x-signature` e `x-request-id`.
 *   3. Rode:
 *
 *      node scripts/verificar-assinatura-mp.mjs \
 *        --url "https://seu-app/api/webhooks/mercadopago?data.id=123456&type=payment" \
 *        --signature "ts=1704908010,v1=abc123..." \
 *        --request-id "e8a1...-..." \
 *        --secret "SEU_MERCADOPAGO_WEBHOOK_SECRET"
 *
 *   O segredo pode vir de MERCADOPAGO_WEBHOOK_SECRET no ambiente, em vez da flag.
 */

import { createHmac } from "node:crypto";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const chave = argv[i].slice(2);
    const valor = argv[i + 1];
    if (valor === undefined || valor.startsWith("--")) {
      args[chave] = true;
    } else {
      args[chave] = valor;
      i += 1;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const secret = args.secret ?? process.env.MERCADOPAGO_WEBHOOK_SECRET;
const url = args.url;
const signature = args.signature;
const requestId = args["request-id"] ?? "";

if (!secret || !url || !signature) {
  console.error(
    "Faltam argumentos.\n\n" +
      "  --url         URL completa que o MP chamou (com ?data.id=...)\n" +
      "  --signature   header x-signature (ex.: \"ts=...,v1=...\")\n" +
      "  --request-id  header x-request-id (opcional, mas quase sempre presente)\n" +
      "  --secret      segredo do webhook (ou env MERCADOPAGO_WEBHOOK_SECRET)\n"
  );
  process.exit(2);
}

// Mesmo parsing do provider: "ts=...,v1=..." → { ts, v1 }
const partes = Object.fromEntries(
  signature.split(",").map((kv) => {
    const [k, v] = kv.split("=");
    return [k?.trim(), v?.trim()];
  })
);
const ts = partes.ts;
const v1 = partes.v1;

if (!ts || !v1) {
  console.error(`x-signature sem ts ou v1: "${signature}"`);
  process.exit(2);
}

const dataIdBruto = new URL(url).searchParams.get("data.id") ?? "";
const hmac = (manifest) =>
  createHmac("sha256", secret).update(manifest).digest("hex");

/**
 * Variações plausíveis do manifest. A primeira é a que o código usa hoje; as
 * demais são as divergências que a documentação do MP já teve entre versões
 * (id sem lowercase, ausência do request-id, ausência do ponto-e-vírgula final).
 */
const candidatos = [
  {
    nome: "ATUAL (implementado no provider)",
    manifest: `id:${dataIdBruto.toLowerCase()};request-id:${requestId};ts:${ts};`,
  },
  {
    nome: "data.id sem lowercase",
    manifest: `id:${dataIdBruto};request-id:${requestId};ts:${ts};`,
  },
  {
    nome: "sem request-id",
    manifest: `id:${dataIdBruto.toLowerCase()};ts:${ts};`,
  },
  {
    nome: "sem ponto-e-vírgula final",
    manifest: `id:${dataIdBruto.toLowerCase()};request-id:${requestId};ts:${ts}`,
  },
  {
    nome: "ordem alternativa (ts antes de request-id)",
    manifest: `id:${dataIdBruto.toLowerCase()};ts:${ts};request-id:${requestId};`,
  },
];

console.log(`\ndata.id  : ${dataIdBruto || "(ausente!)"}`);
console.log(`ts       : ${ts}`);
console.log(`x-req-id : ${requestId || "(ausente)"}`);
console.log(`v1 (MP)  : ${v1}\n`);

let acertou = null;
for (const c of candidatos) {
  const calculado = hmac(c.manifest);
  const bate = calculado === v1;
  if (bate && !acertou) acertou = c;
  console.log(`${bate ? "✅" : "❌"} ${c.nome}`);
  console.log(`   manifest: ${JSON.stringify(c.manifest)}`);
  if (!bate) console.log(`   calculado: ${calculado}`);
  console.log("");
}

if (acertou?.nome.startsWith("ATUAL")) {
  console.log("→ O template implementado está CORRETO. B5 (parte 1) validado.\n");
  process.exit(0);
}
if (acertou) {
  console.log(
    `→ O template implementado está ERRADO. O que bate é: "${acertou.nome}".\n` +
      `  Ajuste o manifest em src/lib/payments/mercadopago-provider.ts\n` +
      `  (método assinaturaValida) para essa forma e rode de novo.\n`
  );
  process.exit(1);
}
console.log(
  "→ NENHUM candidato bateu. Possíveis causas:\n" +
    "  • o segredo não é o mesmo do painel que emitiu a notificação\n" +
    "    (o de teste e o de produção são DIFERENTES);\n" +
    "  • a URL passada não é exatamente a que o MP chamou (data.id divergente);\n" +
    "  • o MP mudou o formato — capture o manifest da doc atual e adicione aqui.\n"
);
process.exit(1);
