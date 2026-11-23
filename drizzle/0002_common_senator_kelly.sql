CREATE TYPE "public"."status_treino" AS ENUM('ativo', 'cancelado');--> statement-breakpoint
CREATE TABLE "treino" (
	"id" text PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"modalidade" text NOT NULL,
	"local" text NOT NULL,
	"data" date NOT NULL,
	"horario" time(0) NOT NULL,
	"minimo_participantes" integer DEFAULT 1 NOT NULL,
	"observacoes" text,
	"criador_id" text NOT NULL,
	"grupo_id" text,
	"codigo_convite" text,
	"status" "status_treino" DEFAULT 'ativo' NOT NULL,
	"resultado_publicado" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treino_codigo_convite_unique" UNIQUE("codigo_convite"),
	CONSTRAINT "treino_minimo_participantes_check" CHECK ("treino"."minimo_participantes" >= 1)
);
--> statement-breakpoint
ALTER TABLE "treino" ADD CONSTRAINT "treino_criador_id_user_id_fk" FOREIGN KEY ("criador_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treino" ADD CONSTRAINT "treino_grupo_id_grupo_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "treino_criador_data_idx" ON "treino" USING btree ("criador_id","data","horario");--> statement-breakpoint
CREATE INDEX "treino_grupo_data_idx" ON "treino" USING btree ("grupo_id","data","horario");