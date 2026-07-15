import { notFound } from "next/navigation";
import { Clock, Store, Truck } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { restaurantes } from "@/db/schema";
import { isLojaAberta } from "@/lib/caixa";
import { formatCents } from "@/lib/money";
import { CartSheet } from "@/components/storefront/cart-sheet";
import { ProductCard } from "@/components/storefront/product-card";

export default async function LojaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const restaurante = await db.query.restaurantes.findFirst({
    where: and(eq(restaurantes.slug, slug), eq(restaurantes.ativo, true)),
    with: {
      categorias: {
        orderBy: (categorias, { asc }) => [asc(categorias.ordem)],
        with: {
          produtos: {
            where: (produtos, { eq }) => eq(produtos.disponivel, true),
            orderBy: (produtos, { asc }) => [asc(produtos.nome)],
          },
        },
      },
    },
  });
  if (!restaurante) notFound();

  const aberto = await isLojaAberta(restaurante);

  const todosProdutos = restaurante.categorias.flatMap((c) => c.produtos);
  const destaques = todosProdutos.filter((p) => p.destaque);
  const categoriasComProdutos = restaurante.categorias.filter(
    (c) => c.produtos.length > 0
  );

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28">
      {!aberto && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          <Store className="size-5 shrink-0" />
          <p className="text-sm font-medium">
            Restaurante Fechado no Momento. Estamos preparando tudo para logo
            reabrir!
          </p>
        </div>
      )}
      <header className="border-b py-8">
        <h1 className="text-3xl font-bold">{restaurante.nome}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {restaurante.tempoEntregaEstimado && (
            <span className="flex items-center gap-1">
              <Clock className="size-4" />
              {restaurante.tempoEntregaEstimado}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Truck className="size-4" />
            Entrega: {formatCents(restaurante.taxaEntrega)}
          </span>
        </div>
      </header>

      {todosProdutos.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Este restaurante ainda não tem produtos no cardápio.
        </p>
      ) : (
        <div className="space-y-10 py-8">
          {destaques.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold">⭐ Destaques</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {destaques.map((produto) => (
                  <ProductCard key={produto.id} produto={produto} slug={slug} />
                ))}
              </div>
            </section>
          )}

          {categoriasComProdutos.map((categoria) => (
            <section key={categoria.id}>
              <h2 className="mb-4 text-xl font-bold">{categoria.nome}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {categoria.produtos.map((produto) => (
                  <ProductCard key={produto.id} produto={produto} slug={slug} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <CartSheet slug={slug} restauranteAberto={aberto} />
    </div>
  );
}
