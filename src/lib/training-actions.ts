"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { grupo, membroGrupo } from "@/lib/group-schema";
import { treino } from "@/lib/training-schema";
import { criarCodigoConvite } from "@/lib/invite-code";
import { podeEditarTreino } from "@/lib/training-rules";
import { dadosTreinoSchema, type EstadoTreino } from "@/lib/training-validation";

async function usuarioAtual() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  return sessao?.user ?? null;
}

function lerDados(formData: FormData) {
  return dadosTreinoSchema.safeParse({
    titulo: formData.get("titulo"),
    modalidade: formData.get("modalidade"),
    local: formData.get("local"),
    data: formData.get("data"),
    horario: formData.get("horario"),
    minimoParticipantes: formData.get("minimoParticipantes"),
    observacoes: formData.get("observacoes") ?? "",
  });
}

export async function criarTreinoAction(_anterior: EstadoTreino, formData: FormData): Promise<EstadoTreino> {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: "Entre na sua conta para criar um evento." };

  const dados = lerDados(formData);
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Confira os dados do evento." };

  const valorGrupo = formData.get("grupoId");
  const grupoId = typeof valorGrupo === "string" && valorGrupo ? valorGrupo : null;
  if (grupoId) {
    const [membro] = await db.select({ id: membroGrupo.id }).from(membroGrupo)
      .where(and(eq(membroGrupo.grupoId, grupoId), eq(membroGrupo.usuarioId, usuario.id))).limit(1);
    if (!membro) return { erro: "Você precisa participar do grupo para criar um evento nele." };
    const [grupoExiste] = await db.select({ id: grupo.id }).from(grupo).where(eq(grupo.id, grupoId)).limit(1);
    if (!grupoExiste) return { erro: "O grupo informado não foi encontrado." };
  }

  const [novoTreino] = await db.insert(treino).values({
    id: randomUUID(),
    titulo: dados.data.titulo,
    modalidade: dados.data.modalidade,
    local: dados.data.local,
    data: dados.data.data,
    horario: dados.data.horario,
    minimoParticipantes: dados.data.minimoParticipantes,
    observacoes: dados.data.observacoes || null,
    criadorId: usuario.id,
    grupoId,
    // Eventos independentes podem ser compartilhados por código; os de grupo usam a associação.
    codigoConvite: grupoId ? null : criarCodigoConvite(),
  }).returning({ id: treino.id });

  redirect(`/treinos/${novoTreino.id}`);
}

export async function editarTreinoAction(_anterior: EstadoTreino, formData: FormData): Promise<EstadoTreino> {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: "Entre na sua conta para editar este evento." };

  const dados = lerDados(formData);
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Confira os dados do evento." };
  const treinoId = String(formData.get("treinoId") ?? "");
  const [existente] = await db.select({
    id: treino.id,
    criadorId: treino.criadorId,
    data: treino.data,
    horario: treino.horario,
    status: treino.status,
  }).from(treino).where(eq(treino.id, treinoId)).limit(1);

  if (!existente || !podeEditarTreino({ ...existente, usuarioId: usuario.id })) {
    return { erro: "Somente o criador pode editar um evento ativo que ainda não aconteceu." };
  }

  await db.update(treino).set({
    titulo: dados.data.titulo,
    modalidade: dados.data.modalidade,
    local: dados.data.local,
    data: dados.data.data,
    horario: dados.data.horario,
    minimoParticipantes: dados.data.minimoParticipantes,
    observacoes: dados.data.observacoes || null,
    atualizadoEm: new Date(),
  }).where(and(eq(treino.id, treinoId), eq(treino.criadorId, usuario.id)));

  redirect(`/treinos/${treinoId}`);
}
