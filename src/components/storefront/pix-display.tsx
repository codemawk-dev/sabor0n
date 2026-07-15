"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PixDisplay({ payload }: { payload: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente.");
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Pague com PIX</CardTitle>
        <CardDescription>
          Escaneie o QR Code ou copie o código abaixo
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="rounded-lg border bg-white p-4">
          <QRCodeSVG value={payload} size={180} />
        </div>
        <p className="w-full break-all rounded-md bg-muted p-3 font-mono text-xs">
          {payload}
        </p>
        <Button onClick={handleCopy} variant="outline" className="w-full">
          {copied ? (
            <Check className="size-4 text-green-600" />
          ) : (
            <Copy className="size-4" />
          )}
          {copied ? "Copiado!" : "Copiar código PIX"}
        </Button>
      </CardContent>
    </Card>
  );
}
