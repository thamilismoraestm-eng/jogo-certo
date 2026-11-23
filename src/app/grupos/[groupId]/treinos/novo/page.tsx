import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { grupo, membroGrupo } from "@/lib/group-schema";
import { TrainingForm } from "@/app/treinos/training-form";

export default async function NovoTreinoDoGrupoPage({ params }: { params: Promise<{ groupId: string }> }) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) redirect("/login");
  const { groupId } = await params;
  const [membro] = await db.select({ id: membroGrupo.id }).from(membroGrupo)
    .where(and(eq(membroGrupo.grupoId, groupId), eq(membroGrupo.usuarioId, sessao.user.id))).limit(1);
  if (!membro) notFound();
  const [grupoAtual] = await db.select({ id: grupo.id, nome: grupo.nome }).from(grupo).where(eq(grupo.id, groupId)).limit(1);
  if (!grupoAtual) notFound();

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link className="text-sm font-bold tracking-[0.18em] text-lime-300" href={`/grupos/${groupId}`}>JOGO CERTO</Link>
        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-10">
          <p className="text-sm font-semibold tracking-[0.2em] text-lime-300 uppercase">Evento do grupo</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{grupoAtual.nome}</h1>
          <p className="mt-3 text-slate-300">O evento ficará disponível para integrantes do grupo.</p>
          <TrainingForm grupoId={groupId} />
        </section>
      </div>
    </main>
  );
}
