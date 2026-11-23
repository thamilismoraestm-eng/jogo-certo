import assert from "node:assert/strict";
import test from "node:test";
import { cadastroSchema, loginSchema } from "../src/lib/auth-validation.ts";
import { criarGrupoSchema, codigoConviteSchema } from "../src/lib/group-validation.ts";
import { criarCodigoConvite } from "../src/lib/invite-code.ts";

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
