"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Palette, Plus, Search, Tags, UsersRound, X } from "lucide-react";
import { createCategory } from "@/app/actions";
import { EmptyState, Heading, InputField, Modal, SubmitButton } from "@/components/ui";
import type { AppData, Category } from "@/lib/types";
import type { RunAction } from "../../types";

export function CategoriesModule({
  data,
  runAction,
  isPending,
}: {
  data: AppData;
  runAction: RunAction;
  isPending: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const categoryUsage = useMemo(() => {
    const usage = new Map<string, number>();

    for (const member of data.members) {
      for (const categoryId of member.categoryIds) {
        usage.set(categoryId, (usage.get(categoryId) ?? 0) + 1);
      }
    }

    return usage;
  }, [data.members]);

  const visibleCategories = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    if (!normalizedSearch) return data.categories;

    return data.categories.filter((category) =>
      category.name.toLowerCase().includes(normalizedSearch),
    );
  }, [data.categories, search]);

  function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    runAction(createCategory, formData, "Categoria salva.", () => {
      form.reset();
      setModalOpen(false);
    });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <Heading
          title="Categorias"
          subtitle="Crie tags para classificar membros, ministérios e observações pastorais"
        />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
        >
          <Plus size={17} aria-hidden="true" />
          Nova categoria
        </button>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <CategoryStat icon={Tags} label="Categorias" value={data.categories.length} tone="emerald" />
        <CategoryStat icon={UsersRound} label="Usos em membros" value={countCategoryUses(categoryUsage)} tone="sky" />
        <CategoryStat icon={Palette} label="Cores" value={new Set(data.categories.map((item) => item.color)).size} tone="amber" />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <Heading
            title="Tags cadastradas"
            subtitle={`${visibleCategories.length} de ${data.categories.length} categoria(s)`}
          />
          <div className="grid gap-3 sm:grid-cols-[minmax(0,300px)_auto]">
            <label className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
              <Search size={16} className="text-zinc-500" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar categoria"
                className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-zinc-500"
              />
            </label>
            <button
              type="button"
              onClick={() => setSearch("")}
              disabled={!search}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} aria-hidden="true" />
              Limpar
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCategories.length ? (
            visibleCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                usageCount={categoryUsage.get(category.id) ?? 0}
              />
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState text="Nenhuma categoria encontrada." />
            </div>
          )}
        </div>
      </section>

      <CategoryFormModal
        open={modalOpen}
        pending={isPending}
        onClose={() => setModalOpen(false)}
        onSubmit={submitCategory}
      />
    </div>
  );
}

function CategoryFormModal({
  open,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal title="Nova categoria" open={open} onClose={onClose}>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <InputField name="name" label="Nome" required />
        <InputField name="color" label="Cor" type="color" defaultValue="#2563eb" />
        <SubmitButton label="Salvar categoria" pending={pending} />
      </form>
    </Modal>
  );
}

function CategoryCard({
  category,
  usageCount,
}: {
  category: Category;
  usageCount: number;
}) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-emerald-200 hover:bg-emerald-50/30">
      <div className="flex items-center gap-3">
        <span
          className="size-10 rounded-xl border border-zinc-200"
          style={{ backgroundColor: category.color }}
        />
        <div>
          <h3 className="text-lg font-bold text-zinc-950">{category.name}</h3>
          <p className="text-sm text-zinc-600">{usageCount} membro(s)</p>
        </div>
      </div>
      <p className="mt-4 rounded-xl bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700">
        {category.color}
      </p>
    </article>
  );
}

function CategoryStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Tags;
  label: string;
  value: number;
  tone: "emerald" | "sky" | "amber";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-800",
    sky: "bg-sky-50 text-sky-800",
    amber: "bg-amber-50 text-amber-800",
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

function countCategoryUses(usage: Map<string, number>) {
  return Array.from(usage.values()).reduce((total, value) => total + value, 0);
}
