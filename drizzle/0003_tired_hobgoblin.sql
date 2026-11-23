CREATE TYPE "public"."resposta_presenca" AS ENUM('vou', 'nao_vou');--> statement-breakpoint
CREATE TABLE "equipamento_levado" (
	"id" text PRIMARY KEY NOT NULL,
	"presenca_id" text NOT NULL,
	"treino_equipamento_id" text NOT NULL,
	"quantidade" integer NOT NULL,
	CONSTRAINT "equipamento_levado_presenca_item_unique" UNIQUE("presenca_id","treino_equipamento_id"),
	CONSTRAINT "equipamento_levado_quantidade_check" CHECK ("equipamento_levado"."quantidade" >= 1)
);
--> statement-breakpoint
CREATE TABLE "presenca" (
	"id" text PRIMARY KEY NOT NULL,
	"treino_id" text NOT NULL,
	"usuario_id" text NOT NULL,
	"resposta" "resposta_presenca" NOT NULL,
	"respondido_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "presenca_treino_usuario_unique" UNIQUE("treino_id","usuario_id")
);
--> statement-breakpoint
CREATE TABLE "treino_equipamento" (
	"id" text PRIMARY KEY NOT NULL,
	"treino_id" text NOT NULL,
	"nome" text NOT NULL,
	"quantidade_necessaria" integer NOT NULL,
	CONSTRAINT "treino_equipamento_quantidade_check" CHECK ("treino_equipamento"."quantidade_necessaria" >= 1)
);
--> statement-breakpoint
ALTER TABLE "equipamento_levado" ADD CONSTRAINT "equipamento_levado_presenca_id_presenca_id_fk" FOREIGN KEY ("presenca_id") REFERENCES "public"."presenca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipamento_levado" ADD CONSTRAINT "equipamento_levado_treino_equipamento_id_treino_equipamento_id_fk" FOREIGN KEY ("treino_equipamento_id") REFERENCES "public"."treino_equipamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presenca" ADD CONSTRAINT "presenca_treino_id_treino_id_fk" FOREIGN KEY ("treino_id") REFERENCES "public"."treino"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presenca" ADD CONSTRAINT "presenca_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treino_equipamento" ADD CONSTRAINT "treino_equipamento_treino_id_treino_id_fk" FOREIGN KEY ("treino_id") REFERENCES "public"."treino"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "equipamento_levado_item_idx" ON "equipamento_levado" USING btree ("treino_equipamento_id");--> statement-breakpoint
CREATE INDEX "presenca_usuario_idx" ON "presenca" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "treino_equipamento_nome_unique" ON "treino_equipamento" USING btree ("treino_id",lower("nome"));