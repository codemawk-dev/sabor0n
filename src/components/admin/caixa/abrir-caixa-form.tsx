"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LockOpen } from "lucide-react";
import { toast } from "sonner";
import { abrirCaixa } from "@/actions/caixa";
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
import { parseReaisToCents } from "@/lib/money";
import { valorReaisFormSchema, type ValorReaisForm } from "@/validators";

export function AbrirCaixaForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ValorReaisForm>({
    resolver: zodResolver(valorReaisFormSchema),
    defaultValues: { valorReais: "" },
  });

  function onSubmit(data: ValorReaisForm) {
    startTransition(async () => {
      const result = await abrirCaixa(parseReaisToCents(data.valorReais));
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Caixa aberto! O restaurante já pode receber pedidos.");
      form.reset();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="valorReais"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor de abertura (R$)</FormLabel>
              <FormControl>
                <Input placeholder="100,00" inputMode="decimal" {...field} />
              </FormControl>
              <FormDescription>
                Troco inicial disponível na gaveta.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LockOpen className="size-4" />
          )}
          Abrir caixa
        </Button>
      </form>
    </Form>
  );
}
