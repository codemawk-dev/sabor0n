import { z } from "zod";
import { statusPedidoEnum } from "@/db/schema";
import { parseReaisToCents } from "@/lib/money";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const precoReais = z
  .string()
  .min(1, "Informe o preço")
  .regex(/^\d{1,6}([.,]\d{1,2})?$/, "Preço inválido (ex: 25,90)");

const telefoneBr = z
  .string()
  .min(10, "Telefone inválido")
  .regex(/^[\d\s()+-]{10,20}$/, "Telefone inválido");

// ------------------------------------------------------------
// Auth / Restaurante
// ------------------------------------------------------------
export const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const restauranteSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  slug: z
    .string()
    .min(3, "Slug muito curto")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  telefone: telefoneBr,
  taxaEntregaReais: precoReais,
  tempoEntregaEstimado: z.string().optional(),
});
export type RestauranteInput = z.infer<typeof restauranteSchema>;

// ------------------------------------------------------------
// Cardápio (admin)
// ------------------------------------------------------------
export const categoriaSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  ordem: z.number().int().min(0, "Ordem inválida"),
});
export type CategoriaInput = z.infer<typeof categoriaSchema>;

export const produtoSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  descricao: z.string().optional(),
  precoReais,
  categoriaId: z.uuid("Selecione uma categoria"),
  imagemUrl: z.url("URL inválida").optional().or(z.literal("")),
  disponivel: z.boolean(),
  destaque: z.boolean(),
});
export type ProdutoInput = z.infer<typeof produtoSchema>;

/** Converte o input do formulário em valores prontos para o banco (centavos). */
export function produtoToDbValues(data: ProdutoInput) {
  return {
    nome: data.nome,
    descricao: data.descricao || null,
    preco: parseReaisToCents(data.precoReais),
    categoriaId: data.categoriaId,
    imagemUrl: data.imagemUrl || null,
    disponivel: data.disponivel,
    destaque: data.destaque,
  };
}

// ------------------------------------------------------------
// Checkout (loja)
// ------------------------------------------------------------
const checkoutBase = {
  clienteNome: z.string().min(3, "Informe seu nome completo"),
  clienteTelefone: telefoneBr,
  metodoPagamento: z.enum(["pix", "cartao", "dinheiro"], {
    message: "Selecione o método de pagamento",
  }),
};

export const checkoutSchema = z.discriminatedUnion("tipoEntrega", [
  z.object({
    ...checkoutBase,
    tipoEntrega: z.literal("delivery"),
    enderecoRua: z.string().min(3, "Informe a rua"),
    enderecoNumero: z.string().min(1, "Informe o número"),
    enderecoBairro: z.string().min(2, "Informe o bairro"),
    enderecoComplemento: z.string().optional(),
  }),
  z.object({
    ...checkoutBase,
    tipoEntrega: z.literal("retirada"),
  }),
]);
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartItemSchema = z.object({
  produtoId: z.uuid(),
  quantidade: z.number().int().min(1).max(50),
});
export const cartItemsSchema = z
  .array(cartItemSchema)
  .min(1, "O carrinho está vazio");
export type CartItemInput = z.infer<typeof cartItemSchema>;

// ------------------------------------------------------------
// Pedidos (admin)
// ------------------------------------------------------------
export const statusPedidoSchema = z.enum(statusPedidoEnum.enumValues);
export type StatusPedido = z.infer<typeof statusPedidoSchema>;

// ------------------------------------------------------------
// Caixa (PDV) — valores sempre em CENTAVOS (inteiros)
// ------------------------------------------------------------
const valorCentavos = z
  .number("Valor inválido")
  .int("Valor deve estar em centavos (inteiro)")
  .min(0, "O valor não pode ser negativo")
  .max(100_000_000, "Valor acima do limite permitido"); // R$ 1.000.000,00

export const abrirCaixaSchema = z.object({
  valorAbertura: valorCentavos,
});
export type AbrirCaixaInput = z.infer<typeof abrirCaixaSchema>;

