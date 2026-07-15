"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { createCategoria, updateCategoria } from "@/actions/categorias";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { categoriaSchema, type CategoriaInput } from "@/validators";

type Categoria = { id: string; nome: string; ordem: number };

export function CategoriaFormDialog({ categoria }: { categoria?: Categoria }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = !!categoria;

  const form = useForm<CategoriaInput>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: categoria?.nome ?? "",
      ordem: categoria?.ordem ?? 0,
    },
  });

  function onSubmit(data: CategoriaInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateCategoria(categoria.id, data)
        : await createCategoria(data);

      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Categoria atualizada!" : "Categoria criada!");
      setOpen(false);
      if (!isEdit) form.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <DialogTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Editar categoria" />
          }
        >
          <Pencil className="size-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="size-4" />
          Nova categoria
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Pizzas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ordem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Categorias com menor ordem aparecem primeiro no cardápio.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
