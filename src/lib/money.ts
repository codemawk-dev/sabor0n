/**
 * Todos os valores monetários no banco estão em CENTAVOS (inteiros).
 * A conversão para reais acontece exclusivamente aqui, na camada de UI.
 */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Converte uma string digitada pelo lojista ("25,90" ou "25.90") em centavos. */
export function parseReaisToCents(value: string): number {
  // Com vírgula: "1.234,56" → ponto é separador de milhar.
  // Sem vírgula: "25.90" → ponto é decimal.
  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".")
    : value;
  return Math.round(parseFloat(normalized) * 100);
}
