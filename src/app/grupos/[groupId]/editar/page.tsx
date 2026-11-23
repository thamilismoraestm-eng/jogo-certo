import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { grupo, membroGrupo } from "@/lib/group-schema";
import { podeAdministrarGrupo } from "@/lib/group-rules";
import { EditGroupForm } from "./edit-group-form";

export default async function EditarGrupoPage({ params }: { params: Promise<{ groupId: string }> }) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) redirect("/login");
  const { groupId } = await params;
  const [associacao] = await db.select({ permissao: membroGrupo.permissao }).from(membroGrupo)
    .where(and(eq(membroGrupo.grupoId, groupId), eq(membroGrupo.usuarioId, sessao.user.id))).limit(1);
  if (!podeAdministrarGrupo(associacao?.permissao ?? null)) notFound();

  const [dadosGrupo] = await db.select({
    id: grupo.id,
    nome: grupo.nome,
    modalidade: grupo.modalidade,
    descricao: grupo.descricao,
  }).from(grupo).where(eq(grupo.id, groupId)).limit(1);
  if (!dadosGrupo) notFound();

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link className="text-sm font-bold tracking-[0.18em] text-lime-300" href={`/grupos/${groupId}`}>JOGO CERTO</Link>
        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-10">
          <p className="text-sm font-semibold tracking-[0.2em] text-lime-300 uppercase">Editar grupo</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Atualize os dados do grupo</h1>
          <EditGroupForm
            groupId={dadosGrupo.id}
            nome={dadosGrupo.nome}
            modalidade={dadosGrupo.modalidade}
            descricao={dadosGrupo.descricao ?? ""}
          />
        </section>
      </div>
    </main>
  );
}
