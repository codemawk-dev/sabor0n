import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { horariosFuncionamento } from "@/db/schema";
import { getOwnerRestaurante } from "@/lib/auth";
import { EstabelecimentoForm } from "@/components/admin/configuracoes/estabelecimento-form";
import {
  HorariosForm,
  type HorariosIniciais,
} from "@/components/admin/configuracoes/horarios-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = { title: "Configurações | SaborOn" };

const TURNO_PADRAO = { abertura: "08:00", fechamento: "22:00" };

export default async function ConfiguracoesPage() {
  const { restaurante } = await getOwnerRestaurante();

  const grade = await db.query.horariosFuncionamento.findMany({
    where: eq(horariosFuncionamento.restauranteId, restaurante.id),
    orderBy: [asc(horariosFuncionamento.diaSemana), asc(horariosFuncionamento.abertura)],
  });

  // Monta o estado inicial da grade: dias sem cadastro entram abertos
  // com um turno padrão (nada é salvo até o lojista confirmar).
  const dias: HorariosIniciais["dias"] = {};
  for (let d = 0; d <= 6; d++) {
    const doDia = grade.filter((h) => h.diaSemana === d);
    if (doDia.length === 0) {
      dias[d] = { isAberto: true, turnos: [{ ...TURNO_PADRAO }] };
    } else if (doDia.every((h) => !h.isAberto)) {
      dias[d] = { isAberto: false, turnos: [{ ...TURNO_PADRAO }] };
    } else {
      dias[d] = {
        isAberto: true,
        turnos: doDia
          .filter((h) => h.isAberto)
          .map((h) => ({ abertura: h.abertura, fechamento: h.fechamento })),
      };
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Tabs defaultValue="estabelecimento">
        <TabsList>
          <TabsTrigger value="estabelecimento">Estabelecimento</TabsTrigger>
          <TabsTrigger value="horarios">Horários</TabsTrigger>
        </TabsList>
        <TabsContent value="estabelecimento" className="mt-4">
          <EstabelecimentoForm
            defaultValues={{
              nome: restaurante.nome,
              slug: restaurante.slug,
              descricao: restaurante.descricao ?? "",
              cnpjCpf: restaurante.cnpjCpf ?? "",
              endereco: restaurante.endereco ?? "",
              whatsapp: restaurante.whatsapp ?? "",
              whatsappMensagem: restaurante.whatsappMensagem ?? "",
              instagram: restaurante.instagram ?? "",
              facebook: restaurante.facebook ?? "",
              tiktok: restaurante.tiktok ?? "",
              linkedin: restaurante.linkedin ?? "",
              fotosDaLoja: restaurante.fotosDaLoja ?? [],
            }}
          />
        </TabsContent>
        <TabsContent value="horarios" className="mt-4">
          <HorariosForm
            iniciais={{ fusoHorario: restaurante.fusoHorario, dias }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
