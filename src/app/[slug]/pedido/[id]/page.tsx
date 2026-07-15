import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pedidos, restaurantes } from "@/db/schema";
import { formatCents } from "@/lib/money";
import { buildMockPixPayload } from "@/lib/pix";
import { OrderStatus } from "@/components/storefront/order-status";
import { PixDisplay } from "@/components/storefront/pix-display";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "Acompanhar pedido | SaborOn" };

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const restaurante = await db.query.restaurantes.findFirst({
    where: and(eq(restaurantes.slug, slug), eq(restaurantes.ativo, true)),
    columns: { id: true, nome: true },
  });
  if (!restaurante) notFound();

  // Busca por UUID (não adivinhável) — suficiente para o MVP sem auth do cliente.
  const pedido = await db.query.pedidos.findFirst({
    where: and(eq(pedidos.id, id), eq(pedidos.restauranteId, restaurante.id)),
    with: {
      itens: { with: { produto: { columns: { nome: true } } } },
    },
  });
  if (!pedido) notFound();

  const mostrarPix =
    pedido.metodoPagamento === "pix" && pedido.status === "recebido";

  return (
    <div className="mx-auto w-full max-w-xl flex-1 space-y-6 px-4 py-8">
      <Link
        href={`/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar ao cardápio
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Acompanhe seu pedido</h1>
        <p className="text-sm text-muted-foreground">
          {restaurante.nome} • Pedido #{pedido.id.slice(0, 8)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderStatus pedidoId={pedido.id} initialStatus={pedido.status} />
        </CardContent>
      </Card>

      {mostrarPix && (
        <PixDisplay payload={buildMockPixPayload(pedido.id, pedido.total)} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {pedido.itens.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.quantidade}x {item.produto?.nome ?? "Item removido"}
                </span>
                <span>
                  {formatCents(item.precoUnitario * item.quantidade)}
                </span>
              </li>
            ))}
          </ul>
          <Separator className="my-3" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCents(pedido.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Taxa de entrega</span>
              <span>{formatCents(pedido.taxaEntrega)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCents(pedido.total)}</span>
            </div>
          </div>
          <Separator className="my-3" />
          <p className="text-sm text-muted-foreground">
            {pedido.tipoEntrega === "delivery"
              ? `Entrega em: ${pedido.enderecoRua}, ${pedido.enderecoNumero} — ${pedido.enderecoBairro}${pedido.enderecoComplemento ? ` (${pedido.enderecoComplemento})` : ""}`
              : "Retirada no local"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
