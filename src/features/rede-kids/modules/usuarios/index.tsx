"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Plus, Search, ShieldCheck, UserCog, UserRound, UsersRound, X } from "lucide-react";
import { createUser } from "@/app/actions";
import {
  EmptyState,
  Heading,
  InputField,
  Modal,
  SelectField,
  SubmitButton,
} from "@/components/ui";
import type { AppData, AppUser } from "@/lib/types";
import { userRoleLabels } from "../../config";
import type { RunAction } from "../../types";

type UserFilter = "all" | AppUser["role"];

const filters: { id: UserFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "admin", label: "Administradores" },
  { id: "coordinator", label: "Coordenação" },
  { id: "worker", label: "Trabalhadores" },
];

export function UsersModule({
  data,
  runAction,
  isPending,
}: {
  data: AppData;
  runAction: RunAction;
  isPending: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<UserFilter>("all");
  const [search, setSearch] = useState("");

  const visibleUsers = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return data.users.filter((user) => {
      const matchesFilter = activeFilter === "all" || user.role === activeFilter;
      const matchesSearch =
        !normalizedSearch ||
        [user.name, user.email, user.workerName, userRoleLabels[user.role]]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, data.users, search]);

  const counts = {
    total: data.users.length,
    admin: data.users.filter((user) => user.role === "admin").length,
    coordinator: data.users.filter((user) => user.role === "coordinator").length,
    worker: data.users.filter((user) => user.role === "worker").length,
  };

  function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    runAction(createUser, formData, "Usuário criado.", () => {
      form.reset();
      setModalOpen(false);
    });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <Heading
          title="Usuários"
          subtitle="Gerencie acessos, perfis e vínculos com trabalhadores"
        />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
        >
          <Plus size={17} aria-hidden="true" />
          Novo usuário
        </button>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UserStat icon={UsersRound} label="Acessos" value={counts.total} tone="emerald" />
        <UserStat icon={ShieldCheck} label="Administradores" value={counts.admin} tone="rose" />
        <UserStat icon={UserCog} label="Coordenação" value={counts.coordinator} tone="sky" />
        <UserStat icon={UserRound} label="Trabalhadores" value={counts.worker} tone="amber" />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <Heading
            title="Usuários cadastrados"
            subtitle={`${visibleUsers.length} de ${data.users.length} acesso(s)`}
          />
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`h-9 rounded-md px-3 text-sm font-semibold ${
                  activeFilter === filter.id
                    ? "bg-emerald-700 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
            <Search size={16} className="text-zinc-500" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar nome, e-mail ou trabalhador"
              className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-zinc-500"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setActiveFilter("all");
            }}
            disabled={!search && activeFilter === "all"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} aria-hidden="true" />
            Limpar
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleUsers.length ? (
            visibleUsers.map((user) => <UserCard key={user.id} user={user} />)
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState text="Nenhum usuário encontrado." />
            </div>
          )}
        </div>
      </section>

      <UserFormModal
        data={data}
        open={modalOpen}
        pending={isPending}
        onClose={() => setModalOpen(false)}
        onSubmit={submitUser}
      />
    </div>
  );
}

function UserFormModal({
  data,
  open,
  pending,
  onClose,
  onSubmit,
}: {
  data: AppData;
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal title="Novo usuário" open={open} onClose={onClose}>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <InputField name="name" label="Nome" required />
        <InputField name="email" label="E-mail" type="email" required />
        <InputField
          name="password"
          label="Senha"
          type="password"
          minLength={6}
          required
        />
        <SelectField name="workerId" label="Trabalhador vinculado">
          <option value="">Sem vínculo</option>
          {data.workers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.fullName}
            </option>
          ))}
        </SelectField>
        <SelectField name="role" label="Perfil" required>
          <option value="worker">Trabalhador</option>
          <option value="coordinator">Coordenação</option>
          <option value="admin">Administrador</option>
        </SelectField>
        <SubmitButton label="Criar usuário" pending={pending} />
      </form>
    </Modal>
  );
}

function UserCard({ user }: { user: AppUser }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-emerald-200 hover:bg-emerald-50/30">
      <div className="flex items-start gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-zinc-100 text-sm font-bold text-emerald-900">
          {getInitials(user.name)}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight text-zinc-950">{user.name}</h3>
          <p className="mt-1 text-sm text-zinc-600 break-words">{user.email}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <InfoTile label="Perfil" value={userRoleLabels[user.role]} />
        <InfoTile label="Trabalhador" value={user.workerName || "Sem trabalhador"} />
        <InfoTile label="Senha" value={user.hasPassword ? "Configurada" : "Pendente"} />
      </div>
    </article>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-zinc-950">{value}</p>
    </section>
  );
}

function UserStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
  tone: "emerald" | "sky" | "amber" | "rose";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-800",
    sky: "bg-sky-50 text-sky-800",
    amber: "bg-amber-50 text-amber-800",
    rose: "bg-rose-50 text-rose-800",
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-zinc-950">{value}</p>
        </div>
        <div className={`grid size-12 place-items-center rounded-lg ${colors[tone]}`}>
          <Icon size={22} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
