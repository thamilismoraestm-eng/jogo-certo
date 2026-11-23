"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { treino } from "@/lib/training-schema";
import {
  caminhoConviteTreino,
  classificarConviteTreino,
  destinoLoginConvite,
  lerCodigoConviteTreino,
} from "@/lib/training-invites";

export type EstadoConviteTreino = { erro?: string };

export async function usarConviteTreinoAction(
  _anterior: EstadoConviteTreino,
  formData: FormData,
): Promise<EstadoConviteTreino> {
  const codigo = lerCodigoConviteTreino(String(formData.get("convite") ?? ""));
  if (!codigo) return { erro: "Digite um código válido ou cole o link completo do evento." };

  const [evento] = await db.select({ id: treino.id, grupoId: treino.grupoId, status: treino.status }).from(treino)
    .where(eq(treino.codigoConvite, codigo)).limit(1);
  const classificacao = classificarConviteTreino(codigo, evento ?? null);
  if (classificacao === "nao_encontrado") {
    return { erro: "Convite de evento individual não encontrado. Confira o código ou o link." };
  }
  if (classificacao === "evento_de_grupo") {
    return { erro: "Este é um convite de grupo. Use a opção de convite de grupo." };
  }

  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) redirect(destinoLoginConvite(codigo));
  redirect(caminhoConviteTreino(codigo));
}
