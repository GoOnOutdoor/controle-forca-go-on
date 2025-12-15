"use client";

import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Users, Dumbbell, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow-md"
      >
        Pular para o conteúdo principal
      </a>
      <div className="container mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6" />
            <span className="font-bold text-lg">Go On Força</span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2" aria-label="Navegação principal">
            <Link href="/">
              <Button
                variant={pathname === "/" ? "secondary" : "ghost"}
                size="sm"
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/treinadores">
              <Button
                variant={pathname === "/treinadores" ? "secondary" : "ghost"}
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Treinadores
              </Button>
            </Link>
            <Link href="/configuracoes">
              <Button
                variant={pathname === "/configuracoes" ? "secondary" : "ghost"}
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </Link>
          </nav>
        </div>

        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
