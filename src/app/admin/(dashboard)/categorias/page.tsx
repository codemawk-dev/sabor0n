import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categorias } from "@/db/schema";
import { getOwnerRestaurante } from "@/lib/auth";
import { deleteCategoria } from "@/actions/categorias";
import { CategoriaFormDialog } from "@/components/admin/categoria-form";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Categorias | SaborOn" };

export default async function CategoriasPage() {
  const { restaurante } = await getOwnerRestaurante();

  const lista = await db.query.categorias.findMany({
    where: eq(categorias.restauranteId, restaurante.id),
    orderBy: [asc(categorias.ordem), asc(categorias.nome)],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <CategoriaFormDialog />
      </div>

      <Card>
        <CardContent>
          {lista.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma categoria cadastrada. Crie a primeira para começar a
              montar seu cardápio.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-20">Ordem</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.nome}</TableCell>
                    <TableCell>{cat.ordem}</TableCell>
                    <TableCell className="text-right">
                      <CategoriaFormDialog categoria={cat} />
                      <DeleteButton
                        description={`A categoria "${cat.nome}" e todos os seus produtos serão excluídos permanentemente.`}
                        onDelete={deleteCategoria.bind(null, cat.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
