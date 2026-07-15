import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pedidos } from "@/db/schema";
import { getOwnerRestaurante } from "@/lib/auth";
import { KanbanBoard, type PedidoKanban } from "@/components/admin/kanban-board";

export const metadata = { title: "Pedidos | SaborOn" };

export default async function PedidosPage() {
  const { restaurante } = await getOwnerRestaurante();

  const lista = await db.query.pedidos.findMany({
    where: eq(pedidos.restauranteId, restaurante.id),
    orderBy: [desc(pedidos.createdAt)],
    limit: 200,
  });

  const initialPedidos: PedidoKanban[] = lista.map((p) => ({
    id: p.id,
    clienteNome: p.clienteNome,
    clienteTelefone: p.clienteTelefone,
    status: p.status,
    tipoEntrega: p.tipoEntrega,
    total: p.total,
    metodoPagamento: p.metodoPagamento,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pedidos</h1>
      <KanbanBoard
        restauranteId={restaurante.id}
        initialPedidos={initialPedidos}
      />
    </div>
  );
}
