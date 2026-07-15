"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { horariosFuncionamento, restaurantes } from "@/db/schema";
import { getOwnerRestaurante } from "@/lib/auth";
import {
  estabelecimentoSchema,
  horariosFuncionamentoSchema,
  type EstabelecimentoInput,
  type HorariosFuncionamentoInput,
} from "@/validators";

type ActionResult = { error?: string };

export async function updateEstabelecimento(
  data: EstabelecimentoInput
): Promise<ActionResult> {
  const parsed = estabelecimentoSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { restaurante } = await getOwnerRestaurante();

  // Slug precisa continuar único entre os tenants.
  if (parsed.data.slug !== restaurante.slug) {
    const slugEmUso = await db.query.restaurantes.findFirst({
      where: and(
        eq(restaurantes.slug, parsed.data.slug),
        ne(restaurantes.id, restaurante.id)
      ),
      columns: { id: true },
    });
    if (slugEmUso) return { error: "Este slug já está em uso, escolha outro" };
  }

  const d = parsed.data;
  await db
    .update(restaurantes)
    .set({
      nome: d.nome,
      slug: d.slug,
      descricao: d.descricao || null,
      cnpjCpf: d.cnpjCpf || null,
      endereco: d.endereco || null,
      whatsapp: d.whatsapp || null,
      whatsappMensagem: d.whatsappMensagem || null,
      instagram: d.instagram || null,
      facebook: d.facebook || null,
      tiktok: d.tiktok || null,
      linkedin: d.linkedin || null,
      fotosDaLoja: d.fotosDaLoja?.length ? d.fotosDaLoja : null,
    })
    .where(eq(restaurantes.id, restaurante.id));

  revalidatePath("/admin/configuracoes");
  revalidatePath(`/${restaurante.slug}`);
  if (d.slug !== restaurante.slug) revalidatePath(`/${d.slug}`);
  return {};
}

export async function saveHorariosFuncionamento(
  data: HorariosFuncionamentoInput
): Promise<ActionResult> {
  const parsed = horariosFuncionamentoSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Horários inválidos" };
  }

  const { restaurante } = await getOwnerRestaurante();

  // Uma linha por turno; dia fechado vira uma única linha isAberto=false.
  const linhas = parsed.data.dias.flatMap((dia) =>
    dia.isAberto
      ? dia.turnos.map((turno) => ({
          restauranteId: restaurante.id,
          diaSemana: dia.diaSemana,
          isAberto: true,
          abertura: turno.abertura,
          fechamento: turno.fechamento,
        }))
      : [
          {
            restauranteId: restaurante.id,
            diaSemana: dia.diaSemana,
            isAberto: false,
            abertura: "00:00",
            fechamento: "23:59",
          },
        ]
  );

  // Substituição atômica da grade: remove a antiga e insere a nova.
  await db.transaction(async (tx) => {
    await tx
      .delete(horariosFuncionamento)
      .where(eq(horariosFuncionamento.restauranteId, restaurante.id));
    await tx.insert(horariosFuncionamento).values(linhas);
    await tx
      .update(restaurantes)
      .set({ fusoHorario: parsed.data.fusoHorario })
      .where(eq(restaurantes.id, restaurante.id));
  });

  revalidatePath("/admin/configuracoes");
  revalidatePath(`/${restaurante.slug}`);
  return {};
}
