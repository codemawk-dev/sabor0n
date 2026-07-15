import "server-only";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { restaurantes } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

/**
 * Pedra angular do multi-tenancy: todo Server Action / página do admin
 * deriva o restauranteId daqui — nunca de input do cliente.
 */
export async function getOwnerRestaurante() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const restaurante = await db.query.restaurantes.findFirst({
    where: eq(restaurantes.ownerId, user.id),
  });

  if (!restaurante) redirect("/admin/onboarding");

  return { user, restaurante };
}

/** Variante que não redireciona para onboarding (usada no próprio onboarding). */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  return user;
}
