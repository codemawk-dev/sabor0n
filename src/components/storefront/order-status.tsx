"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChefHat,
  CircleX,
  Inbox,
  PackageCheck,
  Truck,
} from "lucide-react";
import { getPedidoStatus } from "@/actions/pedidos";
import { cn } from "@/lib/utils";
import type { StatusPedido } from "@/validators";

const ETAPAS: { status: StatusPedido; label: string; icon: typeof Inbox }[] = [
  { status: "recebido", label: "Pedido recebido", icon: Inbox },
  { status: "preparando", label: "Em preparo", icon: ChefHat },
  { status: "a_caminho", label: "A caminho", icon: Truck },
  { status: "entregue", label: "Entregue", icon: PackageCheck },
];

const POLL_INTERVAL_MS = 10_000;

export function OrderStatus({
  pedidoId,
  initialStatus,
}: {
  pedidoId: string;
  initialStatus: StatusPedido;
}) {
  const [status, setStatus] = useState<StatusPedido>(initialStatus);

  useEffect(() => {
    // Pedido finalizado não precisa mais de polling.
    if (status === "entregue" || status === "cancelado") return;

    const interval = setInterval(async () => {
      try {
        const pedido = await getPedidoStatus(pedidoId);
        if (pedido) setStatus(pedido.status);
      } catch {
        // Falha de rede no polling é silenciosa; a próxima tentativa recupera.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [pedidoId, status]);

  if (status === "cancelado") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <CircleX className="size-6 text-destructive" />
        <div>
          <p className="font-semibold text-destructive">Pedido cancelado</p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com o restaurante para mais informações.
          </p>
        </div>
      </div>
    );
  }

  const indiceAtual = ETAPAS.findIndex((e) => e.status === status);

  return (
    <ol className="space-y-0">
      {ETAPAS.map((etapa, i) => {
        const concluida = i < indiceAtual;
        const atual = i === indiceAtual;
        const Icon = etapa.icon;

        return (
          <li key={etapa.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2",
                  concluida && "border-primary bg-primary text-primary-foreground",
                  atual && "border-primary text-primary animate-pulse",
                  !concluida && !atual && "border-muted-foreground/30 text-muted-foreground/50"
                )}
              >
                {concluida ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>
              {i < ETAPAS.length - 1 && (
                <div
                  className={cn(
                    "h-8 w-0.5",
                    concluida ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
            <p
              className={cn(
                "pt-1.5 text-sm",
                atual && "font-semibold",
                !concluida && !atual && "text-muted-foreground/60"
              )}
            >
              {etapa.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
