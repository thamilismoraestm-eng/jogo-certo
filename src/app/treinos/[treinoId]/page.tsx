import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/auth-schema";
import { membroGrupo } from "@/lib/group-schema";
import { treino } from "@/lib/training-schema";
import { podeEditarTreino, podeVerTreino, treinoJaPassou } from "@/lib/training-rules";
import { equipamentoLevado, presenca, treinoEquipamento } from "@/lib/training-schema";
import { visibilidadePresencas } from "@/lib/attendance-rules";
import { AddEquipmentForm, CarryEquipmentForm, PresenceForm } from "@/app/treinos/attendance-forms";

export default async function TreinoDetalhesPage({ params }: { params: Promise<{ treinoId: string }> }) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) redirect("/login");
  const { treinoId } = await params;
  const [evento] = await db.select({
    id: treino.id,
    titulo: treino.titulo,
    modalidade: treino.modalidade,
    local: treino.local,
    data: treino.data,
    horario: treino.horario,
    minimoParticipantes: treino.minimoParticipantes,
    observacoes: treino.observacoes,
    criadorId: treino.criadorId,
    grupoId: treino.grupoId,
    codigoConvite: treino.codigoConvite,
    status: treino.status,
    resultadoPublicado: treino.resultadoPublicado,
    nomeCriador: user.name,
  }).from(treino).innerJoin(user, eq(treino.criadorId, user.id)).where(eq(treino.id, treinoId)).limit(1);
  if (!evento) notFound();

  let ehMembroDoGrupo = false;
  if (evento.grupoId) {
    const [associacao] = await db.select({ id: membroGrupo.id }).from(membroGrupo)
      .where(and(eq(membroGrupo.grupoId, evento.grupoId), eq(membroGrupo.usuarioId, sessao.user.id))).limit(1);
    ehMembroDoGrupo = Boolean(associacao);
  }
  if (!podeVerTreino({
    usuarioId: sessao.user.id,
    criadorId: evento.criadorId,
    grupoId: evento.grupoId,
    ehMembroDoGrupo,
  })) notFound();

  const respostas = await db.select({
    id: presenca.id,
    usuarioId: presenca.usuarioId,
    nome: user.name,
    resposta: presenca.resposta,
  }).from(presenca).innerJoin(user, eq(presenca.usuarioId, user.id))
    .where(eq(presenca.treinoId, treinoId)).orderBy(asc(user.name));
  const ehCriador = sessao.user.id === evento.criadorId;
  const visibilidade = visibilidadePresencas(respostas, sessao.user.id, evento.criadorId, evento.resultadoPublicado);
  const minhaResposta = visibilidade.minhaResposta;
  const equipamentos = await db.select({
    id: treinoEquipamento.id,
    nome: treinoEquipamento.nome,
    quantidadeNecessaria: treinoEquipamento.quantidadeNecessaria,
  }).from(treinoEquipamento).where(eq(treinoEquipamento.treinoId, treinoId)).orderBy(asc(treinoEquipamento.nome));
  const compromissos = await db.select({
    equipamentoId: treinoEquipamento.id,
    nomeEquipamento: treinoEquipamento.nome,
    quantidadeNecessaria: treinoEquipamento.quantidadeNecessaria,
    quantidade: equipamentoLevado.quantidade,
    usuarioId: presenca.usuarioId,
    nomeParticipante: user.name,
  }).from(equipamentoLevado)
    .innerJoin(presenca, eq(equipamentoLevado.presencaId, presenca.id))
    .innerJoin(treinoEquipamento, eq(equipamentoLevado.treinoEquipamentoId, treinoEquipamento.id))
    .innerJoin(user, eq(presenca.usuarioId, user.id))
    .where(and(
      eq(treinoEquipamento.treinoId, treinoId),
      visibilidade.podeVerResponsaveis ? undefined : eq(presenca.usuarioId, sessao.user.id),
    ));

  const horario = evento.horario.slice(0, 5);
  const editar = podeEditarTreino({
    usuarioId: sessao.user.id,
    criadorId: evento.criadorId,
    status: evento.status,
    data: evento.data,
    horario,
  });
  const podeResponder = evento.status === "ativo" && !treinoJaPassou(evento.data, horario);
  const dataExibida = evento.data.split("-").reverse().join("/");
  const linkConvite = evento.codigoConvite
    ? `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/treinos/convite/${evento.codigoConvite}`
    : null;

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link className="text-sm font-bold tracking-[0.18em] text-lime-300" href={evento.grupoId ? `/grupos/${evento.grupoId}` : "/painel"}>JOGO CERTO</Link>
          <div className="flex gap-3">
            {editar && <Link className="rounded-xl bg-lime-300 px-4 py-2 text-sm font-bold text-emerald-950" href={`/treinos/${evento.id}/editar`}>Editar evento</Link>}
            <Link className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200" href={evento.grupoId ? `/grupos/${evento.grupoId}` : "/painel"}>Voltar</Link>
          </div>
        </header>
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-10">
          <p className="text-sm font-semibold tracking-[0.2em] text-lime-300 uppercase">{evento.modalidade} · {evento.grupoId ? "Evento de grupo" : "Evento independente"}</p>
          <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">{evento.titulo}</h1>
          <p className="mt-4 text-sm text-slate-400">Criado por <span className="text-slate-200">{evento.nomeCriador}</span></p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-black/15 p-5"><dt className="text-sm text-slate-400">Data e horário · Manaus</dt><dd className="mt-2 text-lg font-semibold text-white">{dataExibida} às {horario}</dd></div>
            <div className="rounded-2xl bg-black/15 p-5"><dt className="text-sm text-slate-400">Local</dt><dd className="mt-2 text-lg font-semibold text-white">{evento.local}</dd></div>
            <div className="rounded-2xl bg-black/15 p-5"><dt className="text-sm text-slate-400">Mínimo de participantes</dt><dd className="mt-2 text-lg font-semibold text-white">{evento.minimoParticipantes}</dd></div>
            <div className="rounded-2xl bg-black/15 p-5"><dt className="text-sm text-slate-400">Situação</dt><dd className="mt-2 text-lg font-semibold text-white">{evento.status === "ativo" ? treinoJaPassou(evento.data, horario) ? "Realizado" : "Ativo" : "Cancelado"}</dd></div>
          </dl>
          <div className="mt-6 rounded-2xl bg-black/15 p-5">
            <h2 className="font-semibold text-white">Descrição</h2>
            <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-300">{evento.observacoes || "Sem descrição adicional."}</p>
          </div>
        </section>

        {linkConvite && (
          <section className="mt-6 rounded-3xl border border-lime-300/20 bg-lime-300/[0.06] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white">Convide para a partida</h2>
            <p className="mt-2 text-sm text-slate-300">Usuários autenticados podem abrir este evento independente.</p>
            <p className="mt-4 break-all rounded-xl bg-black/20 p-4 font-mono text-lime-200">{evento.codigoConvite}</p>
            <p className="mt-3 break-all text-sm text-slate-400">{linkConvite}</p>
          </section>
        )}

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">Presença</h2>
          {visibilidade.confirmados !== null && (
            <p className="mt-3 text-slate-200">{visibilidade.confirmados} {visibilidade.confirmados === 1 ? "pessoa confirmou" : "pessoas confirmaram"} presença.</p>
          )}
          {podeResponder ? (
            <PresenceForm treinoId={treinoId} respostaAtual={minhaResposta?.resposta ?? null} />
          ) : (
            <p className="mt-4 text-sm text-slate-400">Este evento não aceita novas respostas.</p>
          )}
          <div className="mt-7">
            <h3 className="font-semibold text-white">Respostas dos participantes</h3>
            {visibilidade.respostasVisiveis.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">{visibilidade.podeVerResponsaveis ? "Ninguém respondeu ainda." : "As respostas de outras pessoas ficam ocultas até a publicação do resultado."}</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/10">
                {visibilidade.respostasVisiveis.map((resposta) => (
                  <li className="flex justify-between gap-4 py-3 text-sm" key={resposta.id}>
                    <span className="text-slate-200">{resposta.nome}{resposta.usuarioId === sessao.user.id ? " (você)" : ""}</span>
                    <span className="text-lime-200">{resposta.resposta === "vou" ? "Vou" : "Não vou"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Equipamentos necessários</h2>
            <p className="mt-2 text-sm text-slate-400">Cada pessoa que confirmou presença pode registrar o que vai levar.</p>
          </div>
          {ehCriador && podeResponder && <AddEquipmentForm treinoId={treinoId} />}
          {equipamentos.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-white/15 p-5 text-slate-300">Nenhum equipamento foi listado.</p>
          ) : (
            <ul className="mt-6 divide-y divide-white/10">
              {equipamentos.map((equipamento) => {
                const meusCompromissos = compromissos.filter((compromisso) => compromisso.equipamentoId === equipamento.id);
                const quantidadeAtual = meusCompromissos.find((compromisso) => compromisso.usuarioId === sessao.user.id)?.quantidade ?? 0;
                return (
                  <li className="py-5" key={equipamento.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{equipamento.nome}</p>
                        <p className="mt-1 text-sm text-slate-400">Necessário: {equipamento.quantidadeNecessaria} unidade(s)</p>
                      </div>
                      {visibilidade.podeVerResponsaveis && (
                        <p className="text-sm text-slate-300">
                          Assumido: {meusCompromissos.reduce((total, compromisso) => total + compromisso.quantidade, 0)} / {equipamento.quantidadeNecessaria}
                        </p>
                      )}
                    </div>
                    {visibilidade.podeVerResponsaveis ? (
                      <p className="mt-3 text-sm text-slate-300">
                        {meusCompromissos.length ? meusCompromissos.map((compromisso) => `${compromisso.nomeParticipante}: ${compromisso.quantidade}`).join(" · ") : "Ninguém assumiu este item ainda."}
                      </p>
                    ) : quantidadeAtual > 0 ? (
                      <p className="mt-3 text-sm text-slate-300">Você assumiu {quantidadeAtual} unidade(s). Os demais compromissos ficam ocultos até a publicação.</p>
                    ) : (
                      <p className="mt-3 text-sm text-slate-400">Os responsáveis ficam visíveis após a publicação do resultado.</p>
                    )}
                    {podeResponder && minhaResposta?.resposta === "vou" && (
                      <CarryEquipmentForm
                        treinoId={treinoId}
                        equipamentoId={equipamento.id}
                        quantidadeAtual={quantidadeAtual}
                        quantidadeNecessaria={equipamento.quantidadeNecessaria}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
