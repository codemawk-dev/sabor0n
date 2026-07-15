"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  produtoId: string;
  nome: string;
  preco: number; // centavos (apenas exibição — o servidor recomputa no checkout)
  imagemUrl: string | null;
  quantidade: number;
}

interface CartState {
  /** Um carrinho por vez, amarrado ao restaurante. */
  restauranteSlug: string | null;
  items: CartItem[];
  /** Retorna "conflict" se o item é de outro restaurante (UI decide limpar). */
  addItem: (slug: string, item: Omit<CartItem, "quantidade">) => "ok" | "conflict";
  /** Limpa o carrinho e adiciona o item (usado após confirmar o conflito). */
  replaceCart: (slug: string, item: Omit<CartItem, "quantidade">) => void;
  removeItem: (produtoId: string) => void;
  setQuantidade: (produtoId: string, quantidade: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restauranteSlug: null,
      items: [],

      addItem: (slug, item) => {
        const { restauranteSlug, items } = get();
        if (restauranteSlug && restauranteSlug !== slug && items.length > 0) {
          return "conflict";
        }
        const existente = items.find((i) => i.produtoId === item.produtoId);
        set({
          restauranteSlug: slug,
          items: existente
            ? items.map((i) =>
                i.produtoId === item.produtoId
                  ? { ...i, quantidade: i.quantidade + 1 }
                  : i
              )
            : [...items, { ...item, quantidade: 1 }],
        });
        return "ok";
      },

      replaceCart: (slug, item) =>
        set({ restauranteSlug: slug, items: [{ ...item, quantidade: 1 }] }),

      removeItem: (produtoId) =>
        set((state) => {
          const items = state.items.filter((i) => i.produtoId !== produtoId);
          return { items, restauranteSlug: items.length ? state.restauranteSlug : null };
        }),

      setQuantidade: (produtoId, quantidade) =>
        set((state) => ({
          items:
            quantidade <= 0
              ? state.items.filter((i) => i.produtoId !== produtoId)
              : state.items.map((i) =>
                  i.produtoId === produtoId ? { ...i, quantidade } : i
                ),
        })),

      clear: () => set({ restauranteSlug: null, items: [] }),
    }),
    { name: "saboron-cart" }
  )
);

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
}
