/**
 * Tradução das mensagens do Supabase Auth.
 *
 * O Supabase responde em inglês. O app é inteiro em português e fala de dinheiro
 * — "Invalid login credentials" na tela de entrada de um app financeiro parece
 * erro de sistema, não senha errada, e a pessoa tenta de novo em vez de ir
 * recuperar a senha.
 *
 * Traduzimos os casos que o usuário de fato encontra e deixamos o resto passar
 * direto: uma frase estranha em inglês diz mais do que um "algo deu errado"
 * genérico que esconde o que aconteceu.
 */
const TRADUCOES: Record<string, string> = {
  "Invalid login credentials": "Email ou senha não conferem.",
  "Email not confirmed":
    "Confirme seu email pelo link que enviamos antes de entrar.",
  "User already registered":
    "Esse email já tem conta. Use a aba Entrar para acessar.",
  "Email address is invalid": "Esse email não foi aceito. Confira o endereço.",
  "Signup requires a valid password": "Crie uma senha para continuar.",
  "Email rate limit exceeded":
    "Muitas tentativas seguidas. Espere um minuto e tente de novo.",
  "For security purposes, you can only request this after 60 seconds.":
    "Espere um minuto antes de pedir de novo.",
  "New password should be different from the old password.":
    "A nova senha precisa ser diferente da anterior.",
};

export function traduzirErroAuth(mensagem: string): string {
  return TRADUCOES[mensagem] ?? mensagem;
}
