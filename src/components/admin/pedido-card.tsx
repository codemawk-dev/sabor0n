"use client";

import { useState, useTransition } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getPedidoDetalhes } from "@/actions/pedidos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { PedidoKanban } from "./kanban-board";

type Detalhes = NonNullable<Awaited<ReturnType<typeof getPedidoDetalhes>>>;

const METODO_LABEL: Record<string, string> = {
  pix: "PIX",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

export function PedidoCard({
  pedido,
  isPending,
}: {
  pedido: PedidoKanban;
  isPending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: pedido.id });

  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [detalhes, setDetalhes] = useState<Detalhes | null>(null);
  const [carregando, startTransition] = useTransition();

  function abrirDetalhes() {
    setDetalhesOpen(true);
    if (detalhes) return;
    startTransition(async () => {
      const resultado = await getPedidoDetalhes(pedido.id);
      if (!resultado) {
        toast.error("Não foi possível carregar os detalhes do pedido");
        setDetalhesOpen(false);
        return;
      }
      setDetalhes(resultado);
    });
  }

  const hora = new Date(pedido.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Card
        ref={setNodeRef}
        style={
          transform
            ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
            : undefined
        }
        className={cn(
          "cursor-grab py-0 active:cursor-grabbing",
          isDragging && "z-50 opacity-80 shadow-lg",
          isPending && "opacity-60"
        )}
        {...listeners}
        {...attributes}
      >
        <CardContent className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">{pedido.clienteNome}</p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {hora}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="outline">
              {pedido.tipoEntrega === "delivery" ? "Entrega" : "Retirada"}
            </Badge>
            <Badge variant="outline">
              {METODO_LABEL[pedido.metodoPagamento] ?? pedido.metodoPagamento}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">
              {formatCents(pedido.total)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Ver detalhes"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={abrirDetalhes}
            >
              <Eye className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detalhesOpen} onOpenChange={setDetalhesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pedido #{pedido.id.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {carregando || !detalhes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold">{detalhes.clienteNome}</p>
                <p className="text-muted-foreground">
                  {detalhes.clienteTelefone}
                </p>
              </div>
              <Separator />
              <ul className="space-y-1">
                {detalhes.itens.map((item) => (
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
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCents(detalhes.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxa de entrega</span>
                  <span>{formatCents(detalhes.taxaEntrega)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCents(detalhes.total)}</span>
                </div>
              </div>
              <Separator />
              <p className="text-muted-foreground">
                {detalhes.tipoEntrega === "delivery"
                  ? `Entrega: ${detalhes.enderecoRua}, ${detalhes.enderecoNumero} — ${detalhes.enderecoBairro}${detalhes.enderecoComplemento ? ` (${detalhes.enderecoComplemento})` : ""}`
                  : "Retirada no local"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
