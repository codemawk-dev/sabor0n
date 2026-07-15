"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { fecharCaixa } from "@/actions/caixa";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { formatCents, parseReaisToCents } from "@/lib/money";
import { valorReaisFormSchema, type ValorReaisForm } from "@/validators";

export function FecharCaixaDialog({
  saldoEsperado,
}: {
  saldoEsperado: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ValorReaisForm>({
    resolver: zodResolver(valorReaisFormSchema),
    defaultValues: { valorReais: "" },
  });

  function onSubmit(data: ValorReaisForm) {
    startTransition(async () => {
      const result = await fecharCaixa(parseReaisToCents(data.valorReais));
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Caixa fechado. A loja não recebe mais pedidos.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>
        <Lock className="size-4" />
        Fechar caixa
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Fechar caixa</DialogTitle>
          <DialogDescription>
            Confira o dinheiro na gaveta e informe o valor contado. Saldo
            esperado: <strong>{formatCents(saldoEsperado)}</strong>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="valorReais"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor de fechamento (R$)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="350,00"
                      inputMode="decimal"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Ao fechar, a loja para de aceitar novos pedidos.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={isPending}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Confirmar fechamento
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
