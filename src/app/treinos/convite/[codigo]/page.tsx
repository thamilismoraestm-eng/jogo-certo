import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { treino } from "@/lib/training-schema";

export default async function ConviteTreinoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  if (!/^[a-zA-Z0-9]{8,64}$/.test(codigo)) notFound();
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) redirect(`/login?returnTo=${encodeURIComponent(`/treinos/convite/${codigo}`)}`);
  const [evento] = await db.select({ id: treino.id }).from(treino)
    .where(eq(treino.codigoConvite, codigo)).limit(1);
  if (!evento) notFound();
  redirect(`/treinos/${evento.id}`);
}
