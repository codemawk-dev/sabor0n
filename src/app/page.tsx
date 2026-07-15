import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div>
        <h1 className="text-4xl font-bold">SaborOn</h1>
        <p className="mt-2 text-muted-foreground">
          Plataforma de gestão de restaurantes e delivery
        </p>
      </div>
      <div className="flex gap-4">
        <Button render={<Link href="/admin" />}>Painel do lojista</Button>
        <Button render={<Link href="/pizzaria-do-ze" />} variant="outline">
          Ver loja de exemplo
        </Button>
      </div>
    </main>
  );
}
