import assert from "node:assert/strict";
import test from "node:test";
import { cadastroSchema, loginSchema } from "../src/lib/auth-validation.ts";
import { criarGrupoSchema, codigoConviteSchema } from "../src/lib/group-validation.ts";
import { criarCodigoConvite } from "../src/lib/invite-code.ts";
import { dadosTreinoSchema } from "../src/lib/training-validation.ts";
import {
  deveAvisarMinimoParticipantes,
  instanteManaus,
  podeCancelarTreino,
  podeEditarTreino,
  podePublicarTreino,
  podeVerTreino,
  treinoJaPassou,
} from "../src/lib/training-rules.ts";
import { equipamentoLevadoSchema, equipamentoNecessarioSchema, respostaSchema } from "../src/lib/attendance-validation.ts";
import { visibilidadePresencas } from "../src/lib/attendance-rules.ts";
import { podeAdministrarGrupo, podeExcluirGrupo } from "../src/lib/group-rules.ts";

const cadastroValido = {
  nome: "Ana Silva",
  email: "ana@example.com",
  senha: "senha-segura-123",
  confirmacaoSenha: "senha-segura-123",
  tipoUsuario: "aluno",
};

test("aceita um cadastro válido de estudante", () => {
  assert.equal(cadastroSchema.safeParse(cadastroValido).success, true);
});

test("recusa senhas diferentes na confirmação", () => {
  const resultado = cadastroSchema.safeParse({
    ...cadastroValido,
    confirmacaoSenha: "outra-senha-123",
  });

  assert.equal(resultado.success, false);
});

test("recusa senha menor que oito caracteres", () => {
  const resultado = cadastroSchema.safeParse({
    ...cadastroValido,
    senha: "curta",
    confirmacaoSenha: "curta",
  });

  assert.equal(resultado.success, false);
});

test("recusa e-mail inválido", () => {
  const resultado = loginSchema.safeParse({
    email: "email-invalido",
    senha: "qualquer-senha",
  });

  assert.equal(resultado.success, false);
});

test("recusa tipo de usuário fora das opções do cadastro", () => {
  const resultado = cadastroSchema.safeParse({
    ...cadastroValido,
    tipoUsuario: "outro",
  });

  assert.equal(resultado.success, false);
});

test("aceita dados válidos para criar um grupo", () => {
  assert.equal(criarGrupoSchema.safeParse({
    nome: "Vôlei de sábado",
    modalidade: "Vôlei",
    descricao: "Encontro semanal",
  }).success, true);
});

test("recusa grupo sem nome ou modalidade", () => {
  assert.equal(criarGrupoSchema.safeParse({ nome: "", modalidade: "", descricao: "" }).success, false);
});

test("aceita código de convite alfanumérico com pelo menos oito caracteres", () => {
  assert.equal(codigoConviteSchema.safeParse("a1b2c3d4").success, true);
});

test("recusa código de convite curto ou com símbolos", () => {
  assert.equal(codigoConviteSchema.safeParse("abc123!").success, false);
});

test("gera código de convite aleatório alfanumérico com mais de oito caracteres", () => {
  const codigo = criarCodigoConvite();
  assert.equal(codigo.length >= 8, true);
  assert.match(codigo, /^[a-zA-Z0-9]+$/);
});

const treinoValido = {
  titulo: "Partida de sábado",
  modalidade: "Futebol",
  local: "Quadra central",
  data: "2026-06-01",
  horario: "10:30",
  minimoParticipantes: "8",
  observacoes: "Levar água",
};

test("aceita dados válidos de treino ou partida", () => {
  assert.equal(dadosTreinoSchema.safeParse(treinoValido).success, true);
});

test("recusa data inválida e mínimo de participantes menor que um", () => {
  assert.equal(dadosTreinoSchema.safeParse({ ...treinoValido, data: "2026-02-30" }).success, false);
  assert.equal(dadosTreinoSchema.safeParse({ ...treinoValido, minimoParticipantes: "0" }).success, false);
});

test("interpreta a data e horário usando o fuso de Manaus", () => {
  assert.equal(instanteManaus("2026-06-01", "10:30").toISOString(), "2026-06-01T14:30:00.000Z");
  assert.equal(treinoJaPassou("2026-06-01", "10:30", new Date("2026-06-01T14:31:00.000Z")), true);
  assert.equal(treinoJaPassou("2026-06-01", "10:30", new Date("2026-06-01T14:29:00.000Z")), false);
});

test("permite ver eventos independentes para qualquer usuário autenticado", () => {
  assert.equal(podeVerTreino({ usuarioId: "visitante", criadorId: "criador", grupoId: null, ehMembroDoGrupo: false }), true);
  assert.equal(podeVerTreino({ usuarioId: null, criadorId: "criador", grupoId: null, ehMembroDoGrupo: false }), false);
});

