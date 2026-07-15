import { and, desc, eq } from "drizzle-orm";
import { ArrowDownCircle, ArrowUpCircle, ShoppingBag } from "lucide-react";
import { db } from "@/db";
import { caixas } from "@/db/schema";
import { getOwnerRestaurante } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { AbrirCaixaForm } from "@/components/admin/caixa/abrir-caixa-form";
import { FecharCaixaDialog } from "@/components/admin/caixa/fechar-caixa-dialog";
import { MovimentacaoDialog } from "@/components/admin/caixa/movimentacao-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Caixa | SaborOn" };

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function CaixaPage() {
  const { restaurante } = await getOwnerRestaurante();

  const caixaAberto = await db.query.caixas.findFirst({
    where: and(
      eq(caixas.restauranteId, restaurante.id),
      eq(caixas.status, "aberto")
    ),
    with: {
      movimentacoes: {
        orderBy: (m, { desc }) => [desc(m.criadoEm)],
      },
    },
  });

  const historico = await db.query.caixas.findMany({
    where: and(
      eq(caixas.restauranteId, restaurante.id),
      eq(caixas.status, "fechado")
    ),
    orderBy: [desc(caixas.abertoEm)],
    limit: 5,
  });

  // Sangria retira; suprimento e venda (automática, vinda de pedidos) entram.
  const saldoEsperado = caixaAberto
    ? caixaAberto.valorAbertura +
      caixaAberto.movimentacoes.reduce(
        (acc, m) => acc + (m.tipo === "sangria" ? -m.valor : m.valor),
        0
      )
    : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          Caixa
          {caixaAberto ? (
            <Badge className="bg-green-600 text-white">Aberto</Badge>
          ) : (
            <Badge variant="secondary">Fechado</Badge>
          )}
        </h1>
        {caixaAberto && (
          <div className="flex gap-2">
            <MovimentacaoDialog />
            <FecharCaixaDialog saldoEsperado={saldoEsperado} />
          </div>
        )}
      </div>

      {!caixaAberto ? (
        <Card>
          <CardHeader>
            <CardTitle>Abrir o caixa</CardTitle>
            <CardDescription>
              Enquanto o caixa estiver fechado, a loja não aceita novos
              pedidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AbrirCaixaForm />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Valor de abertura</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {formatCents(caixaAberto.valorAbertura)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Aberto em {dataHora.format(caixaAberto.abertoEm)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Movimentações</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {caixaAberto.movimentacoes.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Vendas, suprimentos e sangrias da sessão
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Saldo esperado</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {formatCents(saldoEsperado)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Abertura + vendas + suprimentos − sangrias
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Movimentações da sessão</CardTitle>
            </CardHeader>
            <CardContent>
              {caixaAberto.movimentacoes.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma movimentação registrada nesta sessão.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Quando</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caixaAberto.movimentacoes.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>
                          <span className="flex items-center gap-1.5">
                            {mov.tipo === "venda" ? (
                              <ShoppingBag className="size-4 text-green-600" />
                            ) : mov.tipo === "suprimento" ? (
                              <ArrowUpCircle className="size-4 text-green-600" />
                            ) : (
                              <ArrowDownCircle className="size-4 text-red-600" />
                            )}
                            {mov.tipo === "venda"
                              ? "Venda"
                              : mov.tipo === "suprimento"
                                ? "Suprimento"
                                : "Sangria"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-56 truncate">
                          {mov.motivo}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {dataHora.format(mov.criadoEm)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {mov.tipo === "sangria" ? "−" : "+"}
                          {formatCents(mov.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sessões anteriores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Abertura</TableHead>
                  <TableHead>Fechamento</TableHead>
                  <TableHead className="text-right">Valor inicial</TableHead>
                  <TableHead className="text-right">Valor final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((sessao) => (
                  <TableRow key={sessao.id}>
                    <TableCell>{dataHora.format(sessao.abertoEm)}</TableCell>
                    <TableCell>
                      {sessao.fechadoEm ? dataHora.format(sessao.fechadoEm) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCents(sessao.valorAbertura)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {sessao.valorFechamento !== null
                        ? formatCents(sessao.valorFechamento)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
