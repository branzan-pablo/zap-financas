# Ativar a pré-venda real — passo a passo (Kiwify)

Objetivo: o botão "Quero ser fundador" passar a **cobrar de verdade** (Pix + cartão parcelado), com página de obrigado e garantia.

> Por que Kiwify: feita pra produto digital, já tem Pix, cartão em 12x, garantia e programa de afiliados nativo (útil depois, como o Dinzo faz). Alternativa mais simples: link de pagamento do Mercado Pago.

## Passos

1. **Criar conta** em kiwify.com.br. Vai pedir CPF/CNPJ e dados bancários (é por onde você recebe). Sem isso não dá pra receber dinheiro de ninguém.

2. **Criar o produto:**
   - Tipo: **Produto digital** (acesso), não assinatura recorrente. Pré-venda de algo que ainda não existe funciona melhor como compra única do "acesso de fundador".
   - Nome: **CartãoZap — Acesso Fundador (1 ano)**
   - Preço: **R$ 149,90** (o plano anual em destaque na landing)

3. **Pagamento:** ative **Pix** e **Cartão de crédito** com **parcelamento até 12x**.

4. **Pós-compra (redirecionamento):** aponte a página de obrigado / URL de redirecionamento para:
   `https://cartao-zap.vercel.app/obrigado`

5. **Garantia:** ative **7 dias** (gera confiança e é o que a landing promete).

6. **Pegar o link do checkout** do produto (a URL pública de compra).

7. **Me mandar o link.** Eu seto `NEXT_PUBLIC_FOUNDER_CHECKOUT_URL` na Vercel e faço o redeploy. A partir daí o botão captura o email e leva direto pro pagamento.

## Avisos honestos
- Kiwify cobra uma taxa por venda (em torno de ~9% + taxa fixa). Mercado Pago tende a ser mais barato no Pix, mas com UX de checkout inferior.
- O dinheiro cai depois de um prazo de liberação (alguns dias), não na hora.
- Comece só com o plano **Anual** (1 link). Mensal e Trimestral viram links separados depois, se a validação pedir.
- Pré-venda cria obrigação de entregar (ou reembolsar). Só ative se está comprometido a construir o MVP caso venda.
