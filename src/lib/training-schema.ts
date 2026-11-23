import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "@/lib/auth-schema";
import { grupo } from "@/lib/group-schema";

export const statusTreino = pgEnum("status_treino", ["ativo", "cancelado"]);
export const respostaPresenca = pgEnum("resposta_presenca", ["vou", "nao_vou"]);

export const treino = pgTable(
  "treino",
  {
    id: text("id").primaryKey(),
    titulo: text("titulo").notNull(),
    modalidade: text("modalidade").notNull(),
    local: text("local").notNull(),
    data: date("data", { mode: "string" }).notNull(),
    horario: time("horario", { precision: 0 }).notNull(),
    minimoParticipantes: integer("minimo_participantes").notNull().default(1),
    observacoes: text("observacoes"),
    criadorId: text("criador_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    grupoId: text("grupo_id").references(() => grupo.id, { onDelete: "cascade" }),
    codigoConvite: text("codigo_convite").unique(),
    status: statusTreino("status").notNull().default("ativo"),
    resultadoPublicado: boolean("resultado_publicado").notNull().default(false),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("treino_minimo_participantes_check", sql`${table.minimoParticipantes} >= 1`),
    index("treino_criador_data_idx").on(table.criadorId, table.data, table.horario),
    index("treino_grupo_data_idx").on(table.grupoId, table.data, table.horario),
  ],
);

export const treinoEquipamento = pgTable(
  "treino_equipamento",
  {
    id: text("id").primaryKey(),
    treinoId: text("treino_id").notNull().references(() => treino.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    quantidadeNecessaria: integer("quantidade_necessaria").notNull(),
  },
  (table) => [
    check("treino_equipamento_quantidade_check", sql`${table.quantidadeNecessaria} >= 1`),
    uniqueIndex("treino_equipamento_nome_unique").on(table.treinoId, sql`lower(${table.nome})`),
  ],
);

export const presenca = pgTable(
  "presenca",
  {
    id: text("id").primaryKey(),
    treinoId: text("treino_id").notNull().references(() => treino.id, { onDelete: "cascade" }),
    usuarioId: text("usuario_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    resposta: respostaPresenca("resposta").notNull(),
    respondidoEm: timestamp("respondido_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("presenca_treino_usuario_unique").on(table.treinoId, table.usuarioId),
    index("presenca_usuario_idx").on(table.usuarioId),
  ],
);

export const equipamentoLevado = pgTable(
  "equipamento_levado",
  {
    id: text("id").primaryKey(),
    presencaId: text("presenca_id").notNull().references(() => presenca.id, { onDelete: "cascade" }),
    treinoEquipamentoId: text("treino_equipamento_id").notNull().references(() => treinoEquipamento.id, { onDelete: "cascade" }),
    quantidade: integer("quantidade").notNull(),
  },
  (table) => [
    check("equipamento_levado_quantidade_check", sql`${table.quantidade} >= 1`),
    unique("equipamento_levado_presenca_item_unique").on(table.presencaId, table.treinoEquipamentoId),
    index("equipamento_levado_item_idx").on(table.treinoEquipamentoId),
  ],
);
