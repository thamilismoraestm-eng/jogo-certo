import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { alias } from "drizzle-orm/pg-core";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { grupo, membroGrupo } from "@/lib/group-schema";
import { user } from "@/lib/auth-schema";
import { nomearAdministradorAction, removerMembroAction } from "@/lib/group-actions";
import { treino } from "@/lib/training-schema";
import { DeleteGroupButton } from "@/app/grupos/delete-group-button";
import { podeExcluirGrupo } from "@/lib/group-rules";
import { separarTreinosPorStatus } from "@/lib/training-rules";

export default async function GrupoDetalhesPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ erro?: string; removido?: string; administrador?: string }>;
}) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) redirect("/login");
  const { groupId } = await params;
  const [associacaoAtual] = await db.select({ permissao: membroGrupo.permissao }).from(membroGrupo)
    .where(and(eq(membroGrupo.grupoId, groupId), eq(membroGrupo.usuarioId, sessao.user.id))).limit(1);
  if (!associacaoAtual) notFound();

  const criador = alias(user, "criador");
  const [dadosGrupo] = await db.select({
    id: grupo.id,
    nome: grupo.nome,
    modalidade: grupo.modalidade,
    descricao: grupo.descricao,
    codigoConvite: grupo.codigoConvite,
    criadorId: grupo.criadorId,
    nomeCriador: criador.name,
  }).from(grupo).innerJoin(criador, eq(grupo.criadorId, criador.id)).where(eq(grupo.id, groupId)).limit(1);
  if (!dadosGrupo) notFound();

  const participante = alias(user, "participante");
  const membros = await db.select({
    id: participante.id,
    nome: participante.name,
    permissao: membroGrupo.permissao,
  }).from(membroGrupo).innerJoin(participante, eq(membroGrupo.usuarioId, participante.id))
    .where(eq(membroGrupo.grupoId, groupId)).orderBy(participante.name);
  const eventos = await db.select({
    id: treino.id,
    titulo: treino.titulo,
    modalidade: treino.modalidade,
    local: treino.local,
    data: treino.data,
    horario: treino.horario,
    status: treino.status,
  }).from(treino).where(eq(treino.grupoId, groupId))
    .orderBy(asc(treino.data), asc(treino.horario));
  const { erro, removido, administrador: administradorNomeado } = await searchParams;
  const { ativos: treinosAtivos, cancelados: treinosCancelados } = separarTreinosPorStatus(eventos);
  const administrador = associacaoAtual.permissao === "admin";
  const criadorAdministrador = podeExcluirGrupo(sessao.user.id, dadosGrupo.criadorId, associacaoAtual.permissao);
  const linkConvite = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/grupos/entrar?codigo=${dadosGrupo.codigoConvite}`;

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link className="text-sm font-bold tracking-[0.18em] text-lime-300" href="/painel">JOGO CERTO</Link>
          <Link className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200" href="/painel">Voltar ao painel</Link>
        </header>
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-10">
          <p className="text-sm font-semibold tracking-[0.2em] text-lime-300 uppercase">{dadosGrupo.modalidade}</p>
          <h1 className="mt-3 text-4xl font-bold text-white">{dadosGrupo.nome}</h1>
          <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-300">{dadosGrupo.descricao || "Este grupo ainda não tem descrição."}</p>
          <p className="mt-5 text-sm text-slate-400">Criado por <span className="text-slate-200">{dadosGrupo.nomeCriador}</span></p>
        </section>

        <section className="mt-6 rounded-3xl border border-lime-300/20 bg-lime-300/[0.06] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white">Convide para jogar</h2>
          <p className="mt-2 text-sm text-slate-300">Compartilhe o código ou o link com quem vai participar.</p>
          <p className="mt-4 break-all rounded-xl bg-black/20 p-4 font-mono text-lime-200">{dadosGrupo.codigoConvite}</p>
          <p className="mt-3 break-all text-sm text-slate-400">{linkConvite}</p>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Treinos e partidas do grupo</h2>
              <p className="mt-2 text-sm text-slate-400">Visíveis para integrantes deste grupo.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {administrador && <Link className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-100" href={`/grupos/${groupId}/editar`}>Editar grupo</Link>}
              <Link className="rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-emerald-950" href={`/grupos/${groupId}/treinos/novo`}>Criar evento</Link>
            </div>
          </div>
          {treinosAtivos.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-white/15 p-5 text-slate-300">O grupo ainda não tem treinos ou partidas.</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {treinosAtivos.map((evento) => (
                <li key={evento.id}>
                  <Link className="block h-full rounded-2xl border border-white/10 bg-black/10 p-5 transition hover:border-lime-300/40" href={`/treinos/${evento.id}`}>
                    <span className="text-xs font-semibold tracking-[0.15em] text-lime-300 uppercase">{evento.modalidade}</span>
                    <span className="mt-2 block text-xl font-bold text-white">{evento.titulo}</span>
                    <span className="mt-3 block text-sm text-slate-400">{evento.data.split("-").reverse().join("/")} · {evento.horario.slice(0, 5)} · {evento.local}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {treinosCancelados.length > 0 && (
            <details className="mt-7 rounded-2xl border border-red-300/20 bg-red-400/[0.04] p-5">
              <summary className="cursor-pointer font-semibold text-red-100">Treinos cancelados ({treinosCancelados.length})</summary>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {treinosCancelados.map((evento) => (
                  <li key={evento.id}>
                    <Link className="block h-full rounded-2xl border border-red-300/20 bg-black/10 p-5 transition hover:border-red-300/40" href={`/treinos/${evento.id}`}>
                      <span className="inline-flex rounded-full bg-red-300/15 px-2.5 py-1 text-xs font-bold tracking-wide text-red-200">CANCELADO</span>
                      <span className="mt-3 block text-xs font-semibold tracking-[0.15em] text-slate-300 uppercase">{evento.modalidade}</span>
                      <span className="mt-2 block text-xl font-bold text-white">{evento.titulo}</span>
                      <span className="mt-3 block text-sm text-slate-400">{evento.data.split("-").reverse().join("/")} · {evento.horario.slice(0, 5)} · {evento.local}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">Integrantes</h2>
            <span className="text-sm text-slate-400">{membros.length} {membros.length === 1 ? "pessoa" : "pessoas"}</span>
          </div>
          {erro === "permissao" && <p className="mt-4 rounded-xl bg-red-400/10 p-3 text-sm text-red-200" role="alert">Você não tem permissão para remover este integrante.</p>}
          {erro === "grupo" && <p className="mt-4 rounded-xl bg-red-400/10 p-3 text-sm text-red-200" role="alert">A ação solicitada exige permissão de administrador e uma associação válida ao grupo.</p>}
          {removido === "sucesso" && <p className="mt-4 rounded-xl bg-lime-300/10 p-3 text-sm text-lime-200" role="status">Integrante removido do grupo.</p>}
          {administradorNomeado === "sucesso" && <p className="mt-4 rounded-xl bg-lime-300/10 p-3 text-sm text-lime-200" role="status">Integrante promovido a administrador.</p>}
          <ul className="mt-5 divide-y divide-white/10">
            {membros.map((membro) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-4" key={membro.id}>
                <div>
                  <p className="font-medium text-white">{membro.nome}{membro.id === sessao.user.id ? " (você)" : ""}</p>
                  <p className="mt-1 text-sm text-slate-400">{membro.permissao === "admin" ? "Administrador" : "Integrante"}</p>
                </div>
                {administrador && membro.permissao === "membro" && (
                  <div className="flex flex-wrap gap-2">
                    <form action={nomearAdministradorAction}>
                      <input type="hidden" name="grupoId" value={groupId} />
                      <input type="hidden" name="usuarioId" value={membro.id} />
                      <button className="rounded-lg border border-lime-300/25 px-3 py-2 text-sm text-lime-200 hover:bg-lime-300/10">Tornar administrador</button>
                    </form>
                    {membro.id !== dadosGrupo.criadorId && (
                      <form action={removerMembroAction}>
                        <input type="hidden" name="grupoId" value={groupId} />
                        <input type="hidden" name="usuarioId" value={membro.id} />
                        <button className="rounded-lg border border-red-300/25 px-3 py-2 text-sm text-red-200 hover:bg-red-300/10">Remover</button>
                      </form>
                    )}
                  </div>
                )}
                {administrador && membro.permissao === "admin" && membro.id !== dadosGrupo.criadorId && (
                  <form action={removerMembroAction}>
                    <input type="hidden" name="grupoId" value={groupId} />
                    <input type="hidden" name="usuarioId" value={membro.id} />
                    <button className="rounded-lg border border-red-300/25 px-3 py-2 text-sm text-red-200 hover:bg-red-300/10">Remover</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
        {criadorAdministrador && (
          <section className="mt-6 rounded-3xl border border-red-300/20 bg-red-400/[0.06] p-6 sm:p-8">
            <h2 className="text-lg font-bold text-red-100">Excluir grupo</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Esta ação é irreversível. Os eventos vinculados ao grupo, suas presenças e seus equipamentos serão excluídos junto com os integrantes. Eventos independentes e outros grupos não serão afetados.
            </p>
            <div className="mt-5"><DeleteGroupButton groupId={groupId} /></div>
          </section>
        )}
      </div>
    </main>
  );
}
