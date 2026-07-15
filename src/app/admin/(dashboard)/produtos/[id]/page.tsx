import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categorias, produtos } from "@/db/schema";
import { getOwnerRestaurante } from "@/lib/auth";
import { ProdutoForm } from "@/components/admin/produto-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Editar produto | SaborOn" };

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { restaurante } = await getOwnerRestaurante();

  const produto = await db.query.produtos.findFirst({
    where: and(
      eq(produtos.id, id),
      eq(produtos.restauranteId, restaurante.id)
    ),
  });
  if (!produto) notFound();

  const listaCategorias = await db.query.categorias.findMany({
    where: eq(categorias.restauranteId, restaurante.id),
    orderBy: [asc(categorias.ordem)],
    columns: { id: true, nome: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Editar produto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProdutoForm
            categorias={listaCategorias}
            produtoId={produto.id}
            defaultValues={{
              nome: produto.nome,
              descricao: produto.descricao ?? "",
              precoReais: (produto.preco / 100).toFixed(2).replace(".", ","),
              categoriaId: produto.categoriaId,
              imagemUrl: produto.imagemUrl ?? "",
              disponivel: produto.disponivel,
              destaque: produto.destaque,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
