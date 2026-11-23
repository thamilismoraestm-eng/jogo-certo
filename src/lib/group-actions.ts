"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { criarGrupoSchema, codigoConviteSchema, grupoIdSchema, type EstadoFormulario } from "@/lib/group-validation";
import { criarCodigoConvite } from "@/lib/invite-code";
import { grupo, membroGrupo } from "@/lib/group-schema";
import { podeAdministrarGrupo, podeExcluirGrupo, podeRemoverMembro } from "@/lib/group-rules";

async function usuarioAtual() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  return sessao?.user ?? null;
}

export async function criarGrupoAction(_anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: "Entre na sua conta para criar um grupo." };

  const dados = criarGrupoSchema.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao") ?? "",
    modalidade: formData.get("modalidade"),
  });
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Confira os dados do grupo." };

  const groupId = randomUUID();
  const memberId = randomUUID();
  // A restrição única no banco é a garantia final contra colisões simultâneas.
  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const codigo = criarCodigoConvite();
    try {
      await db.batch([
        db.insert(grupo).values({
          id: groupId,
          nome: dados.data.nome,
          descricao: dados.data.descricao || null,
          modalidade: dados.data.modalidade,
          codigoConvite: codigo,
          criadorId: usuario.id,
        }),
        db.insert(membroGrupo).values({
          id: memberId,
          grupoId: groupId,
          usuarioId: usuario.id,
          permissao: "admin",
        }),
      ]);
      redirect(`/grupos/${groupId}`);
    } catch (erro) {
      if (erro instanceof Error && erro.message.includes("NEXT_REDIRECT")) throw erro;
      // Só repetimos se o código recém-gerado já existir; outros erros são reais.
      const colisao = await db.select({ id: grupo.id }).from(grupo).where(eq(grupo.codigoConvite, codigo)).limit(1);
      if (colisao.length === 0) throw erro;
    }
  }
  return { erro: "Não foi possível gerar um convite agora. Tente novamente." };
}

export async function entrarGrupoAction(_anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: "Entre na sua conta para usar um convite." };

  const validacao = codigoConviteSchema.safeParse(formData.get("codigo"));
  if (!validacao.success) return { erro: validacao.error.issues[0]?.message ?? "Confira o código." };

  const [encontrado] = await db.select({ id: grupo.id }).from(grupo).where(eq(grupo.codigoConvite, validacao.data)).limit(1);
  if (!encontrado) return { erro: "Não encontramos um grupo com esse código." };

  const [jaMembro] = await db.select({ id: membroGrupo.id }).from(membroGrupo)
    .where(and(eq(membroGrupo.grupoId, encontrado.id), eq(membroGrupo.usuarioId, usuario.id))).limit(1);
  if (jaMembro) redirect(`/grupos/${encontrado.id}`);

  try {
    await db.insert(membroGrupo).values({
      id: randomUUID(), grupoId: encontrado.id, usuarioId: usuario.id, permissao: "membro",
    });
  } catch {
    // Uma submissão repetida ou concorrente não duplica a associação.
    const [membroExistente] = await db.select({ id: membroGrupo.id }).from(membroGrupo)
      .where(and(eq(membroGrupo.grupoId, encontrado.id), eq(membroGrupo.usuarioId, usuario.id))).limit(1);
    if (!membroExistente) return { erro: "Não foi possível entrar no grupo. Tente novamente." };
  }
  redirect(`/grupos/${encontrado.id}`);
}

export async function removerMembroAction(formData: FormData): Promise<void> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const groupId = String(formData.get("grupoId") ?? "");
  const targetUserId = String(formData.get("usuarioId") ?? "");
  const [grupoEncontrado] = await db.select({ criadorId: grupo.criadorId }).from(grupo).where(eq(grupo.id, groupId)).limit(1);
  const [permissao] = await db.select({ permissao: membroGrupo.permissao }).from(membroGrupo)
    .where(and(eq(membroGrupo.grupoId, groupId), eq(membroGrupo.usuarioId, usuario.id))).limit(1);

  if (!grupoEncontrado || !targetUserId || !podeRemoverMembro(permissao?.permissao ?? null, grupoEncontrado.criadorId, targetUserId)) {
    redirect(`/grupos/${groupId}?erro=permissao`);
  }
  await db.delete(membroGrupo).where(and(eq(membroGrupo.grupoId, groupId), eq(membroGrupo.usuarioId, targetUserId)));
  redirect(`/grupos/${groupId}?removido=sucesso`);
}

