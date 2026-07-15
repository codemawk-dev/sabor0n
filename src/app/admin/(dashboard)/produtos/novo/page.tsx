import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categorias } from "@/db/schema";
import { getOwnerRestaurante } from "@/lib/auth";
import { ProdutoForm } from "@/components/admin/produto-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Novo produto | SaborOn" };

export default async function NovoProdutoPage() {
  const { restaurante } = await getOwnerRestaurante();

  const listaCategorias = await db.query.categorias.findMany({
    where: eq(categorias.restauranteId, restaurante.id),
    orderBy: [asc(categorias.ordem)],
    columns: { id: true, nome: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Novo produto</CardTitle>
        </CardHeader>
        <CardContent>
          {listaCategorias.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Crie pelo menos uma categoria antes de cadastrar produtos.
            </p>
          ) : (
            <ProdutoForm categorias={listaCategorias} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
