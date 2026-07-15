ALTER TYPE "public"."tipo_movimentacao" ADD VALUE 'venda';--> statement-breakpoint
CREATE TABLE "horarios_funcionamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"dia_semana" integer NOT NULL,
	"is_aberto" boolean DEFAULT true NOT NULL,
	"abertura" text DEFAULT '00:00' NOT NULL,
	"fechamento" text DEFAULT '23:59' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restaurantes" ADD COLUMN "descricao" text;--> statement-breakpoint
ALTER TABLE "restaurantes" ADD COLUMN "cnpj_cpf" text;--> statement-breakpoint
ALTER TABLE "restaurantes" ADD COLUMN "endereco" text;--> statement-breakpoint
ALTER TABLE "restaurantes" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "restaurantes" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "restaurantes" ADD COLUMN "whatsapp" text;--> statement-breakpoint
ALTER TABLE "restaurantes" ADD COLUMN "whatsapp_mensagem" text;--> statement-breakpoint
ALTER TABLE "restaurantes" ADD COLUMN "instagram" text;--> statement-breakpoint
ALTER TABLE "restaurantes" ADD COLUMN "facebook" text;--> statement-breakpoint
ALTER TABLE "restaurantes" ADD COLUMN "tiktok" text;--> statement-breakpoint
ALTER TABLE "restaurantes" ADD COLUMN "linkedin" text;--> statement-breakpoint
ALTER TABLE "restaurantes" ADD COLUMN "fuso_horario" text DEFAULT 'America/Sao_Paulo' NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurantes" ADD COLUMN "fotos_da_loja" text[];--> statement-breakpoint
ALTER TABLE "horarios_funcionamento" ADD CONSTRAINT "horarios_funcionamento_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;