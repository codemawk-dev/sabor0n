import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { restaurantes } from "@/db/schema";
import { isLojaAberta } from "@/lib/caixa";
import { CheckoutForm } from "@/components/storefront/checkout-form";

export const metadata = { title: "Checkout | SaborOn" };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const restaurante = await db.query.restaurantes.findFirst({
    where: and(eq(restaurantes.slug, slug), eq(restaurantes.ativo, true)),
    columns: { id: true, nome: true, taxaEntrega: true, fusoHorario: true },
  });
  if (!restaurante) notFound();

  const aberto = await isLojaAberta(restaurante);

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <Link
        href={`/${slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar ao cardápio
      </Link>
      <h1 className="mb-6 text-2xl font-bold">
        Finalizar pedido — {restaurante.nome}
      </h1>
      {!aberto && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          Restaurante Fechado no Momento. Estamos preparando tudo para logo
          reabrir!
        </div>
      )}
      <CheckoutForm
        slug={slug}
        taxaEntrega={restaurante.taxaEntrega}
        restauranteAberto={aberto}
      />
    </div>
  );
}
