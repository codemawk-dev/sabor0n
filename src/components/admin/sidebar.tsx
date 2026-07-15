"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Tags,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Visão Geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/caixa", label: "Caixa", icon: Wallet },
  { href: "/admin/produtos", label: "Produtos", icon: UtensilsCrossed },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({
  restauranteNome,
  restauranteSlug,
}: {
  restauranteNome: string;
  restauranteSlug: string;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-background p-4">
      <div className="mb-2">
        <p className="text-lg font-bold">SaborOn</p>
        <p className="truncate text-sm text-muted-foreground">
          {restauranteNome}
        </p>
      </div>
      <Separator className="my-2" />
      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              (exact ? pathname === href : pathname.startsWith(href))
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
        <a
          href={`/${restauranteSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-4" />
          Ver loja
        </a>
      </nav>
      <Separator className="my-2" />
      <Button
        variant="ghost"
        className="justify-start text-muted-foreground"
        disabled={isPending}
        onClick={() => startTransition(() => logout())}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        Sair
      </Button>
    </aside>
  );
}
