import { z } from "zod";

export const criarGrupoSchema = z.object({
  nome: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres.").max(80, "O nome deve ter até 80 caracteres."),
  descricao: z.string().trim().max(500, "A descrição deve ter até 500 caracteres."),
  modalidade: z.string().trim().min(2, "Informe a modalidade esportiva.").max(60, "A modalidade deve ter até 60 caracteres."),
});

export const codigoConviteSchema = z.string().trim().regex(/^[a-zA-Z0-9]{8,64}$/, "Digite um código de convite válido.");
export const grupoIdSchema = z.uuid("Grupo inválido.");

export type EstadoFormulario = { erro?: string; sucesso?: string };
