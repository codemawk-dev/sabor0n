"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { categorias, produtos } from "@/db/schema";
import { getOwnerRestaurante } from "@/lib/auth";
import {
  produtoSchema,
  produtoToDbValues,
  type ProdutoInput,
} from "@/validators";

type ActionResult = { error?: string };

/** Garante que a categoria enviada pertence ao restaurante do lojista. */
async function validarCategoria(categoriaId: string, restauranteId: string) {
  return db.query.categorias.findFirst({
    where: and(
      eq(categorias.id, categoriaId),
      eq(categorias.restauranteId, restauranteId)
    ),
  });
}

export async function createProduto(data: ProdutoInput): Promise<ActionResult> {
  const parsed = produtoSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos" };

  const { restaurante } = await getOwnerRestaurante();

  const categoria = await validarCategoria(
    parsed.data.categoriaId,
    restaurante.id
  );
  if (!categoria) return { error: "Categoria inválida" };

  await db.insert(produtos).values({
    restauranteId: restaurante.id,
    ...produtoToDbValues(parsed.data),
  });

  revalidatePath("/admin/produtos");
  revalidatePath(`/${restaurante.slug}`);
  return {};
}

export async function updateProduto(
  id: string,
  data: ProdutoInput
): Promise<ActionResult> {
  const parsed = produtoSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos" };

  const { restaurante } = await getOwnerRestaurante();

  const categoria = await validarCategoria(
    parsed.data.categoriaId,
    restaurante.id
  );
  if (!categoria) return { error: "Categoria inválida" };

  const [atualizado] = await db
    .update(produtos)
    .set(produtoToDbValues(parsed.data))
    .where(
      and(eq(produtos.id, id), eq(produtos.restauranteId, restaurante.id))
    )
    .returning();

  if (!atualizado) return { error: "Produto não encontrado" };

  revalidatePath("/admin/produtos");
  revalidatePath(`/${restaurante.slug}`);
  return {};
}

export async function toggleDisponivel(
  id: string,
  disponivel: boolean
): Promise<ActionResult> {
  const { restaurante } = await getOwnerRestaurante();

  const [atualizado] = await db
    .update(produtos)
    .set({ disponivel })
    .where(
      and(eq(produtos.id, id), eq(produtos.restauranteId, restaurante.id))
    )
    .returning();

  if (!atualizado) return { error: "Produto não encontrado" };

  revalidatePath("/admin/produtos");
  revalidatePath(`/${restaurante.slug}`);
  return {};
}

export async function deleteProduto(id: string): Promise<ActionResult> {
  const { restaurante } = await getOwnerRestaurante();

  const [removido] = await db
    .delete(produtos)
    .where(
      and(eq(produtos.id, id), eq(produtos.restauranteId, restaurante.id))
    )
    .returning();

  if (!removido) return { error: "Produto não encontrado" };

  revalidatePath("/admin/produtos");
  revalidatePath(`/${restaurante.slug}`);
  return {};
}
