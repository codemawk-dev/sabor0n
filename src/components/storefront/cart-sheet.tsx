"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMounted } from "@/hooks/use-mounted";
import { formatCents } from "@/lib/money";
import { cartSubtotal, useCartStore } from "@/stores/cart";

export function CartSheet({
  slug,
  restauranteAberto,
}: {
  slug: string;
  restauranteAberto: boolean;
}) {
  // Evita mismatch de hidratação: o carrinho vem do localStorage.
  const mounted = useMounted();
  const { items, restauranteSlug, setQuantidade, removeItem } = useCartStore();

  // Só mostra itens se o carrinho pertence a esta loja.
  const cartItems = mounted && restauranteSlug === slug ? items : [];
  const totalItens = cartItems.reduce((acc, i) => acc + i.quantidade, 0);
  const subtotal = cartSubtotal(cartItems);

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            size="lg"
            className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          />
        }
      >
        <ShoppingCart className="size-5" />
        Carrinho
        {totalItens > 0 && (
          <Badge variant="secondary" className="ml-1 rounded-full px-2">
            {totalItens}
          </Badge>
        )}
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Seu carrinho</SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <p className="flex-1 px-4 text-sm text-muted-foreground">
            Seu carrinho está vazio. Adicione itens do cardápio!
          </p>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-4">
              {cartItems.map((item) => (
                <div key={item.produtoId} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCents(item.preco)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      aria-label="Diminuir quantidade"
                      onClick={() =>
                        setQuantidade(item.produtoId, item.quantidade - 1)
                      }
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">
                      {item.quantidade}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      aria-label="Aumentar quantidade"
                      onClick={() =>
                        setQuantidade(item.produtoId, item.quantidade + 1)
                      }
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    aria-label="Remover item"
                    onClick={() => removeItem(item.produtoId)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <SheetFooter>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">{formatCents(subtotal)}</span>
              </div>
              {restauranteAberto ? (
                <Button
                  render={<Link href={`/${slug}/checkout`} />}
                  size="lg"
                  className="w-full"
                >
                  Finalizar pedido
                </Button>
              ) : (
                <>
                  <Button size="lg" className="w-full" disabled>
                    Finalizar pedido
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    O restaurante está fechado no momento.
                  </p>
                </>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
