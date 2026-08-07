"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { signIn, signInWithGoogle, signUp } from "@/app/(auth)/actions";
import {
  validarEmail,
  validarNome,
  validarSenhaNova,
  validarSenhaPreenchida,
} from "@/lib/auth/validacao";
import {
  AuthCard,
  AuthDivider,
  AuthError,
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthSegmented,
  AuthSubmit,
  AuthSuccess,
  GOOGLE_LOGIN_HABILITADO,
  GoogleButton,
  RequisitosSenha,
  type AuthModo,
} from "./auth-shell";

/**
 * A tela de entrada do app — entrar e criar conta no mesmo cartão.
 *
 * Eram duas rotas com dois cartões quase idênticos, ligadas por um link no meio
 * de um parágrafo ("Ainda não tem conta? Criar conta"). Como os campos são
 * praticamente os mesmos, a navegação escondia que são o mesmo gesto e cobrava
 * um round-trip por um engano de um clique.
 *
 * `/login` e `/signup` continuam existindo — a landing aponta para as duas e o
 * Supabase volta para elas. Cada rota só decide qual aba abre primeiro.
 */
export function AuthTabs({ inicial }: { inicial: AuthModo }) {
  const searchParams = useSearchParams();
  const [modo, setModo] = React.useState<AuthModo>(inicial);
  // O email sobe para cá porque atravessa a troca de aba: quem digita o email,
  // descobre que não tem conta e clica em "Criar conta" não deve digitar de
  // novo. A senha não sobe — trocar de modo é recomeçar a senha.
  const [email, setEmail] = React.useState("");
  const [erro, setErro] = React.useState<string | null>(
    searchParams.get("error") === "auth_callback_failed"
      ? "Não foi possível concluir a autenticação. Tente entrar de novo."
      : null
  );
  const [cadastrou, setCadastrou] = React.useState(false);
  const [pendente, iniciar] = React.useTransition();

  function trocarModo(destino: AuthModo) {
    if (destino === modo || pendente) return;
    setModo(destino);
    setErro(null);
    // A URL acompanha a aba sem recarregar a rota — `replaceState` é integrado
    // ao router do Next. Um F5 precisa cair na aba em que a pessoa estava, e a
    // troca de modo não merece uma entrada no histórico: voltar deve sair da
    // tela de auth, não desfazer um clique de aba.
    window.history.replaceState(
      null,
      "",
      destino === "entrar" ? "/login" : "/signup"
    );
  }

  function entrar(dados: { email: string; password: string }) {
    setErro(null);
    iniciar(async () => {
      const fd = new FormData();
      fd.set("email", dados.email);
      fd.set("password", dados.password);
      const resultado = await signIn(fd);
      if (resultado?.error) setErro(resultado.error);
    });
  }

  function criar(dados: { nome: string; email: string; password: string }) {
    setErro(null);
    iniciar(async () => {
      const fd = new FormData();
      fd.set("nome", dados.nome);
      fd.set("email", dados.email);
      fd.set("password", dados.password);
      fd.set("lgpd_consent", "on");
      const resultado = await signUp(fd);
      if (resultado?.error) setErro(resultado.error);
      else if (resultado?.success) setCadastrou(true);
    });
  }

  function comGoogle() {
    setErro(null);
    iniciar(async () => {
      const resultado = await signInWithGoogle();
      if (resultado?.error) setErro(resultado.error);
    });
  }

  if (cadastrou) {
    return (
      <AuthSuccess
        titulo="Confirme seu email"
        descricao="Enviamos um link de confirmação para o seu email. Clique nele para ativar sua conta e começar o trial de 14 dias."
      >
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-emerald hover:underline"
        >
          Voltar para o login
        </Link>
      </AuthSuccess>
    );
  }

  return (
    <AuthCard>
      {/* O par de abas é o título visível da tela. O `h1` existe para quem
          navega por cabeçalhos e nunca vê o controle. */}
      <h1 className="sr-only">Entrar ou criar conta no Zap Finanças</h1>

      <AuthSegmented
        modo={modo}
        onModoChange={trocarModo}
        desabilitado={pendente}
      />

      {erro && <AuthError>{erro}</AuthError>}

      {/* `key` remonta o painel: reinicia os campos do outro modo e reproduz a
          entrada. O email é preservado porque mora no componente de cima. */}
      <div
        key={modo}
        id={`painel-${modo}`}
        role="tabpanel"
        aria-labelledby={`aba-${modo}`}
        className="cz-swap mt-6"
      >
        {modo === "entrar" ? (
          <FormEntrar
            pendente={pendente}
            email={email}
            onEmailChange={setEmail}
            onEnviar={entrar}
          />
        ) : (
          <FormCriar
            pendente={pendente}
            email={email}
            onEmailChange={setEmail}
            onEnviar={criar}
          />
        )}
      </div>

      {GOOGLE_LOGIN_HABILITADO && (
        <>
          <AuthDivider />
          <GoogleButton onClick={comGoogle} disabled={pendente} />
        </>
      )}
    </AuthCard>
  );
}

