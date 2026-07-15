"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { categorias } from "@/db/schema";
import { getOwnerRestaurante } from "@/lib/auth";
import { categoriaSchema, type CategoriaInput } from "@/validators";

type ActionResult = { error?: string };

export async function createCategoria(
  data: CategoriaInput
): Promise<ActionResult> {
  const parsed = categoriaSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos" };

  const { restaurante } = await getOwnerRestaurante();

  await db.insert(categorias).values({
    restauranteId: restaurante.id,
    nome: parsed.data.nome,
    ordem: parsed.data.ordem,
  });

  revalidatePath("/admin/categorias");
  revalidatePath(`/${restaurante.slug}`);
  return {};
}

export async function updateCategoria(
  id: string,
  data: CategoriaInput
): Promise<ActionResult> {
  const parsed = categoriaSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos" };

  const { restaurante } = await getOwnerRestaurante();

  const [atualizada] = await db
    .update(categorias)
    .set({ nome: parsed.data.nome, ordem: parsed.data.ordem })
    .where(
      and(eq(categorias.id, id), eq(categorias.restauranteId, restaurante.id))
    )
    .returning();

  if (!atualizada) return { error: "Categoria não encontrada" };

  revalidatePath("/admin/categorias");
  revalidatePath(`/${restaurante.slug}`);
  return {};
}

export async function deleteCategoria(id: string): Promise<ActionResult> {
  const { restaurante } = await getOwnerRestaurante();

  const [removida] = await db
    .delete(categorias)
    .where(
      and(eq(categorias.id, id), eq(categorias.restauranteId, restaurante.id))
    )
    .returning();

  if (!removida) return { error: "Categoria não encontrada" };

  revalidatePath("/admin/categorias");
  revalidatePath("/admin/produtos");
  revalidatePath(`/${restaurante.slug}`);
  return {};
}
