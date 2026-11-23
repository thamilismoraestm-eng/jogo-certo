import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "@/lib/auth-schema";

export const permissaoGrupo = pgEnum("permissao_grupo", ["admin", "membro"]);

export const grupo = pgTable("grupo", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  modalidade: text("modalidade").notNull(),
  descricao: text("descricao"),
  codigoConvite: text("codigo_convite").notNull().unique(),
  criadorId: text("criador_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const membroGrupo = pgTable(
  "membro_grupo",
  {
    id: text("id").primaryKey(),
    grupoId: text("grupo_id")
      .notNull()
      .references(() => grupo.id, { onDelete: "cascade" }),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    permissao: permissaoGrupo("permissao").notNull().default("membro"),
    entrouEm: timestamp("entrou_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("membro_grupo_grupo_usuario_unique").on(table.grupoId, table.usuarioId),
    index("membro_grupo_usuario_idx").on(table.usuarioId),
  ],
);
