"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { saveHorariosFuncionamento } from "@/actions/configuracoes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  FUSOS_HORARIOS,
  horariosFuncionamentoSchema,
} from "@/validators";

interface Turno {
  abertura: string;
  fechamento: string;
}
interface DiaConfig {
  isAberto: boolean;
  turnos: Turno[];
}

/** Ordem de exibição: Segunda..Sábado, Domingo por último. */
const DIAS_ORDEM = [1, 2, 3, 4, 5, 6, 0] as const;
const DIAS_LABEL: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

const TURNO_PADRAO: Turno = { abertura: "08:00", fechamento: "22:00" };

export type HorariosIniciais = {
  fusoHorario: string;
  dias: Record<number, DiaConfig>;
};

export function HorariosForm({ iniciais }: { iniciais: HorariosIniciais }) {
  const [isPending, startTransition] = useTransition();
  const [fusoHorario, setFusoHorario] = useState(iniciais.fusoHorario);
  const [dias, setDias] = useState<Record<number, DiaConfig>>(iniciais.dias);

  function updateDia(dia: number, patch: Partial<DiaConfig>) {
    setDias((prev) => ({ ...prev, [dia]: { ...prev[dia], ...patch } }));
  }

  function updateTurno(
    dia: number,
    index: number,
    campo: keyof Turno,
    valor: string
  ) {
    setDias((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        turnos: prev[dia].turnos.map((t, i) =>
          i === index ? { ...t, [campo]: valor } : t
        ),
      },
    }));
  }

  function addTurno(dia: number) {
    const ultimo = dias[dia].turnos.at(-1);
    // Sugere um turno noturno após o último (ex: 18:00–23:00)
    const novo: Turno =
      ultimo && ultimo.fechamento < "18:00"
        ? { abertura: "18:00", fechamento: "23:00" }
        : { ...TURNO_PADRAO };
    updateDia(dia, { turnos: [...dias[dia].turnos, novo] });
  }

  function removeTurno(dia: number, index: number) {
    updateDia(dia, {
      turnos: dias[dia].turnos.filter((_, i) => i !== index),
    });
  }

  function aplicarAosDemais(diaOrigem: number) {
    const config = dias[diaOrigem];
    setDias(() => {
      const novo: Record<number, DiaConfig> = {};
      for (const d of DIAS_ORDEM) {
        novo[d] = {
          isAberto: config.isAberto,
          turnos: config.turnos.map((t) => ({ ...t })),
        };
      }
      return novo;
    });
    toast.success(
      `Horários de ${DIAS_LABEL[diaOrigem]} aplicados aos demais dias.`
    );
  }

  function onSubmit() {
    const payload = {
      fusoHorario,
      dias: DIAS_ORDEM.map((d) => ({
        diaSemana: d,
        isAberto: dias[d].isAberto,
        // Dia fechado mantém um turno técnico para satisfazer o schema
        turnos: dias[d].turnos.length > 0 ? dias[d].turnos : [TURNO_PADRAO],
      })),
    };

    const parsed = horariosFuncionamentoSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Horários inválidos");
      return;
    }

    startTransition(async () => {
      const result = await saveHorariosFuncionamento(parsed.data);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Grade de horários salva!");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fuso horário</CardTitle>
          <CardDescription>
            Os horários de funcionamento seguem este fuso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={fusoHorario}
            onValueChange={(value) => value && setFusoHorario(value)}
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Selecione o fuso" />
            </SelectTrigger>
            <SelectContent>
              {FUSOS_HORARIOS.map((fuso) => (
                <SelectItem key={fuso.value} value={fuso.value}>
                  {fuso.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grade de funcionamento</CardTitle>
          <CardDescription>
            Configure os turnos de cada dia. A loja só aceita pedidos dentro
            desses horários (e com o caixa aberto).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {DIAS_ORDEM.map((dia, i) => {
            const config = dias[dia];
            return (
              <div key={dia}>
                {i > 0 && <Separator className="my-3" />}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex w-44 shrink-0 items-center gap-3 pt-1.5">
                    <Switch
                      checked={config.isAberto}
                      onCheckedChange={(checked) =>
                        updateDia(dia, { isAberto: checked })
                      }
                      aria-label={`${DIAS_LABEL[dia]} aberto`}
                    />
                    <Label className="font-medium">{DIAS_LABEL[dia]}</Label>
                  </div>

                  <div className="flex-1 space-y-2">
                    {config.isAberto ? (
                      <>
                        {config.turnos.map((turno, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2"
                          >
                            <Input
                              type="time"
                              value={turno.abertura}
                              onChange={(e) =>
                                updateTurno(dia, index, "abertura", e.target.value)
                              }
                              className="w-28"
                              aria-label="Abertura"
                            />
                            <span className="text-sm text-muted-foreground">
                              às
                            </span>
                            <Input
                              type="time"
                              value={turno.fechamento}
                              onChange={(e) =>
                                updateTurno(dia, index, "fechamento", e.target.value)
                              }
                              className="w-28"
                              aria-label="Fechamento"
                            />
                            {config.turnos.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground"
                                aria-label="Remover intervalo"
                                onClick={() => removeTurno(dia, index)}
                              >
                                <X className="size-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <div className="flex gap-4">
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() => addTurno(dia)}
                          >
                            <Plus className="size-3.5" />
                            Adicionar intervalo
                          </Button>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-muted-foreground"
                            onClick={() => aplicarAosDemais(dia)}
                          >
                            <Copy className="size-3.5" />
                            Aplicar aos demais dias
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="pt-1.5 text-sm text-muted-foreground">
                        Fechado
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button size="lg" disabled={isPending} onClick={onSubmit}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Salvar horários
      </Button>
    </div>
  );
}
