import { DollarSign, Receipt, ShoppingBag } from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";
import { formatCents } from "@/lib/money";
import { FaturamentoChart } from "@/components/admin/faturamento-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Visão Geral | SaborOn" };

export default async function VisaoGeralPage() {
  const stats = await getDashboardStats();

  const tiles = [
    {
      titulo: "Faturamento de Hoje",
      valor: formatCents(stats.faturamentoHoje),
      descricao: "Pedidos entregues hoje",
      icon: DollarSign,
    },
    {
      titulo: "Total de Pedidos",
      valor: String(stats.pedidosHoje),
      descricao: "Recebidos hoje (todos os status)",
      icon: ShoppingBag,
    },
    {
      titulo: "Ticket Médio",
      valor: formatCents(stats.ticketMedio),
      descricao: "Por pedido entregue hoje",
      icon: Receipt,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold">Visão Geral</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.titulo}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <tile.icon className="size-4" />
                {tile.titulo}
              </CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {tile.valor}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{tile.descricao}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faturamento — Últimos 7 dias</CardTitle>
          <CardDescription>
            Soma dos pedidos entregues por dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FaturamentoChart data={stats.grafico} />
        </CardContent>
      </Card>
    </div>
  );
}
