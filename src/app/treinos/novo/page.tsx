import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TrainingForm } from "@/app/treinos/training-form";

export default async function NovoTreinoPage() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) redirect("/login");
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link className="text-sm font-bold tracking-[0.18em] text-lime-300" href="/painel">JOGO CERTO</Link>
        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-10">
          <p className="text-sm font-semibold tracking-[0.2em] text-lime-300 uppercase">Novo evento</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Crie um treino ou partida</h1>
          <p className="mt-3 text-slate-300">Este evento será independente de um grupo.</p>
          <TrainingForm />
        </section>
      </div>
    </main>
  );
}
