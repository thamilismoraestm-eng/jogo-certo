CREATE TYPE "public"."permissao_grupo" AS ENUM('admin', 'membro');--> statement-breakpoint
CREATE TABLE "grupo" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"modalidade" text NOT NULL,
	"descricao" text,
	"codigo_convite" text NOT NULL,
	"criador_id" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grupo_codigo_convite_unique" UNIQUE("codigo_convite")
);
--> statement-breakpoint
CREATE TABLE "membro_grupo" (
	"id" text PRIMARY KEY NOT NULL,
	"grupo_id" text NOT NULL,
	"usuario_id" text NOT NULL,
	"permissao" "permissao_grupo" DEFAULT 'membro' NOT NULL,
	"entrou_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membro_grupo_grupo_usuario_unique" UNIQUE("grupo_id","usuario_id")
);
--> statement-breakpoint
ALTER TABLE "grupo" ADD CONSTRAINT "grupo_criador_id_user_id_fk" FOREIGN KEY ("criador_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membro_grupo" ADD CONSTRAINT "membro_grupo_grupo_id_grupo_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membro_grupo" ADD CONSTRAINT "membro_grupo_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "membro_grupo_usuario_idx" ON "membro_grupo" USING btree ("usuario_id");