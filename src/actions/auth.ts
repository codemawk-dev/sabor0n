"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { restaurantes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { parseReaisToCents } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, restauranteSchema, type LoginInput, type RestauranteInput } from "@/validators";

export async function login(data: LoginInput): Promise<{ error?: string }> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "E-mail ou senha incorretos" };
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createRestaurante(
  data: RestauranteInput
): Promise<{ error?: string }> {
  const parsed = restauranteSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos" };

  const user = await getSessionUser();

  const existente = await db.query.restaurantes.findFirst({
    where: eq(restaurantes.ownerId, user.id),
  });
  if (existente) return { error: "Você já possui um restaurante cadastrado" };

  const slugEmUso = await db.query.restaurantes.findFirst({
    where: eq(restaurantes.slug, parsed.data.slug),
  });
  if (slugEmUso) return { error: "Este slug já está em uso, escolha outro" };

  await db.insert(restaurantes).values({
    nome: parsed.data.nome,
    slug: parsed.data.slug,
    telefone: parsed.data.telefone,
    taxaEntrega: parseReaisToCents(parsed.data.taxaEntregaReais),
    tempoEntregaEstimado: parsed.data.tempoEntregaEstimado || null,
    ownerId: user.id,
  });

  redirect("/admin");
}
