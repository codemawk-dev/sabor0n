CREATE TYPE "public"."status_caixa" AS ENUM('aberto', 'fechado');--> statement-breakpoint
CREATE TYPE "public"."tipo_movimentacao" AS ENUM('suprimento', 'sangria');--> statement-breakpoint
CREATE TABLE "caixas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"status" "status_caixa" DEFAULT 'aberto' NOT NULL,
	"valor_abertura" integer NOT NULL,
	"valor_fechamento" integer,
	"aberto_em" timestamp DEFAULT now() NOT NULL,
	"fechado_em" timestamp
);
--> statement-breakpoint
CREATE TABLE "movimentacoes_caixa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caixa_id" uuid NOT NULL,
	"tipo" "tipo_movimentacao" NOT NULL,
	"valor" integer NOT NULL,
	"motivo" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "caixas" ADD CONSTRAINT "caixas_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimentacoes_caixa" ADD CONSTRAINT "movimentacoes_caixa_caixa_id_caixas_id_fk" FOREIGN KEY ("caixa_id") REFERENCES "public"."caixas"("id") ON DELETE cascade ON UPDATE no action;