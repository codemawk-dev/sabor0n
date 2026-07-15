"use server";

import { and, count, eq, gte, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { pedidos } from "@/db/schema";
import { getOwnerRestaurante } from "@/lib/auth";

export interface DashboardStats {
  /** Soma (centavos) dos pedidos entregues hoje. */
  faturamentoHoje: number;
  /** Total de pedidos recebidos hoje (qualquer status) — volume operacional. */
  pedidosHoje: number;
  /** Faturamento de hoje / pedidos entregues hoje (centavos; 0 se não houver). */
  ticketMedio: number;
  /** Últimos 7 dias (inclui hoje): faturamento entregue em reais (decimal), pronto p/ gráfico. */
  grafico: { dia: string; faturamento: number }[];
}

const DIAS_GRAFICO = 7;

function inicioDoDia(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** "seg." -> "Seg" */
function labelDia(date: Date): string {
  const curto = date
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "");
  return curto.charAt(0).toUpperCase() + curto.slice(1);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { restaurante } = await getOwnerRestaurante();

  const hoje = inicioDoDia(new Date());
  const inicioJanela = inicioDoDia(
    new Date(Date.now() - (DIAS_GRAFICO - 1) * 24 * 60 * 60 * 1000)
  );

  const [faturamentoRow, pedidosHojeRow, entreguesHojeRow, vendasPorDia] =
    await Promise.all([
      // 1. Faturamento de hoje (somente pedidos entregues)
      db
        .select({ total: sum(pedidos.total) })
        .from(pedidos)
        .where(
          and(
            eq(pedidos.restauranteId, restaurante.id),
            eq(pedidos.status, "entregue"),
            gte(pedidos.createdAt, hoje)
          )
        ),
      // 2. Volume de pedidos de hoje (qualquer status)
      db
        .select({ qtd: count() })
        .from(pedidos)
        .where(
          and(
            eq(pedidos.restauranteId, restaurante.id),
            gte(pedidos.createdAt, hoje)
          )
        ),
      // 3. Entregues hoje (denominador do ticket médio)
      db
        .select({ qtd: count() })
        .from(pedidos)
        .where(
          and(
            eq(pedidos.restauranteId, restaurante.id),
            eq(pedidos.status, "entregue"),
            gte(pedidos.createdAt, hoje)
          )
        ),
      // 4. Agregação por dia dos últimos 7 dias (somente entregues)
      db
        .select({
          dia: sql<string>`(${pedidos.createdAt})::date`,
          total: sum(pedidos.total),
        })
        .from(pedidos)
        .where(
          and(
            eq(pedidos.restauranteId, restaurante.id),
            eq(pedidos.status, "entregue"),
            gte(pedidos.createdAt, inicioJanela)
          )
        )
        .groupBy(sql`(${pedidos.createdAt})::date`),
    ]);

  const faturamentoHoje = Number(faturamentoRow[0]?.total ?? 0);
  const pedidosHoje = pedidosHojeRow[0]?.qtd ?? 0;
  const entreguesHoje = entreguesHojeRow[0]?.qtd ?? 0;
  const ticketMedio =
    entreguesHoje > 0 ? Math.round(faturamentoHoje / entreguesHoje) : 0;

  // Indexa a agregação por data ISO (YYYY-MM-DD) e preenche dias sem venda com 0.
  const porData = new Map(
    vendasPorDia.map((v) => [v.dia, Number(v.total ?? 0)])
  );
  const grafico = Array.from({ length: DIAS_GRAFICO }, (_, i) => {
    const data = new Date(inicioJanela);
    data.setDate(data.getDate() + i);
    const chaveIso = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
    return {
      dia: labelDia(data),
      // Formato amigável para o gráfico: reais em decimal (exceção de exibição)
      faturamento: (porData.get(chaveIso) ?? 0) / 100,
    };
  });

  return { faturamentoHoje, pedidosHoje, ticketMedio, grafico };
}
