import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { treino } from "@/lib/training-schema";
import { destinoLoginConvite, podeAbrirConviteTreino } from "@/lib/training-invites";

export default async function ConviteTreinoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  if (!podeAbrirConviteTreino(null, codigo)) notFound();
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) redirect(destinoLoginConvite(codigo));
  const [evento] = await db.select({ id: treino.id, grupoId: treino.grupoId }).from(treino)
    .where(eq(treino.codigoConvite, codigo)).limit(1);
  if (!evento || !podeAbrirConviteTreino(evento.grupoId, codigo)) notFound();
  redirect(`/treinos/${evento.id}`);
}
