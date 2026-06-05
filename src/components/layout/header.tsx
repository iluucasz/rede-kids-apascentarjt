"use client";

import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { logoutUserAction } from "@/app/login/actions";
import type { AppUser } from "@/lib/types";

type NavigationItem<TId extends string> = {
  id: TId;
  label: string;
  icon: LucideIcon;
};

export function Header<TId extends string>({
  items,
  activeItem,
  currentUser,
  title,
  subtitle,
  search,
  onSearchChange,
  onItemChange,
  searchPlaceholder = "Buscar membro",
  showSearch = true,
}: {
  items: NavigationItem<TId>[];
  activeItem: TId;
  currentUser: AppUser;
  title: string;
  subtitle?: string;
  search: string;
  onSearchChange: (value: string) => void;
  onItemChange: (itemId: TId) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeLabel = items.find((item) => item.id === activeItem)?.label;

  function handleMobileItemClick(itemId: TId) {
    onItemChange(itemId);
    setMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white shadow-sm lg:bg-white/95 lg:backdrop-blur">
      <div className="flex min-h-20 flex-col gap-4 px-4 py-4 sm:px-6 lg:h-23 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-0">
        <div className="flex items-start justify-between gap-4 lg:block">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700">{activeLabel}</p>
            <h2 className="truncate text-2xl font-bold tracking-normal">{title}</h2>
            {subtitle && (
              <p className="mt-1 max-w-2xl text-sm font-medium text-zinc-500 lg:truncate">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label="Abrir menu"
            title="Abrir menu"
            onClick={() => setMobileMenuOpen(true)}
            className="grid size-11 shrink-0 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 lg:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>

        {showSearch && (
          <div className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3">
            <Search size={17} className="text-zinc-500" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-zinc-500 sm:w-64"
            />
          </div>
        )}
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-zinc-950/40"
          />

          <section className="absolute right-0 top-0 flex h-full w-full max-w-xs flex-col border-l border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                  <Image
                    src="/logo-apascentar.png"
                    alt="Logo Ministério Apascentar"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Navegação
                  </p>
                  <p className="text-lg font-bold text-zinc-950">Rede Kids</p>
                  <p className="text-[9px] font-normal leading-tight tracking-[0.04em] text-zinc-400">
                    Apascentar Jardim Tropical
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Fechar menu"
                title="Fechar menu"
                onClick={() => setMobileMenuOpen(false)}
                className="grid size-10 place-items-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleMobileItemClick(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                      isActive
                        ? "bg-emerald-700 text-white"
                        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-zinc-200 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Sessão ativa
              </p>
              <p className="mt-2 text-sm font-bold text-zinc-950">{currentUser.name}</p>
              <p className="mt-1 break-words text-sm text-zinc-500">{currentUser.email}</p>
              <p className="mt-2 text-xs font-medium text-zinc-500">
                {formatRoleLabel(currentUser.role)}
              </p>

              <form action={logoutUserAction} className="mt-4">
                <button
                  type="submit"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  <LogOut size={16} aria-hidden="true" />
                  Sair
                </button>
              </form>
            </div>
          </section>
        </div>
      ) : null}
    </header>
  );
}

function formatRoleLabel(role: AppUser["role"]) {
  if (role === "admin") return "Administrador";
  if (role === "coordinator") return "Coordenação";
  return "Trabalhador";
}
