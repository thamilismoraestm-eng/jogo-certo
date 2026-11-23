import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { treino } from "@/lib/training-schema";
import { podeEditarTreino } from "@/lib/training-rules";
import { TrainingForm } from "@/app/treinos/training-form";

export default async function EditarTreinoPage({ params }: { params: Promise<{ treinoId: string }> }) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) redirect("/login");
  const { treinoId } = await params;
  const [evento] = await db.select().from(treino).where(eq(treino.id, treinoId)).limit(1);
  if (!evento) notFound();
  if (!podeEditarTreino({
    usuarioId: sessao.user.id,
    criadorId: evento.criadorId,
    status: evento.status,
    data: evento.data,
    horario: evento.horario.slice(0, 5),
  })) redirect(`/treinos/${evento.id}`);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link className="text-sm font-bold tracking-[0.18em] text-lime-300" href={`/treinos/${evento.id}`}>JOGO CERTO</Link>
        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-10">
          <p className="text-sm font-semibold tracking-[0.2em] text-lime-300 uppercase">Editar evento</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Atualize os detalhes</h1>
          <TrainingForm treino={evento} />
        </section>
      </div>
    </main>
  );
}
