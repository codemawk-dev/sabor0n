"use client";

import Image from "next/image";
import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { useCartStore } from "@/stores/cart";

export interface ProdutoLoja {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagemUrl: string | null;
  destaque: boolean;
}

export function ProductCard({
  produto,
  slug,
}: {
  produto: ProdutoLoja;
  slug: string;
}) {
  const { addItem, replaceCart } = useCartStore();
  const [conflictOpen, setConflictOpen] = useState(false);

  const item = {
    produtoId: produto.id,
    nome: produto.nome,
    preco: produto.preco,
    imagemUrl: produto.imagemUrl,
  };

  function handleAdd() {
    const result = addItem(slug, item);
    if (result === "conflict") {
      setConflictOpen(true);
      return;
    }
    toast.success(`${produto.nome} adicionado ao carrinho!`);
  }

  return (
    <>
      <Card className="overflow-hidden py-0">
        <CardContent className="flex gap-4 p-4">
          {produto.imagemUrl && (
            <div className="relative size-24 shrink-0 overflow-hidden rounded-md">
              <Image
                src={produto.imagemUrl}
                alt={produto.nome}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          )}
          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{produto.nome}</p>
              {produto.destaque && (
                <Badge variant="secondary" className="shrink-0">
                  <Star className="size-3" />
                  Destaque
                </Badge>
              )}
            </div>
            {produto.descricao && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {produto.descricao}
              </p>
            )}
            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="font-bold text-primary">
                {formatCents(produto.preco)}
              </span>
              <Button size="sm" onClick={handleAdd}>
                <Plus className="size-4" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Começar um novo carrinho?</AlertDialogTitle>
            <AlertDialogDescription>
              Seu carrinho contém itens de outro restaurante. Para adicionar
              este item, o carrinho atual será esvaziado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter carrinho</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                replaceCart(slug, item);
                toast.success(`${produto.nome} adicionado ao carrinho!`);
              }}
            >
              Esvaziar e adicionar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
