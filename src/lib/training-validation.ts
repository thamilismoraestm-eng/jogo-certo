import { z } from "zod";

function dataValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

export const dadosTreinoSchema = z.object({
  titulo: z.string().trim().min(2, "Informe o nome do treino ou partida.").max(120, "O nome deve ter até 120 caracteres."),
  modalidade: z.string().trim().min(2, "Informe a modalidade esportiva.").max(60, "A modalidade deve ter até 60 caracteres."),
  local: z.string().trim().min(2, "Informe o local.").max(200, "O local deve ter até 200 caracteres."),
  data: z.string().refine(dataValida, "Informe uma data válida."),
  horario: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido."),
  minimoParticipantes: z.coerce.number().int("O mínimo deve ser um número inteiro.").min(1, "O mínimo deve ser pelo menos 1."),
  observacoes: z.string().trim().max(1000, "A descrição deve ter até 1000 caracteres."),
});

export type DadosTreino = z.infer<typeof dadosTreinoSchema>;
export type EstadoTreino = { erro?: string };