export const fecharCaixaSchema = z.object({
  valorFechamento: valorCentavos,
});
export type FecharCaixaInput = z.infer<typeof fecharCaixaSchema>;

export const movimentacaoSchema = z.object({
  tipo: z.enum(["suprimento", "sangria"], {
    message: "Selecione o tipo de movimentação",
  }),
  valor: valorCentavos.min(1, "Informe um valor maior que zero"),
  motivo: z
    .string()
    .min(3, "Descreva o motivo (mínimo 3 caracteres)")
    .max(200, "Motivo muito longo"),
});
export type MovimentacaoInput = z.infer<typeof movimentacaoSchema>;

/** Formulários do caixa digitam em reais ("100,00"); a conversão ocorre no submit. */
export const valorReaisFormSchema = z.object({
  valorReais: precoReais,
});
export type ValorReaisForm = z.infer<typeof valorReaisFormSchema>;

// ------------------------------------------------------------
// Configurações — Estabelecimento (perfil e redes)
// ------------------------------------------------------------
const campoOpcional = z.string().max(200, "Texto muito longo").optional();

export const estabelecimentoSchema = z.object({
  nome: z.string().min(2, "Nome muito curto").max(100),
  slug: z
    .string()
    .min(3, "Slug muito curto")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  descricao: z.string().max(300, "Máximo de 300 caracteres").optional(),
  cnpjCpf: z
    .string()
    .regex(/^[\d.\-\/]*$/, "Use apenas números, pontos, traços e barras")
    .max(20, "CPF/CNPJ inválido")
    .optional()
    .or(z.literal("")),
  endereco: campoOpcional,
  whatsapp: z
    .string()
    .regex(/^[\d\s()+-]*$/, "Telefone inválido")
    .max(20)
    .optional()
    .or(z.literal("")),
  whatsappMensagem: z.string().max(300, "Máximo de 300 caracteres").optional(),
  instagram: campoOpcional,
  facebook: campoOpcional,
  tiktok: campoOpcional,
  linkedin: campoOpcional,
  fotosDaLoja: z
    .array(z.string().min(1).max(500))
    .max(12, "Máximo de 12 fotos")
    .optional(),
});
export type EstabelecimentoInput = z.infer<typeof estabelecimentoSchema>;

// ------------------------------------------------------------
// Configurações — Horários de funcionamento
// ------------------------------------------------------------
const horaHHMM = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido (use HH:MM)");

export const turnoSchema = z
  .object({
    abertura: horaHHMM,
    fechamento: horaHHMM,
  })
  .refine((t) => t.abertura < t.fechamento, {
    message: "A abertura deve ser antes do fechamento",
    path: ["fechamento"],
  });

export const diaFuncionamentoSchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  isAberto: z.boolean(),
  turnos: z
    .array(turnoSchema)
    .min(1, "Adicione pelo menos um intervalo")
    .max(4, "Máximo de 4 intervalos por dia"),
});

export const FUSOS_HORARIOS = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)" },
] as const;

export const horariosFuncionamentoSchema = z.object({
  fusoHorario: z.enum(
    FUSOS_HORARIOS.map((f) => f.value) as [string, ...string[]],
    { message: "Fuso horário inválido" }
  ),
  dias: z.array(diaFuncionamentoSchema).length(7, "Configure os 7 dias"),
});
export type HorariosFuncionamentoInput = z.infer<
  typeof horariosFuncionamentoSchema
>;

export const movimentacaoFormSchema = z.object({
  tipo: z.enum(["suprimento", "sangria"], {
    message: "Selecione o tipo de movimentação",
  }),
  valorReais: precoReais,
  motivo: z
    .string()
    .min(3, "Descreva o motivo (mínimo 3 caracteres)")
    .max(200, "Motivo muito longo"),
});
export type MovimentacaoForm = z.infer<typeof movimentacaoFormSchema>;
