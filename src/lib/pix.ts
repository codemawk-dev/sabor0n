/**
 * Gera um payload PIX "copia e cola" FICTÍCIO (estrutura EMV-like).
 * Não é escaneável por bancos reais — serve apenas para a estrutura
 * do fluxo de pagamento na Fase 1. Determinístico por pedido, então
 * pode ser reconstruído em qualquer tela a partir do pedido.
 */
export function buildMockPixPayload(
  pedidoId: string,
  totalCents: number
): string {
  const valor = (totalCents / 100).toFixed(2);
  const chave = pedidoId.replace(/-/g, "");
  return (
    `00020126580014BR.GOV.BCB.PIX0136${chave}` +
    `52040000530398654${String(valor.length).padStart(2, "0")}${valor}` +
    `5802BR5912SABORON DEMO6009SAO PAULO62070503***6304ABCD`
  );
}
