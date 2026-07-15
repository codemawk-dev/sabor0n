"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { caixas, movimentacoesCaixa } from "@/db/schema";
import { getOwnerRestaurante } from "@/lib/auth";
import {
  abrirCaixaSchema,
  fecharCaixaSchema,
  movimentacaoSchema,
} from "@/validators";

type ActionResult = { error?: string };

/** Retorna a sessão de caixa aberta do restaurante, se houver. */
async function findCaixaAberto(restauranteId: string) {
  return db.query.caixas.findFirst({
    where: and(
      eq(caixas.restauranteId, restauranteId),
      eq(caixas.status, "aberto")
    ),
    orderBy: [desc(caixas.abertoEm)],
  });
}

export async function abrirCaixa(valorAbertura: number): Promise<ActionResult> {
  const parsed = abrirCaixaSchema.safeParse({ valorAbertura });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Valor inválido" };
  }

  const { restaurante } = await getOwnerRestaurante();

  const jaAberto = await findCaixaAberto(restaurante.id);
  if (jaAberto) {
    return { error: "Já existe um caixa aberto. Feche-o antes de abrir outro." };
  }

  await db.insert(caixas).values({
    restauranteId: restaurante.id,
    status: "aberto",
    valorAbertura: parsed.data.valorAbertura,
  });

  revalidatePath("/admin/caixa");
  revalidatePath(`/${restaurante.slug}`);
  return {};
}

export async function fecharCaixa(
  valorFechamento: number
): Promise<ActionResult> {
  const parsed = fecharCaixaSchema.safeParse({ valorFechamento });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Valor inválido" };
  }

  const { restaurante } = await getOwnerRestaurante();

  const caixaAberto = await findCaixaAberto(restaurante.id);
  if (!caixaAberto) {
    return { error: "Não há caixa aberto para fechar." };
  }

  await db
    .update(caixas)
    .set({
      status: "fechado",
      valorFechamento: parsed.data.valorFechamento,
      fechadoEm: new Date(),
    })
    .where(eq(caixas.id, caixaAberto.id));

  revalidatePath("/admin/caixa");
  revalidatePath(`/${restaurante.slug}`);
  return {};
}

export async function adicionarMovimentacao(
  tipo: "suprimento" | "sangria",
  valor: number,
  motivo: string
): Promise<ActionResult> {
  const parsed = movimentacaoSchema.safeParse({ tipo, valor, motivo });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { restaurante } = await getOwnerRestaurante();

  const caixaAberto = await findCaixaAberto(restaurante.id);
  if (!caixaAberto) {
    return { error: "Abra o caixa antes de registrar movimentações." };
  }

  await db.insert(movimentacoesCaixa).values({
    caixaId: caixaAberto.id,
    tipo: parsed.data.tipo,
    valor: parsed.data.valor,
    motivo: parsed.data.motivo,
  });

  revalidatePath("/admin/caixa");
  return {};
}
