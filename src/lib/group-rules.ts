export type PermissaoGrupo = "admin" | "membro" | null;

export function podeAdministrarGrupo(permissao: PermissaoGrupo): boolean {
  return permissao === "admin";
}

export function podeRemoverMembro(
  permissao: PermissaoGrupo,
  criadorId: string,
  usuarioAlvoId: string,
): boolean {
  return podeAdministrarGrupo(permissao) && usuarioAlvoId !== criadorId;
}

export function podeExcluirGrupo(
  usuarioId: string,
  criadorId: string,
  permissao: PermissaoGrupo,
): boolean {
  return usuarioId === criadorId && podeAdministrarGrupo(permissao);
}
