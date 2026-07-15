"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleDisponivel } from "@/actions/produtos";
import { Switch } from "@/components/ui/switch";

export function DisponivelSwitch({
  produtoId,
  disponivel,
}: {
  produtoId: string;
  disponivel: boolean;
}) {
  // Estado otimista: atualiza na hora e reverte se a action falhar.
  const [checked, setChecked] = useState(disponivel);
  const [isPending, startTransition] = useTransition();

  function handleToggle(value: boolean) {
    setChecked(value);
    startTransition(async () => {
      const result = await toggleDisponivel(produtoId, value);
      if (result?.error) {
        setChecked(!value);
        toast.error(result.error);
      }
    });
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleToggle}
      disabled={isPending}
      aria-label="Alternar disponibilidade"
    />
  );
}
