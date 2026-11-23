import assert from "node:assert/strict";
import test from "node:test";
import { cadastroSchema, loginSchema } from "../src/lib/auth-validation.ts";
import { criarGrupoSchema, codigoConviteSchema } from "../src/lib/group-validation.ts";
import { criarCodigoConvite } from "../src/lib/invite-code.ts";
import { dadosTreinoSchema } from "../src/lib/training-validation.ts";
import { instanteManaus, podeEditarTreino, podeVerTreino, treinoJaPassou } from "../src/lib/training-rules.ts";

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
