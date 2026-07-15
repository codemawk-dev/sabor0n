"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { updatePedidoStatus } from "@/actions/pedidos";
import { PedidoCard } from "@/components/admin/pedido-card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { StatusPedido } from "@/validators";

export interface PedidoKanban {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  status: StatusPedido;
  tipoEntrega: string;
  total: number;
  metodoPagamento: string;
  createdAt: string;
}

const COLUNAS: { status: StatusPedido; titulo: string; cor: string }[] = [
  { status: "recebido", titulo: "Recebidos", cor: "bg-blue-500" },
  { status: "preparando", titulo: "Preparando", cor: "bg-amber-500" },
  { status: "a_caminho", titulo: "A Caminho", cor: "bg-purple-500" },
  { status: "entregue", titulo: "Entregues", cor: "bg-green-500" },
  { status: "cancelado", titulo: "Cancelados", cor: "bg-red-500" },
];

/** Linha da tabela pedidos como chega do Realtime (snake_case). */
interface PedidoRow {
  id: string;
  cliente_nome: string;
  cliente_telefone: string;
  status: StatusPedido;
  tipo_entrega: string;
  total: number;
  metodo_pagamento: string;
  created_at: string;
}

function rowToPedido(row: PedidoRow): PedidoKanban {
  return {
    id: row.id,
    clienteNome: row.cliente_nome,
    clienteTelefone: row.cliente_telefone,
    status: row.status,
    tipoEntrega: row.tipo_entrega,
    total: row.total,
    metodoPagamento: row.metodo_pagamento,
    createdAt: row.created_at,
  };
}

export function KanbanBoard({
  restauranteId,
  initialPedidos,
}: {
  restauranteId: string;
  initialPedidos: PedidoKanban[];
}) {
  // Fonte única de verdade: Map por id. Eventos realtime e updates
  // otimistas fazem upsert por id — idempotente, sem duplicação.
  const [pedidos, setPedidos] = useState<Map<string, PedidoKanban>>(
    () => new Map(initialPedidos.map((p) => [p.id, p]))
  );
  // Ids com update otimista em voo: ecos do realtime são ignorados.
  // Estado para renderizar + ref espelho para os callbacks do realtime.
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const pendingIdsRef = useRef(pendingIds);

  function setPending(pedidoId: string, pending: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(pedidoId);
      else next.delete(pedidoId);
      pendingIdsRef.current = next;
      return next;
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function upsert(pedido: PedidoKanban) {
    setPedidos((prev) => {
      const next = new Map(prev);
      next.set(pedido.id, pedido);
      return next;
    });
  }

  // ----------------------------------------------------------
  // Realtime: novos pedidos e mudanças de status
  // ----------------------------------------------------------
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`pedidos-${restauranteId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pedidos",
          filter: `restaurante_id=eq.${restauranteId}`,
        },
        (payload) => {
          upsert(rowToPedido(payload.new as PedidoRow));
          toast.success("Novo pedido recebido! 🔔");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `restaurante_id=eq.${restauranteId}`,
        },
        (payload) => {
          const row = payload.new as PedidoRow;
          // Eco da nossa própria mudança otimista em voo — ignora.
          if (pendingIdsRef.current.has(row.id)) return;
          upsert(rowToPedido(row));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restauranteId]);

  // ----------------------------------------------------------
  // Drag and drop com update otimista + rollback
  // ----------------------------------------------------------
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const pedidoId = String(active.id);
    const novoStatus = over.id as StatusPedido;
    const pedido = pedidos.get(pedidoId);
    if (!pedido || pedido.status === novoStatus) return;

    const statusAnterior = pedido.status;

    // Otimista: move o card imediatamente.
    upsert({ ...pedido, status: novoStatus });
    setPending(pedidoId, true);

    updatePedidoStatus(pedidoId, novoStatus)
      .then((result) => {
        if (result?.error) {
          // Rollback: devolve o card à coluna original.
          upsert({ ...pedido, status: statusAnterior });
          toast.error(`Falha ao mover pedido: ${result.error}`);
        }
      })
      .catch(() => {
        upsert({ ...pedido, status: statusAnterior });
        toast.error("Falha ao mover pedido. Verifique sua conexão.");
      })
      .finally(() => {
        setPending(pedidoId, false);
      });
  }

  const listaOrdenada = useMemo(
    () =>
      [...pedidos.values()].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [pedidos]
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUNAS.map((coluna) => (
          <KanbanColumn
            key={coluna.status}
            coluna={coluna}
            pedidos={listaOrdenada.filter((p) => p.status === coluna.status)}
            pendingIds={pendingIds}
          />
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({
  coluna,
  pedidos,
  pendingIds,
}: {
  coluna: (typeof COLUNAS)[number];
  pedidos: PedidoKanban[];
  pendingIds: Set<string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-2 rounded-lg border bg-background p-3 transition-colors",
        isOver && "border-primary bg-primary/5"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", coluna.cor)} />
        <h2 className="text-sm font-semibold">{coluna.titulo}</h2>
        <Badge variant="secondary" className="ml-auto">
          {pedidos.length}
        </Badge>
      </div>
      <div className="flex min-h-24 flex-col gap-2">
        {pedidos.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Nenhum pedido
          </p>
        ) : (
          pedidos.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              isPending={pendingIds.has(pedido.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
