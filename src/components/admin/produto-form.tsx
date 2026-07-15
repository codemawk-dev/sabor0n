"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createProduto, updateProduto } from "@/actions/produtos";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { produtoSchema, type ProdutoInput } from "@/validators";

type Categoria = { id: string; nome: string };

export function ProdutoForm({
  categorias,
  produtoId,
  defaultValues,
}: {
  categorias: Categoria[];
  produtoId?: string;
  defaultValues?: ProdutoInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!produtoId;

  const form = useForm<ProdutoInput>({
    resolver: zodResolver(produtoSchema),
    defaultValues: defaultValues ?? {
      nome: "",
      descricao: "",
      precoReais: "",
      categoriaId: "",
      imagemUrl: "",
      disponivel: true,
      destaque: false,
    },
  });

  function onSubmit(data: ProdutoInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateProduto(produtoId, data)
        : await createProduto(data);

      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Produto atualizado!" : "Produto criado!");
      router.push("/admin/produtos");
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Pizza Margherita" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Molho de tomate, mussarela, manjericão..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="precoReais"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço (R$)</FormLabel>
                <FormControl>
                  <Input placeholder="45,90" inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoriaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="imagemUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da imagem (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-8">
          <FormField
            control={form.control}
            name="disponivel"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="mt-0!">Disponível</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="destaque"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="mt-0!">Destaque</FormLabel>
                <FormDescription className="mt-0!">
                  Aparece no topo do cardápio
                </FormDescription>
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Salvar alterações" : "Criar produto"}
        </Button>
      </form>
    </Form>
  );
}
