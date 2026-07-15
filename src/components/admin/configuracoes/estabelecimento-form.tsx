"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateEstabelecimento } from "@/actions/configuracoes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { estabelecimentoSchema, type EstabelecimentoInput } from "@/validators";

const DESCRICAO_MAX = 300;

export function EstabelecimentoForm({
  defaultValues,
}: {
  defaultValues: EstabelecimentoInput;
}) {
  const [isPending, startTransition] = useTransition();
  const [fotoDialogOpen, setFotoDialogOpen] = useState(false);
  const [novaFotoUrl, setNovaFotoUrl] = useState("");

  const form = useForm<EstabelecimentoInput>({
    resolver: zodResolver(estabelecimentoSchema),
    defaultValues,
  });

  const descricao = useWatch({ control: form.control, name: "descricao" });
  const fotos = useWatch({ control: form.control, name: "fotosDaLoja" }) ?? [];

  function onSubmit(data: EstabelecimentoInput) {
    startTransition(async () => {
      const result = await updateEstabelecimento(data);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Dados do estabelecimento salvos!");
    });
  }

  function adicionarFoto() {
    const url = novaFotoUrl.trim();
    if (!url) {
      toast.error("Informe a URL (ou caminho) da foto");
      return;
    }
    form.setValue("fotosDaLoja", [...fotos, url], { shouldDirty: true });
    setNovaFotoUrl("");
    setFotoDialogOpen(false);
  }

  function removerFoto(index: number) {
    form.setValue(
      "fotosDaLoja",
      fotos.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil do estabelecimento</CardTitle>
            <CardDescription>
              Informações exibidas na sua loja pública.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do estabelecimento</FormLabel>
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
                    <FormLabel>URL da loja (slug)</FormLabel>
                    <FormControl>
                      <Input placeholder="pizzaria-do-ze" {...field} />
                    </FormControl>
                    <FormDescription>
                      saboron.com/{field.value || "seu-slug"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Conte sobre seu restaurante..."
                      maxLength={DESCRICAO_MAX}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-right tabular-nums">
                    {descricao?.length ?? 0}/{DESCRICAO_MAX}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cnpjCpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0001-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Av. Paulista, 1000 - São Paulo/SP"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redes sociais &amp; contato</CardTitle>
            <CardDescription>
              Links exibidos para os clientes na vitrine.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappMensagem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem padrão do WhatsApp</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Olá! Vi seu cardápio no SaborOn..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Preenchida automaticamente quando o cliente clica no
                      link.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  { name: "instagram", label: "Instagram", ph: "@pizzariadoze" },
                  { name: "facebook", label: "Facebook", ph: "facebook.com/pizzariadoze" },
                  { name: "tiktok", label: "TikTok", ph: "@pizzariadoze" },
                  { name: "linkedin", label: "LinkedIn", ph: "linkedin.com/company/pizzariadoze" },
                ] as const
              ).map((rede) => (
                <FormField
                  key={rede.name}
                  control={form.control}
                  name={rede.name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{rede.label}</FormLabel>
                      <FormControl>
                        <Input placeholder={rede.ph} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fotos da loja</CardTitle>
            <CardDescription>
              Galeria exibida no perfil público (URLs de imagem — o upload
              real chega em uma próxima fase).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {fotos.map((foto, index) => (
                <div
                  key={`${foto}-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                >
                  {/^https?:\/\//.test(foto) ? (
                    <Image
                      src={foto}
                      alt={`Foto da loja ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground break-all">
                      {foto}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-1.5 top-1.5 size-7 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remover foto"
                    onClick={() => removerFoto(index)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}

              <Dialog open={fotoDialogOpen} onOpenChange={setFotoDialogOpen}>
                <DialogTrigger
                  render={
                    <button
                      type="button"
                      className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    />
                  }
                >
                  <ImagePlus className="size-6" />
                  <span className="text-sm font-medium">+ Adicionar</span>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Adicionar foto</DialogTitle>
                    <DialogDescription>
                      Cole a URL da imagem (ex: https://... ou um caminho
                      local de teste).
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    placeholder="https://exemplo.com/foto.jpg"
                    value={novaFotoUrl}
                    onChange={(e) => setNovaFotoUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        adicionarFoto();
                      }
                    }}
                  />
                  <Button type="button" onClick={adicionarFoto}>
                    Adicionar à galeria
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Salvar alterações
        </Button>
      </form>
    </Form>
  );
}
