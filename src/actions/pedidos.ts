"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  itensPedido,
  movimentacoesCaixa,
  pedidos,
  produtos,
  restaurantes,
} from "@/db/schema";
import { getOwnerRestaurante } from "@/lib/auth";
import { getCaixaAberto, isDentroDoHorario } from "@/lib/caixa";
import { buildMockPixPayload } from "@/lib/pix";
import {
  cartItemsSchema,
  checkoutSchema,
  statusPedidoSchema,
  type CartItemInput,
  type CheckoutInput,
  type StatusPedido,
} from "@/validators";

// ------------------------------------------------------------
// PÚBLICO — checkout do cliente
// ------------------------------------------------------------
export async function createPedido(
  slug: string,
  data: CheckoutInput,
  itens: CartItemInput[]
): Promise<{ pedidoId: string; pixPayload: string } | { error: string }> {
  const parsedCheckout = checkoutSchema.safeParse(data);
  if (!parsedCheckout.success) return { error: "Dados do pedido inválidos" };

  const parsedItens = cartItemsSchema.safeParse(itens);
  if (!parsedItens.success) return { error: "O carrinho está vazio ou inválido" };

  const restaurante = await db.query.restaurantes.findFirst({
    where: and(eq(restaurantes.slug, slug), eq(restaurantes.ativo, true)),
  });
  if (!restaurante) return { error: "Restaurante não encontrado" };

  // Trava de segurança no servidor (dupla validação):
  // caixa do PDV aberto E horário atual dentro de um turno de funcionamento.
  const [caixaAtivo, dentroDoHorario] = await Promise.all([
    getCaixaAberto(restaurante.id),
    isDentroDoHorario(restaurante),
  ]);
  if (!caixaAtivo || !dentroDoHorario) {
    return {
      error:
        "O restaurante está fechado no momento e não pode receber pedidos.",
    };
  }

  const checkout = parsedCheckout.data;

  // Recomputa TODOS os valores no servidor — nunca confiar em preços do cliente.
  const idsProdutos = parsedItens.data.map((i) => i.produtoId);
  const produtosDb = await db.query.produtos.findMany({
    where: and(
      inArray(produtos.id, idsProdutos),
      eq(produtos.restauranteId, restaurante.id),
      eq(produtos.disponivel, true)
    ),
  });

  const porId = new Map(produtosDb.map((p) => [p.id, p]));
  if (porId.size !== idsProdutos.length) {
    return {
      error:
        "Alguns itens do carrinho não estão mais disponíveis. Atualize a página e tente novamente.",
    };
  }

  const subtotal = parsedItens.data.reduce(
    (acc, item) => acc + porId.get(item.produtoId)!.preco * item.quantidade,
    0
  );
  const taxaEntrega =
    checkout.tipoEntrega === "delivery" ? restaurante.taxaEntrega : 0;
  const total = subtotal + taxaEntrega;

  const pedidoId = await db.transaction(async (tx) => {
    const [pedido] = await tx
      .insert(pedidos)
      .values({
        restauranteId: restaurante.id,
        clienteNome: checkout.clienteNome,
        clienteTelefone: checkout.clienteTelefone,
        tipoEntrega: checkout.tipoEntrega,
        enderecoRua:
          checkout.tipoEntrega === "delivery" ? checkout.enderecoRua : null,
        enderecoNumero:
          checkout.tipoEntrega === "delivery" ? checkout.enderecoNumero : null,
        enderecoBairro:
          checkout.tipoEntrega === "delivery" ? checkout.enderecoBairro : null,
        enderecoComplemento:
          checkout.tipoEntrega === "delivery"
            ? checkout.enderecoComplemento || null
            : null,
        subtotal,
        taxaEntrega,
        total,
        metodoPagamento: checkout.metodoPagamento,
      })
      .returning();

    await tx.insert(itensPedido).values(
      parsedItens.data.map((item) => ({
        pedidoId: pedido.id,
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: porId.get(item.produtoId)!.preco,
      }))
    );

    // Automação financeira: toda venda da loja entra no caixa ativo
    // na mesma transação do pedido (tudo ou nada).
    await tx.insert(movimentacoesCaixa).values({
      caixaId: caixaAtivo.id,
      tipo: "venda",
      valor: total,
      motivo: `Venda automática - Pedido #${pedido.id.slice(0, 8)}`,
    });

    return pedido.id;
  });

  return { pedidoId, pixPayload: buildMockPixPayload(pedidoId, total) };
}

// ------------------------------------------------------------
// PÚBLICO — polling do acompanhamento (busca por UUID, sem auth)
// ------------------------------------------------------------
export async function getPedidoStatus(pedidoId: string) {
  const pedido = await db.query.pedidos.findFirst({
    where: eq(pedidos.id, pedidoId),
    columns: { id: true, status: true },
  });
  return pedido ?? null;
}

// ------------------------------------------------------------
// OWNER — Kanban
// ------------------------------------------------------------
export async function updatePedidoStatus(
  pedidoId: string,
  status: StatusPedido
): Promise<{ error?: string }> {
  const parsed = statusPedidoSchema.safeParse(status);
  if (!parsed.success) return { error: "Status inválido" };

  const { restaurante } = await getOwnerRestaurante();

  const [atualizado] = await db
    .update(pedidos)
    .set({ status: parsed.data })
    .where(
      and(eq(pedidos.id, pedidoId), eq(pedidos.restauranteId, restaurante.id))
    )
    .returning();

  if (!atualizado) return { error: "Pedido não encontrado" };

  revalidatePath("/admin/pedidos");
  return {};
}

export async function getPedidoDetalhes(pedidoId: string) {
  const { restaurante } = await getOwnerRestaurante();

  const pedido = await db.query.pedidos.findFirst({
    where: and(
      eq(pedidos.id, pedidoId),
      eq(pedidos.restauranteId, restaurante.id)
    ),
    with: {
      itens: { with: { produto: { columns: { nome: true } } } },
    },
  });
  return pedido ?? null;
}
