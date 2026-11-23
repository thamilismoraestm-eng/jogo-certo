export function caminhoConviteTreino(codigo: string): string {
  return `/treinos/convite/${encodeURIComponent(codigo)}`;
}

export function destinoLoginConvite(codigo: string): string {
  return `/login?returnTo=${encodeURIComponent(caminhoConviteTreino(codigo))}`;
}

export function lerCodigoConviteTreino(valor: string): string | null {
  const entrada = valor.trim();
  if (/^[a-zA-Z0-9]{8,64}$/.test(entrada)) return entrada;

  try {
    const url = entrada.startsWith("/")
      ? new URL(entrada, "https://convite.local")
      : new URL(entrada);
    if (!entrada.startsWith("/") && url.protocol !== "https:" && url.protocol !== "http:") return null;
    const codigo = url.pathname.match(/^\/treinos\/convite\/([a-zA-Z0-9]{8,64})\/?$/)?.[1];
    return codigo ?? null;
  } catch {
    return null;
  }
}

export function podeAbrirConviteTreino(grupoId: string | null, codigo: string): boolean {
  return grupoId === null && /^[a-zA-Z0-9]{8,64}$/.test(codigo);
}

export function classificarConviteTreino(
  codigo: string,
  evento: { grupoId: string | null; status: "ativo" | "cancelado" } | null,
): "codigo_invalido" | "nao_encontrado" | "evento_de_grupo" | "cancelado" | "valido" {
  if (!/^[a-zA-Z0-9]{8,64}$/.test(codigo)) return "codigo_invalido";
  if (!evento) return "nao_encontrado";
  if (evento.grupoId !== null) return "evento_de_grupo";
  return evento.status === "cancelado" ? "cancelado" : "valido";
}
