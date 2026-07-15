CREATE TYPE "public"."status_pedido" AS ENUM('recebido', 'preparando', 'a_caminho', 'entregue', 'cancelado');--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itens_pedido" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"produto_id" uuid,
	"quantidade" integer NOT NULL,
	"preco_unitario" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"cliente_nome" text NOT NULL,
	"cliente_telefone" text NOT NULL,
	"status" "status_pedido" DEFAULT 'recebido' NOT NULL,
	"tipo_entrega" text DEFAULT 'delivery' NOT NULL,
	"endereco_rua" text,
	"endereco_numero" text,
	"endereco_bairro" text,
	"endereco_complemento" text,
	"subtotal" integer NOT NULL,
	"taxa_entrega" integer NOT NULL,
	"total" integer NOT NULL,
	"metodo_pagamento" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurante_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"preco" integer NOT NULL,
	"imagem_url" text,
	"disponivel" boolean DEFAULT true NOT NULL,
	"destaque" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"telefone" text NOT NULL,
	"taxa_entrega" integer DEFAULT 0 NOT NULL,
	"tempo_entrega_estimado" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"owner_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurantes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "restaurantes_owner_id_unique" UNIQUE("owner_id")
);
--> statement-breakpoint
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_restaurante_id_restaurantes_id_fk" FOREIGN KEY ("restaurante_id") REFERENCES "public"."restaurantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE cascade ON UPDATE no action;