"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { membroGrupo } from "@/lib/group-schema";
import { podeResponderTreino, treinoAceitaAlteracoes, treinoJaPassou } from "@/lib/training-rules";
import { equipamentoLevado, presenca, treino, treinoEquipamento } from "@/lib/training-schema";
import {
  equipamentoLevadoSchema,
  equipamentoNecessarioSchema,
  respostaSchema,
  type EstadoPresenca,
} from "@/lib/attendance-validation";

async function usuarioAtual() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  return sessao?.user ?? null;
}

async function eventoDisponivel(treinoId: string, usuarioId: string) {
  const [evento] = await db.select().from(treino).where(eq(treino.id, treinoId)).limit(1);
  if (!evento) return null;

  let ehMembroDoGrupo = false;
  if (evento.grupoId) {
    const [membro] = await db.select({ id: membroGrupo.id }).from(membroGrupo)
      .where(and(eq(membroGrupo.grupoId, evento.grupoId), eq(membroGrupo.usuarioId, usuarioId))).limit(1);
    ehMembroDoGrupo = Boolean(membro);
  }

  if (!podeResponderTreino({
    usuarioId,
    criadorId: evento.criadorId,
    grupoId: evento.grupoId,
    ehMembroDoGrupo,
    status: evento.status,
    data: evento.data,
    horario: evento.horario.slice(0, 5),
  })) return null;
  return evento;
}

export async function responderPresencaAction(
  _anterior: EstadoPresenca,
  formData: FormData,
): Promise<EstadoPresenca> {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: "Entre na sua conta para responder." };

  const treinoId = String(formData.get("treinoId") ?? "");
  const resposta = respostaSchema.safeParse(formData.get("resposta"));
  if (!resposta.success) return { erro: resposta.error.issues[0]?.message ?? "Escolha uma resposta." };
  const evento = await eventoDisponivel(treinoId, usuario.id);
  if (!evento) return { erro: "Este evento não está disponível para respostas." };

  const [respostaAtual] = await db.select({ id: presenca.id }).from(presenca)
    .where(and(eq(presenca.treinoId, treinoId), eq(presenca.usuarioId, usuario.id))).limit(1);
  const presencaId = respostaAtual?.id ?? randomUUID();
  const salvarResposta = db.insert(presenca).values({
    id: presencaId,
    treinoId,
    usuarioId: usuario.id,
    resposta: resposta.data,
    respondidoEm: new Date(),
  }).onConflictDoUpdate({
    target: [presenca.treinoId, presenca.usuarioId],
    set: { resposta: resposta.data, respondidoEm: new Date() },
  });

  if (resposta.data === "nao_vou") {
    // A regra RN05 remove os compromissos ao trocar a resposta para "Não vou".
    await db.batch([
      db.delete(equipamentoLevado).where(eq(equipamentoLevado.presencaId, presencaId)),
      salvarResposta,
    ]);
  } else {
    await salvarResposta;
  }

  revalidatePath(`/treinos/${treinoId}`);
  return { sucesso: resposta.data === "vou" ? "Presença confirmada: você vai." : "Resposta atualizada: você não vai." };
}

export async function adicionarEquipamentoNecessarioAction(
  _anterior: EstadoPresenca,
  formData: FormData,
): Promise<EstadoPresenca> {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: "Entre na sua conta para editar os equipamentos." };
  const treinoId = String(formData.get("treinoId") ?? "");
  const dados = equipamentoNecessarioSchema.safeParse({
    nome: formData.get("nome"),
    quantidade: formData.get("quantidade"),
  });
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Confira os dados do equipamento." };

  const [evento] = await db.select().from(treino).where(eq(treino.id, treinoId)).limit(1);
  if (!evento || evento.criadorId !== usuario.id || !treinoAceitaAlteracoes(evento.status) || treinoJaPassou(evento.data, evento.horario.slice(0, 5))) {
    return { erro: "Somente o criador pode definir equipamentos antes do evento." };
  }

  const nome = dados.data.nome;
  const [duplicado] = await db.select({ id: treinoEquipamento.id }).from(treinoEquipamento)
    .where(and(
      eq(treinoEquipamento.treinoId, treinoId),
      sql`lower(${treinoEquipamento.nome}) = lower(${nome})`,
    )).limit(1);
  if (duplicado) return { erro: "Este equipamento já está na lista." };

  try {
    await db.insert(treinoEquipamento).values({
      id: randomUUID(),
      treinoId,
      nome,
      quantidadeNecessaria: dados.data.quantidade,
    });
  } catch {
    // O índice único também protege contra envios simultâneos com o mesmo nome.
    return { erro: "Este equipamento já está na lista." };
  }

  revalidatePath(`/treinos/${treinoId}`);
  return { sucesso: "Equipamento adicionado à lista." };
}