test("limita evento de grupo a integrantes e ao criador", () => {
  assert.equal(podeVerTreino({ usuarioId: "membro", criadorId: "criador", grupoId: "grupo", ehMembroDoGrupo: true }), true);
  assert.equal(podeVerTreino({ usuarioId: "criador", criadorId: "criador", grupoId: "grupo", ehMembroDoGrupo: false }), true);
  assert.equal(podeVerTreino({ usuarioId: "outro", criadorId: "criador", grupoId: "grupo", ehMembroDoGrupo: false }), false);
});

test("somente o criador edita evento ativo que ainda não aconteceu", () => {
  const base = {
    criadorId: "criador",
    status: "ativo",
    data: "2026-06-01",
    horario: "10:30",
    agora: new Date("2026-06-01T14:00:00.000Z"),
  };
  assert.equal(podeEditarTreino({ ...base, usuarioId: "criador" }), true);
  assert.equal(podeEditarTreino({ ...base, usuarioId: "outro" }), false);
  assert.equal(podeEditarTreino({ ...base, usuarioId: "criador", status: "cancelado" }), false);
  assert.equal(podeEditarTreino({ ...base, usuarioId: "criador", agora: new Date("2026-06-01T15:00:00.000Z") }), false);
});

const respostasDoEvento = [
  { usuarioId: "criador", resposta: "vou", nome: "Ana" },
  { usuarioId: "bia", resposta: "nao_vou", nome: "Bia" },
  { usuarioId: "caio", resposta: "vou", nome: "Caio" },
];

test("criador vê todas as respostas e o total de confirmações", () => {
  const resultado = visibilidadePresencas(respostasDoEvento, "criador", "criador", false);
  assert.equal(resultado.respostasVisiveis.length, 3);
  assert.equal(resultado.confirmados, 2);
  assert.equal(resultado.podeVerResponsaveis, true);
});

test("participante só vê a própria resposta antes da publicação", () => {
  const resultado = visibilidadePresencas(respostasDoEvento, "bia", "criador", false);
  assert.deepEqual(resultado.respostasVisiveis.map(({ usuarioId }) => usuarioId), ["bia"]);
  assert.equal(resultado.confirmados, null);
  assert.equal(resultado.podeVerResponsaveis, false);
});

test("após publicação, participante vê confirmados, mas não respostas negativas", () => {
  const resultado = visibilidadePresencas(respostasDoEvento, "bia", "criador", true);
  assert.deepEqual(resultado.respostasVisiveis.map(({ usuarioId }) => usuarioId), ["criador", "caio"]);
  assert.equal(resultado.minhaResposta?.resposta, "nao_vou");
  assert.equal(resultado.confirmados, 2);
  assert.equal(resultado.podeVerResponsaveis, true);
});

test("valida equipamentos necessários e quantidades assumidas", () => {
  assert.equal(equipamentoNecessarioSchema.safeParse({ nome: "Bolas", quantidade: "3" }).success, true);
  assert.equal(equipamentoNecessarioSchema.safeParse({ nome: "B", quantidade: "0" }).success, false);
  assert.equal(equipamentoLevadoSchema.safeParse({ treinoEquipamentoId: "00000000-0000-4000-8000-000000000001", quantidade: "2" }).success, true);
  assert.equal(equipamentoLevadoSchema.safeParse({ treinoEquipamentoId: "não-é-id", quantidade: "1" }).success, false);
  assert.equal(respostaSchema.safeParse("vou").success, true);
  assert.equal(respostaSchema.safeParse("talvez").success, false);
});

test("avisa quando o número de confirmações está abaixo do mínimo", () => {
  assert.equal(deveAvisarMinimoParticipantes(2, 3), true);
  assert.equal(deveAvisarMinimoParticipantes(3, 3), false);
  assert.equal(deveAvisarMinimoParticipantes(4, 3), false);
});

test("somente o criador pode publicar, e o cancelamento só pode ser feito uma vez", () => {
  assert.equal(podePublicarTreino("criador", "criador"), true);
  assert.equal(podePublicarTreino("participante", "criador"), false);
  assert.equal(podeCancelarTreino("criador", "criador", "ativo"), true);
  assert.equal(podeCancelarTreino("participante", "criador", "ativo"), false);
  assert.equal(podeCancelarTreino("criador", "criador", "cancelado"), false);
});

test("somente o criador com papel de administrador pode excluir o grupo", () => {
  assert.equal(podeExcluirGrupo("criador", "criador", "admin"), true);
  assert.equal(podeExcluirGrupo("participante", "criador", "membro"), false);
  assert.equal(podeExcluirGrupo("outro-admin", "criador", "admin"), false);
  assert.equal(podeExcluirGrupo("criador", "criador", "membro"), false);
  assert.equal(podeExcluirGrupo("criador", "criador", null), false);
});

test("somente administradores podem gerenciar integrantes e dados do grupo", () => {
  assert.equal(podeAdministrarGrupo("admin"), true);
  assert.equal(podeAdministrarGrupo("membro"), false);
  assert.equal(podeAdministrarGrupo(null), false);
});
