/**
 * Regras dos formulários de autenticação — uma fonte só para as duas pontas.
 *
 * A política de senha existia em duplicata: `validarSenha` no servidor e, do
 * lado do cliente, um `minLength={12}` com o texto da regra escondido num
 * placeholder — que some exatamente quando a pessoa começa a digitar. As duas
 * cópias já falavam idiomas diferentes: o navegador acusava em inglês
 * ("Please lengthen this text…") e o servidor respondia em português depois do
 * round-trip. Aqui a regra é escrita uma vez, e as duas pontas leem a mesma
 * frase.
 *
 * O servidor continua sendo a autoridade: as actions são alcançáveis por POST
 * direto, então validar aqui é sobre responder rápido, nunca sobre confiar.
 */

export const SENHA_MIN = 12;

/**
 * Email — checagem de propósito frouxa.
 *
 * A prova de que um endereço existe é o link de confirmação, não uma regex.
 * Barramos só o que claramente não é endereço; regex ambiciosa rejeita emails
 * válidos e estranhos, e o custo desse falso negativo é a conta não nascer.
 */
export function validarEmail(email: string): string | null {
  const valor = email.trim();
  if (!valor) return "Digite seu email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) {
    return "Digite um email completo, como nome@email.com.";
  }
  return null;
}

/**
 * Senha no login: só presença.
 *
 * A política vale para senhas NOVAS. Cobrá-la de quem já tem conta trancaria
 * do lado de fora justamente quem se cadastrou antes da regra endurecer.
 */
export function validarSenhaPreenchida(password: string): string | null {
  return password ? null : "Digite sua senha.";
}

/** Senha nova (cadastro e redefinição) — a política do produto. */
export function validarSenhaNova(password: string): string | null {
  if (!password) return "Crie uma senha.";
  if (password.length < SENHA_MIN) {
    return `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`;
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "A senha precisa misturar letras e números.";
  }
  return null;
}

export function validarNome(nome: string): string | null {
  return nome.trim() ? null : "Digite seu nome.";
}

/**
 * As mesmas condições de `validarSenhaNova`, quebradas em itens verificáveis.
 *
 * Serve para a tela mostrar o que falta ENQUANTO a pessoa digita, em vez de
 * recusar depois de enviar. Deriva de `SENHA_MIN` como a função acima, então
 * não há como a lista e a regra divergirem.
 */
export const REGRAS_SENHA = [
  {
    id: "tamanho",
    rotulo: `${SENHA_MIN} caracteres ou mais`,
    atende: (senha: string) => senha.length >= SENHA_MIN,
  },
  {
    id: "mistura",
    rotulo: "Letras e números",
    atende: (senha: string) => /[a-zA-Z]/.test(senha) && /[0-9]/.test(senha),
  },
] as const;
