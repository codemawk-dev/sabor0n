import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Pencil, Plus, Star } from "lucide-react";
import { db } from "@/db";
import { produtos } from "@/db/schema";
import { getOwnerRestaurante } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { deleteProduto } from "@/actions/produtos";
import { DeleteButton } from "@/components/admin/delete-button";
import { DisponivelSwitch } from "@/components/admin/disponivel-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Produtos | SaborOn" };

export default async function ProdutosPage() {
  const { restaurante } = await getOwnerRestaurante();

  const lista = await db.query.produtos.findMany({
    where: eq(produtos.restauranteId, restaurante.id),
    orderBy: [asc(produtos.nome)],
    with: { categoria: true },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Button render={<Link href="/admin/produtos/novo" />}>
          <Plus className="size-4" />
          Novo produto
        </Button>
      </div>

      <Card>
        <CardContent>
          {lista.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum produto cadastrado ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="w-28">Disponível</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {produto.nome}
                        {produto.destaque && (
                          <Badge variant="secondary">
                            <Star className="size-3" />
                            Destaque
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{produto.categoria?.nome ?? "—"}</TableCell>
                    <TableCell>{formatCents(produto.preco)}</TableCell>
                    <TableCell>
                      <DisponivelSwitch
                        produtoId={produto.id}
                        disponivel={produto.disponivel}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar produto"
                        render={<Link href={`/admin/produtos/${produto.id}`} />}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteButton
                        description={`O produto "${produto.nome}" será excluído permanentemente.`}
                        onDelete={deleteProduto.bind(null, produto.id)}
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
