type AcessoTreino = {
  usuarioId: string | null;
  criadorId: string;
  grupoId: string | null;
  ehMembroDoGrupo: boolean;
};

export function podeVerTreino({ usuarioId, criadorId, grupoId, ehMembroDoGrupo }: AcessoTreino): boolean {
  if (!usuarioId) return false;
  if (!grupoId) return true;
  return usuarioId === criadorId || ehMembroDoGrupo;
}

export function instanteManaus(data: string, horario: string): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  const [hora, minuto] = horario.split(":").map(Number);
  const dataHoraLocalComoUtc = Date.UTC(ano, mes - 1, dia, hora, minuto);
  let instante = dataHoraLocalComoUtc;

  // Calcula o deslocamento do fuso com Intl, sem depender do fuso do servidor.
  const formato = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Manaus",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    const partes = Object.fromEntries(
      formato.formatToParts(new Date(instante)).map(({ type, value }) => [type, Number(value)]),
    );
    const horarioLocalComoUtc = Date.UTC(
      partes.year,
      partes.month - 1,
      partes.day,
      partes.hour,
      partes.minute,
      partes.second,
    );
    instante = dataHoraLocalComoUtc - (horarioLocalComoUtc - instante);
  }

  return new Date(instante);
}

export function treinoJaPassou(data: string, horario: string, agora = new Date()): boolean {
  return instanteManaus(data, horario).getTime() <= agora.getTime();
}

export function deveAvisarMinimoParticipantes(confirmados: number, minimo: number): boolean {
  return confirmados < minimo;
}

export function podePublicarTreino(usuarioId: string, criadorId: string): boolean {
  return usuarioId === criadorId;
}

export function podeCancelarTreino(
  usuarioId: string,
  criadorId: string,
  status: "ativo" | "cancelado",
): boolean {
  return usuarioId === criadorId && status === "ativo";
}

export function podeEditarTreino({
  usuarioId,
  criadorId,
  status,
  data,
  horario,
  agora,
}: {
  usuarioId: string;
  criadorId: string;
  status: "ativo" | "cancelado";
  data: string;
  horario: string;
  agora?: Date;
}): boolean {
  return usuarioId === criadorId && status === "ativo" && !treinoJaPassou(data, horario, agora);
}
