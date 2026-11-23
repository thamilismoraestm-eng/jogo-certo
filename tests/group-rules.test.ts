import { describe, expect, it } from "vitest";
import { podeAdministrarGrupo, podeExcluirGrupo, podeRemoverMembro } from "../src/lib/group-rules";
import { deveAvisarMinimoParticipantes, podeCancelarTreino, podeEditarTreino, podePublicarTreino, podeResponderTreino, podeVerTreino, separarTreinosPorStatus, treinoAceitaAlteracoes } from "../src/lib/training-rules";
import { criarCodigoConvite } from "../src/lib/invite-code";
import { caminhoConviteTreino, classificarConviteTreino, destinoLoginConvite, lerCodigoConviteTreino, podeAbrirConviteTreino } from "../src/lib/training-invites";

describe("permissões para excluir grupos", () => {
  it("permite ao criador que continua administrador excluir o grupo", () => {
    expect(podeExcluirGrupo("criador", "criador", "admin")).toBe(true);
  });

  it("não permite a um integrante comum excluir o grupo", () => {
    expect(podeExcluirGrupo("participante", "criador", "membro")).toBe(false);
  });

  it("não permite a outro administrador excluir o grupo do criador", () => {
    expect(podeExcluirGrupo("outro-admin", "criador", "admin")).toBe(false);
  });

  it("não permite excluir quando a associação de administrador não existe", () => {
    expect(podeExcluirGrupo("criador", "criador", null)).toBe(false);
  });
});

describe("aviso do mínimo de participantes", () => {
  it("avisa abaixo do mínimo e deixa de avisar quando ele é atingido", () => {
    expect(deveAvisarMinimoParticipantes(2, 3)).toBe(true);
    expect(deveAvisarMinimoParticipantes(3, 3)).toBe(false);
    expect(deveAvisarMinimoParticipantes(4, 3)).toBe(false);
  });
});

describe("administração do grupo", () => {
  it("reconhece administradores e recusa integrantes comuns", () => {
    expect(podeAdministrarGrupo("admin")).toBe(true);
    expect(podeAdministrarGrupo("membro")).toBe(false);
    expect(podeAdministrarGrupo(null)).toBe(false);
  });

  it("impede qualquer administrador de remover o criador original", () => {
    expect(podeRemoverMembro("admin", "criador", "criador")).toBe(false);
  });

  it("permite a administradores promovidos remover membros e a si próprios", () => {
    expect(podeRemoverMembro("admin", "criador", "membro")).toBe(true);
    expect(podeRemoverMembro("admin", "criador", "admin-promovido")).toBe(true);
  });

  it("não permite que membros comuns removam ninguém", () => {
    expect(podeRemoverMembro("membro", "criador", "outro-membro")).toBe(false);
  });
});

describe("organização de treinos cancelados", () => {
  it("separa eventos cancelados dos ativos e preserva cada registro", () => {
    const eventos = [
      { id: "ativo", status: "ativo" as const },
      { id: "cancelado", status: "cancelado" as const },
    ];
    expect(separarTreinosPorStatus(eventos)).toEqual({
      ativos: [{ id: "ativo", status: "ativo" }],
      cancelados: [{ id: "cancelado", status: "cancelado" }],
    });
  });

  it("aceita alterações somente em eventos ativos", () => {
    expect(treinoAceitaAlteracoes("ativo")).toBe(true);
    expect(treinoAceitaAlteracoes("cancelado")).toBe(false);
  });
});

describe("convites para eventos independentes", () => {
  it("gera um código e um caminho de convite para compartilhar", () => {
    const codigo = criarCodigoConvite();
    expect(codigo).toMatch(/^[a-zA-Z0-9]{8,64}$/);
    expect(caminhoConviteTreino(codigo)).toBe(`/treinos/convite/${codigo}`);
    expect(podeAbrirConviteTreino(null, codigo)).toBe(true);
  });

  it("preserva o destino do convite no redirecionamento para login", () => {
    const codigo = "A1b2C3d4";
    expect(destinoLoginConvite(codigo)).toBe(`/login?returnTo=${encodeURIComponent(`/treinos/convite/${codigo}`)}`);
  });

  it("aceita código e link completo, e recusa entradas que não sejam convites individuais", () => {
    expect(lerCodigoConviteTreino("A1b2C3d4")).toBe("A1b2C3d4");
    expect(lerCodigoConviteTreino("https://jogocerto.example/treinos/convite/A1b2C3d4")).toBe("A1b2C3d4");
    expect(lerCodigoConviteTreino("https://jogocerto.example/grupos/entrar?codigo=A1b2C3d4")).toBeNull();
    expect(lerCodigoConviteTreino("código inválido")).toBeNull();
  });

  it("distingue convite inválido, evento inexistente, grupo e evento cancelado", () => {
    expect(classificarConviteTreino("curto", null)).toBe("codigo_invalido");
    expect(classificarConviteTreino("A1b2C3d4", null)).toBe("nao_encontrado");
    expect(classificarConviteTreino("A1b2C3d4", { grupoId: "grupo", status: "ativo" })).toBe("evento_de_grupo");
    expect(classificarConviteTreino("A1b2C3d4", { grupoId: null, status: "cancelado" })).toBe("cancelado");
    expect(classificarConviteTreino("A1b2C3d4", { grupoId: null, status: "ativo" })).toBe("valido");
  });

  it("permite ao convidado autenticado responder evento independente ativo", () => {
    expect(podeResponderTreino({
      usuarioId: "artemio",
      criadorId: "thamilis",
      grupoId: null,
      ehMembroDoGrupo: false,
      status: "ativo",
      data: "2027-01-01",
      horario: "10:00",
      agora: new Date("2026-11-23T12:00:00Z"),
    })).toBe(true);
  });

  it("não abre evento de grupo por convite nem permite acesso a não integrante", () => {
    expect(podeAbrirConviteTreino("grupo-privado", "A1b2C3d4")).toBe(false);
    expect(podeVerTreino({
      usuarioId: "artemio",
      criadorId: "thamilis",
      grupoId: "grupo-privado",
      ehMembroDoGrupo: false,
    })).toBe(false);
  });

  it("permite visualizar evento cancelado pelo convite, mas bloqueia resposta", () => {
    expect(podeAbrirConviteTreino(null, "A1b2C3d4")).toBe(true);
    expect(podeResponderTreino({
      usuarioId: "artemio",
      criadorId: "thamilis",
      grupoId: null,
      ehMembroDoGrupo: false,
      status: "cancelado",
      data: "2027-01-01",
      horario: "10:00",
      agora: new Date("2026-11-23T12:00:00Z"),
    })).toBe(false);
  });

  it("mantém edição e cancelamento exclusivos do criador", () => {
    const evento = {
      status: "ativo" as const,
      data: "2027-01-01",
      horario: "10:00",
      agora: new Date("2026-11-23T12:00:00Z"),
    };
    expect(podeEditarTreino({ ...evento, usuarioId: "artemio", criadorId: "thamilis" })).toBe(false);
    expect(podeCancelarTreino("artemio", "thamilis", "ativo")).toBe(false);
    expect(podePublicarTreino("artemio", "thamilis")).toBe(false);
    expect(podeEditarTreino({ ...evento, usuarioId: "thamilis", criadorId: "thamilis" })).toBe(true);
    expect(podePublicarTreino("thamilis", "thamilis")).toBe(true);
  });
});