/**
 * Leva o foco para o primeiro campo que barrou o envio.
 *
 * Sem isso, num formulário de quatro campos o erro pode estar acima da dobra do
 * teclado no celular: a tela "não faz nada" ao tocar em enviar.
 */
function focarPrimeiroErro(
  ordem: readonly string[],
  erros: Record<string, string | undefined>
): boolean {
  const campo = ordem.find((nome) => erros[nome]);
  if (!campo) return false;
  document.getElementById(campo)?.focus();
  return true;
}

type ErrosLogin = Partial<Record<"email" | "password", string>>;

function FormEntrar({
  pendente,
  email,
  onEmailChange,
  onEnviar,
}: {
  pendente: boolean;
  email: string;
  onEmailChange: (valor: string) => void;
  onEnviar: (dados: { email: string; password: string }) => void;
}) {
  const [password, setPassword] = React.useState("");
  const [erros, setErros] = React.useState<ErrosLogin>({});
  // A correção ao vivo só liga depois da primeira tentativa. Acusar "email
  // incompleto" na terceira letra do endereço é ruído, não ajuda.
  const [tentou, setTentou] = React.useState(false);

  function mudarEmail(valor: string) {
    onEmailChange(valor);
    if (tentou) {
      setErros((e) => ({ ...e, email: validarEmail(valor) ?? undefined }));
    }
  }

  function mudarSenha(valor: string) {
    setPassword(valor);
    if (tentou) {
      setErros((e) => ({
        ...e,
        password: validarSenhaPreenchida(valor) ?? undefined,
      }));
    }
  }

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTentou(true);
    const achados: ErrosLogin = {
      email: validarEmail(email) ?? undefined,
      password: validarSenhaPreenchida(password) ?? undefined,
    };
    setErros(achados);
    if (focarPrimeiroErro(["email", "password"], achados)) return;
    onEnviar({ email: email.trim(), password });
  }

  return (
    // `noValidate` desliga o balão do navegador: ele fala em inglês, some
    // sozinho, aponta um campo por vez e não é lido por leitor de tela. As
    // mensagens abaixo ficam na tela até o campo ser corrigido.
    <form onSubmit={enviar} noValidate className="space-y-4">
      <AuthField id="email" label="Email" erro={erros.email}>
        <AuthInput
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => mudarEmail(e.target.value)}
          aria-invalid={Boolean(erros.email)}
          aria-describedby={erros.email ? "email-erro" : undefined}
          disabled={pendente}
        />
      </AuthField>

      <AuthField
        id="password"
        label="Senha"
        erro={erros.password}
        acao={
          <Link
            href="/forgot-password"
            className="text-xs text-slate hover:text-ink"
          >
            Esqueci a senha
          </Link>
        }
      >
        <AuthPasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => mudarSenha(e.target.value)}
          aria-invalid={Boolean(erros.password)}
          aria-describedby={erros.password ? "password-erro" : undefined}
          disabled={pendente}
        />
      </AuthField>

      <AuthSubmit pending={pendente} pendingLabel="Entrando…" className="mt-6">
        Entrar
      </AuthSubmit>
    </form>
  );
}

type ErrosCadastro = Partial<
  Record<"nome" | "email" | "password" | "lgpd_consent", string>
>;

const ERRO_LGPD = "Aceite a Política de Privacidade para continuar.";

