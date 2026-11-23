import { z } from "zod";

export const respostaSchema = z.enum(["vou", "nao_vou"], {
  error: "Escolha se você vai ou não vai.",
});

export const equipamentoNecessarioSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do equipamento.").max(80, "O nome deve ter até 80 caracteres."),
  quantidade: z.coerce.number().int("Use uma quantidade inteira.").min(1, "A quantidade necessária deve ser pelo menos 1."),
});

export const equipamentoLevadoSchema = z.object({
  treinoEquipamentoId: z.string().uuid("Equipamento inválido."),
  quantidade: z.coerce.number().int("Use uma quantidade inteira.").min(0, "A quantidade não pode ser negativa."),
});

export type EstadoPresenca = { erro?: string; sucesso?: string };
