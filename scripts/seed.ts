/**
 * Seed de dados de exemplo para desenvolvimento.
 * Uso: npx tsx scripts/seed.ts
 * Requer DATABASE_URL no .env.local.
 *
 * Dica: depois de rodar, faça login no /admin, crie seu restaurante
 * pelo onboarding OU vincule este restaurante ao seu usuário:
 *   update restaurantes set owner_id = '<uuid do auth.users>' where slug = 'pizzaria-do-ze';
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { restaurantes, categorias, produtos } from "../src/db/schema";

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client);

  const [restaurante] = await db
    .insert(restaurantes)
    .values({
      nome: "Pizzaria do Zé",
      slug: "pizzaria-do-ze",
      telefone: "(11) 99999-0000",
      taxaEntrega: 800, // R$ 8,00
      tempoEntregaEstimado: "40-50 min",
    })
    .returning();

  const [pizzas, bebidas, sobremesas] = await db
    .insert(categorias)
    .values([
      { restauranteId: restaurante.id, nome: "Pizzas", ordem: 1 },
      { restauranteId: restaurante.id, nome: "Bebidas", ordem: 2 },
      { restauranteId: restaurante.id, nome: "Sobremesas", ordem: 3 },
    ])
    .returning();

  await db.insert(produtos).values([
    {
      restauranteId: restaurante.id,
      categoriaId: pizzas.id,
      nome: "Pizza Margherita",
      descricao: "Molho de tomate, mussarela, manjericão fresco e azeite.",
      preco: 4590,
      destaque: true,
    },
    {
      restauranteId: restaurante.id,
      categoriaId: pizzas.id,
      nome: "Pizza Calabresa",
      descricao: "Calabresa fatiada, cebola e azeitonas pretas.",
      preco: 4290,
      destaque: true,
    },
    {
      restauranteId: restaurante.id,
      categoriaId: pizzas.id,
      nome: "Pizza Quatro Queijos",
      descricao: "Mussarela, provolone, gorgonzola e parmesão.",
      preco: 4990,
    },
    {
      restauranteId: restaurante.id,
      categoriaId: pizzas.id,
      nome: "Pizza Portuguesa",
      descricao: "Presunto, ovos, cebola, ervilha e mussarela.",
      preco: 4690,
    },
    {
      restauranteId: restaurante.id,
      categoriaId: bebidas.id,
      nome: "Refrigerante Lata 350ml",
      descricao: "Coca-Cola, Guaraná ou Fanta.",
      preco: 600,
    },
    {
      restauranteId: restaurante.id,
      categoriaId: bebidas.id,
      nome: "Suco Natural 500ml",
      descricao: "Laranja ou limão, feito na hora.",
      preco: 1200,
    },
    {
      restauranteId: restaurante.id,
      categoriaId: sobremesas.id,
      nome: "Pizza de Chocolate",
      descricao: "Chocolate ao leite com morangos.",
      preco: 3890,
      destaque: false,
    },
    {
      restauranteId: restaurante.id,
      categoriaId: sobremesas.id,
      nome: "Petit Gateau",
      descricao: "Com sorvete de creme.",
      preco: 1890,
      disponivel: false, // exemplo de produto indisponível (oculto na loja)
    },
  ]);

  console.log(`Seed concluído! Restaurante: ${restaurante.nome} (/${restaurante.slug})`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
