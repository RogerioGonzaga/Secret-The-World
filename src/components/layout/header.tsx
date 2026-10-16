"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Heart, Menu, X } from "lucide-react";
import { usePlanner } from "@/lib/favorites/store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { navItems } from "./nav-items";

function FavoritesLink({ className }: { className?: string }) {
  const { favorites } = usePlanner();
  return (
    <Link
      href="/favoritos"
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl border border-sand-300 bg-white px-3.5 text-sm font-medium text-ink transition hover:border-navy-600/40",
        className,
      )}
      aria-label={`${t.nav.favorites}${favorites.length ? ` (${favorites.length} salvos)` : ""}`}
    >
      <Heart className={cn("size-4", favorites.length > 0 && "fill-copper-500 text-copper-500")} aria-hidden />
      <span>{t.nav.favorites}</span>
      {favorites.length > 0 && (
        <span className="grid min-w-5 place-items-center rounded-full bg-navy-900 px-1.5 text-[11px] font-semibold text-white tabular-nums">{favorites.length}</span>
      )}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200/80 bg-sand-50/90 backdrop-blur-md supports-[backdrop-filter]:bg-sand-50/75">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lift">
        {t.nav.skip}
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href) ? "bg-white text-ink shadow-card" : "text-navy-700 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/guias" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-navy-700 hover:text-ink xl:inline-flex">
            {t.nav.guides}
          </Link>
          <FavoritesLink className="hidden sm:inline-flex" />
          <Dialog.Root>
            <Dialog.Trigger className="grid size-10 place-items-center rounded-xl border border-sand-300 bg-white lg:hidden" aria-label={t.nav.menu}>
              <Menu className="size-5" aria-hidden />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-[2px] data-[state=open]:animate-fade-up" />
              <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(22rem,88vw)] flex-col bg-white p-5 shadow-lift data-[state=open]:animate-fade-up">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-sm font-semibold tracking-[0.14em] text-subtle uppercase">{t.nav.menu}</Dialog.Title>
                  <Dialog.Close className="grid size-10 place-items-center rounded-xl hover:bg-sand-100" aria-label={t.nav.close}>
                    <X className="size-5" aria-hidden />
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">Navegação principal do Partiu Morar</Dialog.Description>
                <nav aria-label="Menu móvel" className="mt-6">
                  <ul className="space-y-1">
                    {[...navItems, { href: "/guias", label: t.nav.guides, icon: BookOpen }, { href: "/favoritos", label: t.nav.favorites, icon: Heart }].map((item) => (
                      <li key={item.href}>
                        <Dialog.Close asChild>
                          <Link
                            href={item.href}
                            aria-current={isActive(item.href) ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium",
                              isActive(item.href) ? "bg-teal-50 text-teal-700" : "text-ink hover:bg-sand-100",
                            )}
                          >
                            <item.icon className="size-5 text-navy-600" aria-hidden />
                            {item.label}
                          </Link>
                        </Dialog.Close>
                      </li>
                    ))}
                  </ul>
                </nav>
                <p className="mt-auto text-xs leading-relaxed text-subtle">
                  Seus favoritos e respostas ficam salvos apenas neste navegador.
                </p>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
