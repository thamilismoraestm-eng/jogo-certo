"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { treino } from "@/lib/training-schema";
import { podeCancelarTreino, podePublicarTreino } from "@/lib/training-rules";

async function usuarioAtual() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  return sessao?.user ?? null;
}

export async function publicarTreinoAction(formData: FormData): Promise<void> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const treinoId = String(formData.get("treinoId") ?? "");
  const [evento] = await db.select({
    id: treino.id,
    criadorId: treino.criadorId,
    resultadoPublicado: treino.resultadoPublicado,
  }).from(treino).where(eq(treino.id, treinoId)).limit(1);

  if (!evento || !podePublicarTreino(usuario.id, evento.criadorId)) {
    redirect(`/treinos/${treinoId}?erro=permissao`);
  }
  if (evento.resultadoPublicado) redirect(`/treinos/${treinoId}`);

  await db.update(treino).set({
    resultadoPublicado: true,
    atualizadoEm: new Date(),
  }).where(and(
    eq(treino.id, treinoId),
    eq(treino.criadorId, usuario.id),
    eq(treino.resultadoPublicado, false),
  ));

  revalidatePath(`/treinos/${treinoId}`);
  redirect(`/treinos/${treinoId}`);
}

export async function cancelarTreinoAction(formData: FormData): Promise<void> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const treinoId = String(formData.get("treinoId") ?? "");
  const [evento] = await db.select({
    id: treino.id,
    criadorId: treino.criadorId,
    status: treino.status,
  }).from(treino).where(eq(treino.id, treinoId)).limit(1);

  if (!evento || !podeCancelarTreino(usuario.id, evento.criadorId, evento.status)) {
    redirect(`/treinos/${treinoId}?erro=permissao`);
  }

  await db.update(treino).set({
    status: "cancelado",
    atualizadoEm: new Date(),
  }).where(and(
    eq(treino.id, treinoId),
    eq(treino.criadorId, usuario.id),
    eq(treino.status, "ativo"),
  ));

  revalidatePath(`/treinos/${treinoId}`);
  redirect(`/treinos/${treinoId}`);
}
