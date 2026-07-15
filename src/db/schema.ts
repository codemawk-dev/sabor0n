import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Enum para os Status do Pedido
export const statusPedidoEnum = pgEnum("status_pedido", [
  "recebido",
  "preparando",
  "a_caminho",
  "entregue",
  "cancelado",
]);

// 2. Tabela de Restaurantes (Os Inquilinos / Tenants)
export const restaurantes = pgTable("restaurantes", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  slug: text("slug").notNull().unique(), // Ex: saboron.com.br/meu-restaurante
  telefone: text("telefone").notNull(),
  taxaEntrega: integer("taxa_entrega").default(0).notNull(), // Em centavos
  tempoEntregaEstimado: text("tempo_entrega_estimado"), // Ex: "30-40 min"
  ativo: boolean("ativo").default(true).notNull(),
  // Dono do restaurante (auth.users do Supabase). A FK para o schema auth
  // é criada via migration SQL, pois o Drizzle não referencia auth.users.
  ownerId: uuid("owner_id").unique(),

  // Perfil do estabelecimento
  descricao: text("descricao"),
  cnpjCpf: text("cnpj_cpf"),
  endereco: text("endereco"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),

  // Redes sociais e contato
  whatsapp: text("whatsapp"),
  whatsappMensagem: text("whatsapp_mensagem"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  tiktok: text("tiktok"),
  linkedin: text("linkedin"),

  // Funcionamento
  fusoHorario: text("fuso_horario").default("America/Sao_Paulo").notNull(),
  fotosDaLoja: text("fotos_da_loja").array(), // URLs da galeria da loja

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Categorias do Cardápio
export const categorias = pgTable("categorias", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .references(() => restaurantes.id, { onDelete: "cascade" })
    .notNull(),
  nome: text("nome").notNull(),
  ordem: integer("ordem").default(0).notNull(), // Para ordenar as categorias no front
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Produtos do Cardápio
export const produtos = pgTable("produtos", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .references(() => restaurantes.id, { onDelete: "cascade" })
    .notNull(),
  categoriaId: uuid("categoria_id")
    .references(() => categorias.id, { onDelete: "cascade" })
    .notNull(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  preco: integer("preco").notNull(), // Sempre em centavos! (Ex: R$ 25,90 vira 2590)
  imagemUrl: text("imagem_url"),
  disponivel: boolean("disponivel").default(true).notNull(),
  destaque: boolean("destaque").default(false).notNull(), // Aparece no topo do cardápio
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Pedidos
export const pedidos = pgTable("pedidos", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .references(() => restaurantes.id, { onDelete: "cascade" })
    .notNull(),
  clienteNome: text("cliente_nome").notNull(),
  clienteTelefone: text("cliente_telefone").notNull(),
  status: statusPedidoEnum("status").default("recebido").notNull(),

  // Endereço de Entrega (pode ser nulo caso o cliente opte por "Retirar")
  tipoEntrega: text("tipo_entrega").default("delivery").notNull(), // "delivery" ou "retirada"
  enderecoRua: text("endereco_rua"),
  enderecoNumero: text("endereco_numero"),
  enderecoBairro: text("endereco_bairro"),
  enderecoComplemento: text("endereco_complemento"),

  subtotal: integer("subtotal").notNull(), // Soma dos produtos em centavos
  taxaEntrega: integer("taxa_entrega").notNull(), // Taxa no momento da compra
  total: integer("total").notNull(), // subtotal + taxaEntrega

  metodoPagamento: text("metodo_pagamento").notNull(), // "pix", "cartao", "dinheiro"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Itens do Pedido (Relacionamento de muitos-para-muitos entre Pedidos e Produtos)
export const itensPedido = pgTable("itens_pedido", {
  id: uuid("id").defaultRandom().primaryKey(),
  pedidoId: uuid("pedido_id")
    .references(() => pedidos.id, { onDelete: "cascade" })
    .notNull(),
  produtoId: uuid("produto_id").references(() => produtos.id, {
    onDelete: "set null",
  }), // Se o produto for deletado, o histórico do pedido continua
  quantidade: integer("quantidade").notNull(),
  precoUnitario: integer("preco_unitario").notNull(), // Preço do produto no momento da compra (evita problemas se o lojista alterar o preço depois)
});

// 7. Caixa (PDV) — sessões de abertura/fechamento
export const statusCaixaEnum = pgEnum("status_caixa", ["aberto", "fechado"]);
export const tipoMovimentacaoEnum = pgEnum("tipo_movimentacao", [
  "suprimento",
  "sangria",
  "venda", // entrada automática gerada por pedidos da loja
]);

export const caixas = pgTable("caixas", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .references(() => restaurantes.id, { onDelete: "cascade" })
    .notNull(),
  status: statusCaixaEnum("status").default("aberto").notNull(),
  valorAbertura: integer("valor_abertura").notNull(), // Em centavos (ex: R$ 100,00 -> 10000)
  valorFechamento: integer("valor_fechamento"), // Em centavos (opcional até o fechamento)
  abertoEm: timestamp("aberto_em").defaultNow().notNull(),
  fechadoEm: timestamp("fechado_em"),
});

// 8. Movimentações manuais do caixa (suprimento = aporte, sangria = retirada)
export const movimentacoesCaixa = pgTable("movimentacoes_caixa", {
  id: uuid("id").defaultRandom().primaryKey(),
  caixaId: uuid("caixa_id")
    .references(() => caixas.id, { onDelete: "cascade" })
    .notNull(),
  tipo: tipoMovimentacaoEnum("tipo").notNull(),
  valor: integer("valor").notNull(), // Em centavos
  motivo: text("motivo").notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

// 9. Horários de funcionamento (múltiplos turnos por dia da semana)
export const horariosFuncionamento = pgTable("horarios_funcionamento", {
  id: uuid("id").defaultRandom().primaryKey(),
  restauranteId: uuid("restaurante_id")
    .references(() => restaurantes.id, { onDelete: "cascade" })
    .notNull(),
  diaSemana: integer("dia_semana").notNull(), // 0 (Domingo) a 6 (Sábado)
  isAberto: boolean("is_aberto").default(true).notNull(),
  abertura: text("abertura").default("00:00").notNull(), // "HH:MM"
  fechamento: text("fechamento").default("23:59").notNull(), // "HH:MM"
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

// 10. Relações (apenas para as queries relacionais do Drizzle — não altera o banco)
export const restaurantesRelations = relations(restaurantes, ({ many }) => ({
  categorias: many(categorias),
  produtos: many(produtos),
  pedidos: many(pedidos),
  horarios: many(horariosFuncionamento),
}));

export const horariosFuncionamentoRelations = relations(
  horariosFuncionamento,
  ({ one }) => ({
    restaurante: one(restaurantes, {
      fields: [horariosFuncionamento.restauranteId],
      references: [restaurantes.id],
    }),
  })
);

export const categoriasRelations = relations(categorias, ({ one, many }) => ({
  restaurante: one(restaurantes, {
    fields: [categorias.restauranteId],
    references: [restaurantes.id],
  }),
  produtos: many(produtos),
}));

export const produtosRelations = relations(produtos, ({ one }) => ({
  restaurante: one(restaurantes, {
    fields: [produtos.restauranteId],
    references: [restaurantes.id],
  }),
  categoria: one(categorias, {
    fields: [produtos.categoriaId],
    references: [categorias.id],
  }),
}));

export const pedidosRelations = relations(pedidos, ({ one, many }) => ({
  restaurante: one(restaurantes, {
    fields: [pedidos.restauranteId],
    references: [restaurantes.id],
  }),
  itens: many(itensPedido),
}));

export const itensPedidoRelations = relations(itensPedido, ({ one }) => ({
  pedido: one(pedidos, {
    fields: [itensPedido.pedidoId],
    references: [pedidos.id],
  }),
  produto: one(produtos, {
    fields: [itensPedido.produtoId],
    references: [produtos.id],
  }),
}));

export const caixasRelations = relations(caixas, ({ one, many }) => ({
  restaurante: one(restaurantes, {
    fields: [caixas.restauranteId],
    references: [restaurantes.id],
  }),
  movimentacoes: many(movimentacoesCaixa),
}));

export const movimentacoesCaixaRelations = relations(
  movimentacoesCaixa,
  ({ one }) => ({
    caixa: one(caixas, {
      fields: [movimentacoesCaixa.caixaId],
      references: [caixas.id],
    }),
  })
);
