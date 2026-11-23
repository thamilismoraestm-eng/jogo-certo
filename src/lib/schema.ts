// Drizzle Kit precisa enxergar as tabelas de autenticação e do aplicativo.
export { account, session, user, verification } from "@/lib/auth-schema";
export { grupo, membroGrupo, permissaoGrupo } from "@/lib/group-schema";
export {
  equipamentoLevado,
  presenca,
  respostaPresenca,
  statusTreino,
  treino,
  treinoEquipamento,
} from "@/lib/training-schema";
