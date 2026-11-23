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
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "@/lib/auth-schema";
import { grupo } from "@/lib/group-schema";

export const statusTreino = pgEnum("status_treino", ["ativo", "cancelado"]);

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
