import { getOwnerRestaurante } from "@/lib/auth";
import { Sidebar } from "@/components/admin/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { restaurante } = await getOwnerRestaurante();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        restauranteNome={restaurante.nome}
        restauranteSlug={restaurante.slug}
      />
      <main className="flex-1 overflow-x-auto bg-muted/40 p-6">{children}</main>
    </div>
  );
}