export async function salvarEquipamentoLevadoAction(
  _anterior: EstadoPresenca,
  formData: FormData,
): Promise<EstadoPresenca> {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: "Entre na sua conta para informar o equipamento." };
  const treinoId = String(formData.get("treinoId") ?? "");
  const dados = equipamentoLevadoSchema.safeParse({
    treinoEquipamentoId: formData.get("treinoEquipamentoId"),
    quantidade: formData.get("quantidade"),
  });
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Confira a quantidade." };

  const evento = await eventoDisponivel(treinoId, usuario.id);
  if (!evento) return { erro: "Este evento não está disponível para alterações." };
  const [minhaPresenca] = await db.select({ id: presenca.id, resposta: presenca.resposta }).from(presenca)
    .where(and(eq(presenca.treinoId, treinoId), eq(presenca.usuarioId, usuario.id))).limit(1);
  if (!minhaPresenca || minhaPresenca.resposta !== "vou") {
    return { erro: "Confirme que você vai antes de escolher um equipamento." };
  }

  const [item] = await db.select({
    id: treinoEquipamento.id,
    nome: treinoEquipamento.nome,
    quantidadeNecessaria: treinoEquipamento.quantidadeNecessaria,
  }).from(treinoEquipamento).where(and(
    eq(treinoEquipamento.id, dados.data.treinoEquipamentoId),
    eq(treinoEquipamento.treinoId, treinoId),
  )).limit(1);
  if (!item) return { erro: "O equipamento não pertence a este evento." };

  const [anterior] = await db.select({ id: equipamentoLevado.id, quantidade: equipamentoLevado.quantidade })
    .from(equipamentoLevado).where(and(
      eq(equipamentoLevado.presencaId, minhaPresenca.id),
      eq(equipamentoLevado.treinoEquipamentoId, item.id),
    )).limit(1);

  if (dados.data.quantidade === 0) {
    if (anterior) await db.delete(equipamentoLevado).where(eq(equipamentoLevado.id, anterior.id));
    revalidatePath(`/treinos/${treinoId}`);
    return { sucesso: "Seu compromisso com este equipamento foi removido." };
  }

  const compromissos = await db.select({
    presencaId: equipamentoLevado.presencaId,
    quantidade: equipamentoLevado.quantidade,
  }).from(equipamentoLevado).where(eq(equipamentoLevado.treinoEquipamentoId, item.id));
  const totalDosOutros = compromissos
    .filter((compromisso) => compromisso.presencaId !== minhaPresenca.id)
    .reduce((total, compromisso) => total + compromisso.quantidade, 0);
  if (totalDosOutros + dados.data.quantidade > item.quantidadeNecessaria) {
    const disponivel = Math.max(0, item.quantidadeNecessaria - totalDosOutros);
    return { erro: `Ainda faltam apenas ${disponivel} unidade(s) deste equipamento.` };
  }

  await db.insert(equipamentoLevado).values({
    id: anterior?.id ?? randomUUID(),
    presencaId: minhaPresenca.id,
    treinoEquipamentoId: item.id,
    quantidade: dados.data.quantidade,
  }).onConflictDoUpdate({
    target: [equipamentoLevado.presencaId, equipamentoLevado.treinoEquipamentoId],
    set: { quantidade: dados.data.quantidade },
  });

  revalidatePath(`/treinos/${treinoId}`);
  return { sucesso: "Seu equipamento foi registrado." };
}
