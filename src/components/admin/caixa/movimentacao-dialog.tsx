"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adicionarMovimentacao } from "@/actions/caixa";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { parseReaisToCents } from "@/lib/money";
import { movimentacaoFormSchema, type MovimentacaoForm } from "@/validators";

export function MovimentacaoDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<MovimentacaoForm>({
    resolver: zodResolver(movimentacaoFormSchema),
    defaultValues: { tipo: "suprimento", valorReais: "", motivo: "" },
  });

  function onSubmit(data: MovimentacaoForm) {
    startTransition(async () => {
      const result = await adicionarMovimentacao(
        data.tipo,
        parseReaisToCents(data.valorReais),
        data.motivo
      );
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        data.tipo === "suprimento"
          ? "Suprimento registrado!"
          : "Sangria registrada!"
      );
      setOpen(false);
      form.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <ArrowDownUp className="size-4" />
        Nova movimentação
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova movimentação</DialogTitle>
          <DialogDescription>
            Suprimento adiciona dinheiro à gaveta; sangria retira.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-6"
                    >
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <RadioGroupItem value="suprimento" />
                        </FormControl>
                        <FormLabel className="mt-0! font-normal">
                          Suprimento (entrada)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <RadioGroupItem value="sangria" />
                        </FormControl>
                        <FormLabel className="mt-0! font-normal">
                          Sangria (retirada)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valorReais"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input placeholder="50,00" inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: troco para o entregador"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Registrar
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
