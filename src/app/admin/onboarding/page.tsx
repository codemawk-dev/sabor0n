import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { restaurantes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { OnboardingForm } from "@/components/admin/onboarding-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Criar restaurante | SaborOn" };

export default async function OnboardingPage() {
  const user = await getSessionUser();

  const existente = await db.query.restaurantes.findFirst({
    where: eq(restaurantes.ownerId, user.id),
  });
  if (existente) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Bem-vindo ao SaborOn!</CardTitle>
          <CardDescription>
            Cadastre seu restaurante para começar a vender.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </main>
  );
}
