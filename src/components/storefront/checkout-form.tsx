"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPedido } from "@/actions/pedidos";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useMounted } from "@/hooks/use-mounted";
import { formatCents } from "@/lib/money";
import { cartSubtotal, useCartStore } from "@/stores/cart";
import { checkoutSchema, type CheckoutInput } from "@/validators";

export function CheckoutForm({
  slug,
  taxaEntrega,
  restauranteAberto,
}: {
  slug: string;
  taxaEntrega: number;
  restauranteAberto: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const mounted = useMounted();

  const { items, restauranteSlug, clear } = useCartStore();
  const cartItems = restauranteSlug === slug ? items : [];

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      clienteNome: "",
      clienteTelefone: "",
      tipoEntrega: "delivery",
      metodoPagamento: "pix",
      enderecoRua: "",
      enderecoNumero: "",
      enderecoBairro: "",
      enderecoComplemento: "",
    } as CheckoutInput,
  });

  const tipoEntrega = useWatch({
    control: form.control,
    name: "tipoEntrega",
  });
  const subtotal = cartSubtotal(cartItems);
  const taxa = tipoEntrega === "delivery" ? taxaEntrega : 0;
  const total = subtotal + taxa;

  function onSubmit(data: CheckoutInput) {
    if (!restauranteAberto) {
      toast.error("O restaurante está fechado no momento.");
      return;
    }
    startTransition(async () => {
      const result = await createPedido(
        slug,
        data,
        cartItems.map((i) => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
        }))
      );

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      clear();
      toast.success("Pedido realizado com sucesso!");
      router.push(`/${slug}/pedido/${result.pedidoId}`);
    });
  }

  if (!mounted) return null;

  if (cartItems.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-muted-foreground">Seu carrinho está vazio.</p>
        <Button render={<Link href={`/${slug}`} />}>
          Voltar ao cardápio
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Resumo do pedido */}
        <section className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Resumo do pedido</h2>
          <ul className="space-y-1 text-sm">
            {cartItems.map((item) => (
              <li key={item.produtoId} className="flex justify-between">
                <span>
                  {item.quantidade}x {item.nome}
                </span>
                <span>{formatCents(item.preco * item.quantidade)}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-3" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCents(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Taxa de entrega</span>
              <span>{formatCents(taxa)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCents(total)}</span>
            </div>
          </div>
        </section>

        {/* Dados do cliente */}
        <section className="space-y-4">
          <h2 className="font-semibold">Seus dados</h2>
          <FormField
            control={form.control}
            name="clienteNome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input placeholder="João da Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clienteTelefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone / WhatsApp</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Entrega ou retirada */}
        <section className="space-y-4">
          <h2 className="font-semibold">Entrega</h2>
          <FormField
            control={form.control}
            name="tipoEntrega"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex gap-6"
                  >
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="delivery" />
                      </FormControl>
                      <FormLabel className="mt-0! font-normal">
                        Entrega ({formatCents(taxaEntrega)})
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="retirada" />
                      </FormControl>
                      <FormLabel className="mt-0! font-normal">
                        Retirar no local (grátis)
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {tipoEntrega === "delivery" && (
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_100px] gap-4">
                <FormField
                  control={form.control}
                  name="enderecoRua"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rua</FormLabel>
                      <FormControl>
                        <Input placeholder="Av. Paulista" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enderecoNumero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="1000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="enderecoBairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Bela Vista" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enderecoComplemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto 42 (opcional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </section>

        {/* Pagamento */}
        <section className="space-y-4">
          <h2 className="font-semibold">Pagamento</h2>
          <FormField
            control={form.control}
            name="metodoPagamento"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-wrap gap-6"
                  >
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="pix" />
                      </FormControl>
                      <FormLabel className="mt-0! font-normal">PIX</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="cartao" />
                      </FormControl>
                      <FormLabel className="mt-0! font-normal">
                        Cartão na entrega
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value="dinheiro" />
                      </FormControl>
                      <FormLabel className="mt-0! font-normal">
                        Dinheiro
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending || !restauranteAberto}
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {restauranteAberto
            ? `Confirmar pedido • ${formatCents(total)}`
            : "Restaurante fechado"}
        </Button>
      </form>
    </Form>
  );
}
