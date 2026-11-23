"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { loginSchema, type LoginForm as LoginFields } from "@/lib/auth-validation";

export default function LoginForm({ didSignOut, returnTo }: { didSignOut: boolean; returnTo?: string }) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFields, string>>>({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const result = loginSchema.safeParse({
      email: formData.get("email"),
      senha: formData.get("senha"),
    });

    if (!result.success) {
      const errors: Partial<Record<keyof LoginFields, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginFields | undefined;
        if (field && !errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: result.data.email,
        password: result.data.senha,
      });

      if (error) {
        // A mensagem é genérica para não revelar se o e-mail existe.
        setFormError("E-mail ou senha incorretos.");
        setIsLoading(false);
        return;
      }

      const destinoSeguro = returnTo?.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : "/painel";
      router.replace(destinoSeguro);
      router.refresh();
    } catch {
      setFormError("Não foi possível conectar. Tente novamente em instantes.");
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/70 p-7 shadow-2xl shadow-black/30 backdrop-blur sm:p-10">
        <Link className="text-sm font-semibold tracking-wide text-lime-300" href="/">
          JOGO CERTO
        </Link>
        <h1 className="mt-7 text-3xl font-bold text-white">Que bom ver você</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Entre para continuar organizando seus jogos.
        </p>

        {didSignOut && (
          <p className="mt-6 rounded-xl border border-lime-300/20 bg-lime-300/10 px-4 py-3 text-sm text-lime-200" role="status">
            Você saiu da sua conta.
          </p>
        )}

        <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
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

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="senha">
              Senha
            </label>
            <div className="relative">
              <input
                autoComplete="current-password"
                className="form-input pr-20"
                id="senha"
                name="senha"
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-3 my-auto h-10 px-2 text-sm font-medium text-lime-300 hover:text-lime-200"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {fieldErrors.senha && <FieldError>{fieldErrors.senha}</FieldError>}
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
            {isLoading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          Ainda não tem conta?{" "}
          <Link className="font-semibold text-lime-300 hover:text-lime-200" href="/cadastro">
            Cadastre-se
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
