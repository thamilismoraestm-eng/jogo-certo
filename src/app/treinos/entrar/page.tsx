import Link from "next/link";
import { InviteTrainingForm } from "@/app/treinos/entrar/invite-training-form";

export default function EntrarEmEventoPage() {
  return (
    <main className="min-h-screen px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-xl">
        <header className="flex items-center justify-between gap-4">
          <Link className="text-sm font-bold tracking-[0.18em] text-lime-300" href="/painel">JOGO CERTO</Link>
          <Link className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200" href="/painel">Voltar ao painel</Link>
        </header>
        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-10">
          <p className="text-sm font-semibold tracking-[0.2em] text-lime-300 uppercase">Convite individual</p>
          <h1 className="mt-3 text-3xl font-bold text-white">Entrar em um evento</h1>
          <p className="mt-3 leading-7 text-slate-300">Cole o código ou o link que o criador compartilhou. Para responder presença, entre na sua conta.</p>
          <InviteTrainingForm />
        </section>
      </div>
    </main>
  );
}
