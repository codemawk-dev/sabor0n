import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { caixas, horariosFuncionamento } from "@/db/schema";

/** Sessão de caixa aberta do restaurante, se houver. */
export async function getCaixaAberto(restauranteId: string) {
  return db.query.caixas.findFirst({
    where: and(
      eq(caixas.restauranteId, restauranteId),
      eq(caixas.status, "aberto")
    ),
  });
}

export async function isCaixaAberto(restauranteId: string): Promise<boolean> {
  return !!(await getCaixaAberto(restauranteId));
}

/** Dia da semana (0=Dom..6=Sáb) e "HH:MM" atuais no fuso do restaurante. */
function agoraNoFuso(fusoHorario: string): { diaSemana: number; hhmm: string } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: fusoHorario,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
  } catch {
    // Fuso inválido cadastrado: não derruba a loja, usa o fuso do servidor.
    parts = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
  }

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const DIAS: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  // hour12:false pode retornar "24" à meia-noite em alguns runtimes.
  const hora = get("hour") === "24" ? "00" : get("hour");

  return {
    diaSemana: DIAS[get("weekday")] ?? new Date().getDay(),
    hhmm: `${hora}:${get("minute")}`,
  };
}

/**
 * Valida se o horário atual (no fuso do restaurante) cai dentro de algum
 * turno cadastrado para o dia. Restaurante sem grade cadastrada é tratado
 * como "sempre dentro do horário" (só a regra do caixa se aplica).
 */
export async function isDentroDoHorario(restaurante: {
  id: string;
  fusoHorario: string;
}): Promise<boolean> {
  const grade = await db.query.horariosFuncionamento.findMany({
    where: eq(horariosFuncionamento.restauranteId, restaurante.id),
  });
  if (grade.length === 0) return true;

  const { diaSemana, hhmm } = agoraNoFuso(restaurante.fusoHorario);

  return grade.some(
    (turno) =>
      turno.diaSemana === diaSemana &&
      turno.isAberto &&
      turno.abertura <= hhmm &&
      hhmm <= turno.fechamento
  );
}

/**
 * Dupla validação da loja pública: o restaurante só aceita pedidos se
 * (1) o caixa do PDV está aberto E (2) o horário atual está dentro de um
 * turno de funcionamento. Usada na vitrine, no checkout e como trava de
 * segurança no servidor dentro de createPedido.
 */
export async function isLojaAberta(restaurante: {
  id: string;
  fusoHorario: string;
}): Promise<boolean> {
  const [caixaAberto, dentroDoHorario] = await Promise.all([
    isCaixaAberto(restaurante.id),
    isDentroDoHorario(restaurante),
  ]);
  return caixaAberto && dentroDoHorario;
}
