"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  faturamento: {
    label: "Faturamento",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function FaturamentoChart({
  data,
}: {
  data: { dia: string; faturamento: number }[];
}) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="dia"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <span className="font-mono font-medium">
                  {brl.format(Number(value))}
                </span>
              )}
            />
          }
        />
        <Bar
          dataKey="faturamento"
          fill="var(--color-faturamento)"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ChartContainer>
  );
}