function FormCriar({
  pendente,
  email,
  onEmailChange,
  onEnviar,
}: {
  pendente: boolean;
  email: string;
  onEmailChange: (valor: string) => void;
  onEnviar: (dados: { nome: string; email: string; password: string }) => void;
}) {
  const [nome, setNome] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [aceitou, setAceitou] = React.useState(false);
  const [erros, setErros] = React.useState<ErrosCadastro>({});
  const [tentou, setTentou] = React.useState(false);

  function corrigir(campo: keyof ErrosCadastro, mensagem: string | null) {
    if (!tentou) return;
    setErros((e) => ({ ...e, [campo]: mensagem ?? undefined }));
  }

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTentou(true);
    const achados: ErrosCadastro = {
      nome: validarNome(nome) ?? undefined,
      email: validarEmail(email) ?? undefined,
      password: validarSenhaNova(password) ?? undefined,
      lgpd_consent: aceitou ? undefined : ERRO_LGPD,
    };
    setErros(achados);
    if (
      focarPrimeiroErro(["nome", "email", "password", "lgpd_consent"], achados)
    ) {
      return;
    }
    onEnviar({ nome: nome.trim(), email: email.trim(), password });
  }

  // Com a senha em branco não há o que conferir item a item — aí vale a frase
  // curta. A partir da primeira tecla, a lista de requisitos assume: ela diz o
  // que falta enquanto dá para consertar, em vez de acusar depois do envio.
  const senhaEmBranco = password.length === 0;

  return (
    <>
      <p className="text-sm text-slate">14 dias grátis, sem cartão.</p>

      <form onSubmit={enviar} noValidate className="mt-5 space-y-4">
        <AuthField id="nome" label="Nome" erro={erros.nome}>
          <AuthInput
            id="nome"
            name="nome"
            type="text"
            autoComplete="name"
            placeholder="Como podemos te chamar"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              corrigir("nome", validarNome(e.target.value));
            }}
            aria-invalid={Boolean(erros.nome)}
            aria-describedby={erros.nome ? "nome-erro" : undefined}
            disabled={pendente}
          />
        </AuthField>

        <AuthField id="email" label="Email" erro={erros.email}>
          <AuthInput
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => {
              onEmailChange(e.target.value);
              corrigir("email", validarEmail(e.target.value));
            }}
            aria-invalid={Boolean(erros.email)}
            aria-describedby={erros.email ? "email-erro" : undefined}
            disabled={pendente}
          />
        </AuthField>

        <AuthField
          id="password"
          label="Senha"
          erro={senhaEmBranco ? erros.password : undefined}
          descricao={
            !senhaEmBranco && (
              <RequisitosSenha
                id="password-requisitos"
                senha={password}
                cobrando={tentou}
              />
            )
          }
        >
          <AuthPasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              corrigir("password", validarSenhaNova(e.target.value));
            }}
            aria-invalid={Boolean(erros.password)}
            aria-describedby={
              senhaEmBranco
                ? erros.password
                  ? "password-erro"
                  : undefined
                : "password-requisitos"
            }
            disabled={pendente}
          />
        </AuthField>

        <div>
          {/* O <Link> dentro do <label> não dispara o checkbox: o HTML manda o
              navegador ignorar a ativação do rótulo quando o clique cai em
              conteúdo interativo. */}
          <label className="flex items-start gap-2.5 text-xs leading-relaxed text-slate">
            <input
              id="lgpd_consent"
              type="checkbox"
              name="lgpd_consent"
              checked={aceitou}
              onChange={(e) => {
                setAceitou(e.target.checked);
                corrigir("lgpd_consent", e.target.checked ? null : ERRO_LGPD);
              }}
              aria-invalid={Boolean(erros.lgpd_consent)}
              aria-describedby={
                erros.lgpd_consent ? "lgpd_consent-erro" : undefined
              }
              disabled={pendente}
              className="mt-0.5 size-4 shrink-0 rounded border-line text-emerald focus:ring-emerald/30 aria-invalid:border-danger"
            />
            <span>
              Li e aceito a{" "}
              <Link href="/privacidade" className="text-emerald hover:underline">
                Política de Privacidade
              </Link>{" "}
              e autorizo o tratamento dos meus dados conforme a LGPD.
            </span>
          </label>
          {erros.lgpd_consent && (
            <p
              id="lgpd_consent-erro"
              role="alert"
              className="mt-1.5 text-sm text-danger"
            >
              {erros.lgpd_consent}
            </p>
          )}
        </div>

        <AuthSubmit
          pending={pendente}
          pendingLabel="Criando conta…"
          className="mt-6"
        >
          Criar conta grátis
        </AuthSubmit>
      </form>
    </>
  );
}

