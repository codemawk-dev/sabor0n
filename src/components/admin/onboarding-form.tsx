"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createRestaurante } from "@/actions/auth";
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
import { restauranteSchema, type RestauranteInput } from "@/validators";

export function OnboardingForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<RestauranteInput>({
    resolver: zodResolver(restauranteSchema),
    defaultValues: {
      nome: "",
      slug: "",
      telefone: "",
      taxaEntregaReais: "0",
      tempoEntregaEstimado: "",
    },
  });

  function onSubmit(data: RestauranteInput) {
    startTransition(async () => {
      const result = await createRestaurante(data);
      if (result?.error) {
        toast.error(result.error);
      }
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
              <FormLabel>Nome do restaurante</FormLabel>
              <FormControl>
                <Input placeholder="Pizzaria do Zé" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço da loja (slug)</FormLabel>
              <FormControl>
                <Input placeholder="pizzaria-do-ze" {...field} />
              </FormControl>
              <FormDescription>
                Sua loja ficará em saboron.com/{field.value || "seu-slug"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="telefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="(11) 99999-0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="taxaEntregaReais"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Taxa de entrega (R$)</FormLabel>
                <FormControl>
                  <Input placeholder="8,00" inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tempoEntregaEstimado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempo estimado</FormLabel>
                <FormControl>
                  <Input placeholder="40-50 min" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Criar restaurante
        </Button>
      </form>
    </Form>
  );
}
