"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { cadastroSchema, type CadastroForm } from "@/lib/auth-validation";

type FieldErrors = Partial<Record<keyof CadastroForm, string>>;

export default function CadastroPage() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const result = cadastroSchema.safeParse({
      nome: formData.get("nome"),
      email: formData.get("email"),
      senha: formData.get("senha"),
      confirmacaoSenha: formData.get("confirmacaoSenha"),
      tipoUsuario: formData.get("tipoUsuario"),
    });

    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CadastroForm | undefined;
        if (field && !errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    const { nome, email, senha, tipoUsuario } = result.data;

    try {
      const { error } = await authClient.signUp.email({
        name: nome,
        email,
        password: senha,
        tipoUsuario,
      });

      if (error) {
        setFormError(
          "Não foi possível criar sua conta. Confira os dados e tente novamente.",
        );
        setIsLoading(false);
        return;
      }

      router.replace("/painel?cadastro=sucesso");
      router.refresh();
    } catch {
      setFormError("Não foi possível conectar. Tente novamente em instantes.");
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/70 p-7 shadow-2xl shadow-black/30 backdrop-blur sm:p-10">
        <Link className="text-sm font-semibold tracking-wide text-lime-300" href="/">
          JOGO CERTO
        </Link>
        <h1 className="mt-7 text-3xl font-bold text-white">Crie sua conta</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Entre para organizar seus próximos jogos.
        </p>

        <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="nome">
              Nome completo
            </label>
            <input
              autoComplete="name"
              className="form-input"
              id="nome"
              maxLength={120}
              name="nome"
              required
            />
            {fieldErrors.nome && <FieldError>{fieldErrors.nome}</FieldError>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
              E-mail
            </label>
            <input
              autoComplete="email"
              className="form-input"
              id="email"
              name="email"
              required
              type="email"
            />
            {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="senha">
                Senha
              </label>
              <input
                autoComplete="new-password"
                className="form-input"
                id="senha"
                maxLength={128}
                minLength={8}
                name="senha"
                required
                type="password"
              />
              {fieldErrors.senha && <FieldError>{fieldErrors.senha}</FieldError>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="confirmacaoSenha">
                Confirme a senha
              </label>
              <input
                autoComplete="new-password"
                className="form-input"
                id="confirmacaoSenha"
                name="confirmacaoSenha"
                required
                type="password"
              />
              {fieldErrors.confirmacaoSenha && (
                <FieldError>{fieldErrors.confirmacaoSenha}</FieldError>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="tipoUsuario">
              Tipo de usuário
            </label>
            <select
              className="form-input"
              defaultValue="aluno"
              id="tipoUsuario"
              name="tipoUsuario"
              required
            >
              <option value="aluno">Estudante</option>
              <option value="professor">Professor</option>
            </select>
            {fieldErrors.tipoUsuario && (
              <FieldError>{fieldErrors.tipoUsuario}</FieldError>
            )}
          </div>

          {formError && (
            <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200" role="alert">
              {formError}
            </p>
          )}

          <button
            className="w-full rounded-xl bg-lime-300 px-5 py-3.5 font-bold text-slate-950 transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Criando conta…" : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          Já tem uma conta?{" "}
          <Link className="font-semibold text-lime-300 hover:text-lime-200" href="/login">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}

function FieldError({ children }: { children: string }) {
  return (
    <p className="mt-1.5 text-sm text-rose-300" role="alert">
      {children}
    </p>
  );
}