export async function editarGrupoAction(_anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: "Entre na sua conta para editar o grupo." };

  const validacaoId = grupoIdSchema.safeParse(formData.get("grupoId"));
  if (!validacaoId.success) return { erro: "Grupo inválido." };
  const groupId = validacaoId.data;
  const dados = criarGrupoSchema.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao") ?? "",
    modalidade: formData.get("modalidade"),
  });
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Confira os dados do grupo." };

  const [associacao] = await db.select({ permissao: membroGrupo.permissao }).from(membroGrupo)
    .where(and(eq(membroGrupo.grupoId, groupId), eq(membroGrupo.usuarioId, usuario.id))).limit(1);
  if (!podeAdministrarGrupo(associacao?.permissao ?? null)) return { erro: "Somente administradores podem editar o grupo." };

  await db.update(grupo).set({
    nome: dados.data.nome,
    descricao: dados.data.descricao || null,
    modalidade: dados.data.modalidade,
  }).where(eq(grupo.id, groupId));
  revalidatePath(`/grupos/${groupId}`);
  redirect(`/grupos/${groupId}`);
}

export async function nomearAdministradorAction(formData: FormData): Promise<void> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  const validacaoId = grupoIdSchema.safeParse(formData.get("grupoId"));
  if (!validacaoId.success) redirect("/painel?erro=grupo");
  const groupId = validacaoId.data;
  const targetUserId = String(formData.get("usuarioId") ?? "");

  const [associacaoAtual] = await db.select({ permissao: membroGrupo.permissao }).from(membroGrupo)
    .where(and(eq(membroGrupo.grupoId, groupId), eq(membroGrupo.usuarioId, usuario.id))).limit(1);
  const [associacaoAlvo] = await db.select({ id: membroGrupo.id, permissao: membroGrupo.permissao }).from(membroGrupo)
    .where(and(eq(membroGrupo.grupoId, groupId), eq(membroGrupo.usuarioId, targetUserId))).limit(1);
  if (!podeAdministrarGrupo(associacaoAtual?.permissao ?? null) || !associacaoAlvo || associacaoAlvo.permissao === "admin") {
    redirect(`/grupos/${groupId}?erro=grupo`);
  }

  await db.update(membroGrupo).set({ permissao: "admin" }).where(eq(membroGrupo.id, associacaoAlvo.id));
  revalidatePath(`/grupos/${groupId}`);
  redirect(`/grupos/${groupId}?administrador=sucesso`);
}

export async function excluirGrupoAction(formData: FormData): Promise<void> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");

  const validacao = grupoIdSchema.safeParse(formData.get("grupoId"));
  if (!validacao.success) redirect("/painel?erro=exclusao");
  const groupId = validacao.data;

  const [grupoEncontrado] = await db.select({
    id: grupo.id,
    criadorId: grupo.criadorId,
  }).from(grupo).where(eq(grupo.id, groupId)).limit(1);
  const [associacao] = await db.select({ permissao: membroGrupo.permissao }).from(membroGrupo)
    .where(and(eq(membroGrupo.grupoId, groupId), eq(membroGrupo.usuarioId, usuario.id))).limit(1);

  if (!grupoEncontrado || !podeExcluirGrupo(usuario.id, grupoEncontrado.criadorId, associacao?.permissao ?? null)) {
    redirect("/painel?erro=exclusao");
  }

  // Um DELETE no grupo é atômico; as FKs removem apenas membros e eventos vinculados.
  // Presenças e equipamentos desses eventos também são removidos por suas próprias cascatas.
  const [excluido] = await db.delete(grupo).where(and(
    eq(grupo.id, groupId),
    eq(grupo.criadorId, usuario.id),
  )).returning({ id: grupo.id });

  if (!excluido) redirect("/painel?erro=exclusao");
  redirect("/painel?grupoExcluido=sucesso");
}
