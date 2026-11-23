import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { grupo, membroGrupo } from "@/lib/group-schema";
import { and, asc, eq, isNull } from "drizzle-orm";
import { treino } from "@/lib/training-schema";

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ cadastro?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const meusGrupos = await db.select({
    id: grupo.id,
    nome: grupo.nome,
    modalidade: grupo.modalidade,
    permissao: membroGrupo.permissao,
  }).from(membroGrupo).innerJoin(grupo, eq(membroGrupo.grupoId, grupo.id))
    .where(eq(membroGrupo.usuarioId, session.user.id)).orderBy(grupo.nome);
  const meusTreinos = await db.select({
    id: treino.id,
    titulo: treino.titulo,
    modalidade: treino.modalidade,
    local: treino.local,
    data: treino.data,
    horario: treino.horario,
  }).from(treino)
    .where(and(eq(treino.criadorId, session.user.id), isNull(treino.grupoId)))
    .orderBy(asc(treino.data), asc(treino.horario));

  const { cadastro } = await searchParams;
  const tipoUsuario = session.user.tipoUsuario === "professor" ? "Professor" : "Estudante";

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-start justify-between gap-4">
          <Link className="text-sm font-bold tracking-[0.18em] text-lime-300" href="/">
            JOGO CERTO
          </Link>
          <SignOutButton />
        </header>

        <section className="mt-16 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:mt-24 sm:p-12">
          {cadastro === "sucesso" && (
            <p className="mb-7 rounded-xl border border-lime-300/20 bg-lime-300/10 px-4 py-3 text-sm text-lime-200" role="status">
              Conta criada com sucesso. Boas-vindas ao Jogo Certo!
            </p>
          )}
          <p className="text-sm font-semibold tracking-[0.2em] text-lime-300 uppercase">
            {tipoUsuario}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Olá, {session.user.name.split(" ")[0]}!
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Organize sua equipe e convide quem vai jogar com você.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-lime-300 uppercase">Meus eventos</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Treinos e partidas independentes</h2>
            </div>
            <Link className="rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-emerald-950" href="/treinos/novo">Criar evento</Link>
          </div>
          {meusTreinos.length === 0 ? (
            <p className="mt-7 rounded-2xl border border-dashed border-white/15 p-6 text-slate-300">Você ainda não criou treinos ou partidas independentes.</p>
          ) : (
            <ul className="mt-7 grid gap-4 sm:grid-cols-2">
              {meusTreinos.map((evento) => (
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
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-lime-300 uppercase">Meus grupos</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Sua turma em campo</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-100" href="/grupos/entrar">Usar convite</Link>
              <Link className="rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-emerald-950" href="/grupos/novo">Criar grupo</Link>
            </div>
          </div>
          {meusGrupos.length === 0 ? (
            <p className="mt-7 rounded-2xl border border-dashed border-white/15 p-6 text-slate-300">Você ainda não participa de grupos. Crie um grupo ou entre com um convite.</p>
          ) : (
            <ul className="mt-7 grid gap-4 sm:grid-cols-2">
              {meusGrupos.map((grupoItem) => (
                <li key={grupoItem.id}>
                  <Link className="block h-full rounded-2xl border border-white/10 bg-black/10 p-5 transition hover:border-lime-300/40" href={`/grupos/${grupoItem.id}`}>
                    <span className="text-xs font-semibold tracking-[0.15em] text-lime-300 uppercase">{grupoItem.modalidade}</span>
                    <span className="mt-2 block text-xl font-bold text-white">{grupoItem.nome}</span>
                    <span className="mt-3 block text-sm text-slate-400">{grupoItem.permissao === "admin" ? "Administrador" : "Integrante"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
