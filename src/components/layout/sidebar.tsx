import Image from "next/image";
import { LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { logoutUserAction } from "@/app/login/actions";
import type { AppUser } from "@/lib/types";

type NavigationItem<TId extends string> = {
  id: TId;
  label: string;
  icon: LucideIcon;
};

export function Sidebar<TId extends string>({
  items,
  activeItem,
  currentUser,
  onItemChange,
}: {
  items: NavigationItem<TId>[];
  activeItem: TId;
  currentUser: AppUser;
  onItemChange: (itemId: TId) => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-zinc-200 bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="flex h-23 items-center border-b border-zinc-200 px-6">
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
              <p className="text-xs font-medium text-zinc-500">
                M. Apascentar Jardim Tropical
              </p>
              <h1 className="text-xl font-bold leading-tight">
                Rede Kids
              </h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemChange(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
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
      </div>
    </aside>
  );
}

function formatRoleLabel(role: AppUser["role"]) {
  if (role === "admin") return "Administrador";
  if (role === "coordinator") return "Coordenação";
  return "Trabalhador";
}
