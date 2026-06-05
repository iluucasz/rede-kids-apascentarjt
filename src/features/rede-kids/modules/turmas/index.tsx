"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Baby, CalendarDays, Layers3, Plus, Search, UsersRound, X } from "lucide-react";
import { createClassRoom } from "@/app/actions";
import {
  EmptyState,
  Heading,
  InputField,
  Modal,
  SubmitButton,
  TextareaField,
} from "@/components/ui";
import type { AppData, ClassRoom } from "@/lib/types";
import type { RunAction } from "../../types";

export function ClassesModule({
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

  const childTotal = data.classes.reduce(
    (total, classRoom) => total + classRoom.childCount,
    0,
  );
  const emptyClasses = data.classes.filter((classRoom) => classRoom.childCount === 0).length;
  const visibleClasses = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    if (!normalizedSearch) return data.classes;

    return data.classes.filter((classRoom) =>
      [
        classRoom.name,
        classRoom.serviceSchedule,
        classRoom.notes,
        `${classRoom.minAge} ${classRoom.maxAge}`,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [data.classes, search]);

  function submitClassRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    runAction(createClassRoom, formData, "Turma criada.", () => {
      form.reset();
      setModalOpen(false);
    });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <Heading
          title="Turmas"
          subtitle="Configure faixas etárias e acompanhe quantas crianças estão em cada turma"
        />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
        >
          <Plus size={17} aria-hidden="true" />
          Nova turma
        </button>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ClassStat icon={Layers3} label="Turmas" value={data.classes.length} tone="emerald" />
        <ClassStat icon={Baby} label="Crianças vinculadas" value={childTotal} tone="sky" />
        <ClassStat icon={UsersRound} label="Turmas ocupadas" value={data.classes.length - emptyClasses} tone="amber" />
        <ClassStat icon={CalendarDays} label="Sem crianças" value={emptyClasses} tone="rose" />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <Heading
            title="Turmas cadastradas"
            subtitle={`${visibleClasses.length} de ${data.classes.length} turma(s)`}
          />
          <div className="grid gap-3 sm:grid-cols-[minmax(0,340px)_auto]">
            <label className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
              <Search size={16} className="text-zinc-500" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar turma"
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
          {visibleClasses.length ? (
            visibleClasses.map((classRoom) => (
              <ClassCard key={classRoom.id} classRoom={classRoom} />
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState text="Nenhuma turma encontrada." />
            </div>
          )}
        </div>
      </section>

      <ClassFormModal
        open={modalOpen}
        pending={isPending}
        onClose={() => setModalOpen(false)}
        onSubmit={submitClassRoom}
      />
    </div>
  );
}

function ClassFormModal({
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
    <Modal title="Nova turma" open={open} onClose={onClose}>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <InputField name="name" label="Nome da turma" placeholder="2 a 4 anos" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField name="minAge" label="Idade mínima" type="number" min="0" required />
          <InputField name="maxAge" label="Idade máxima" type="number" min="0" required />
        </div>
        <InputField name="serviceSchedule" label="Escala" placeholder="Domingo manhã" />
        <TextareaField name="notes" label="Observações" rows={4} />
        <SubmitButton label="Criar turma" pending={pending} />
      </form>
    </Modal>
  );
}

function ClassCard({ classRoom }: { classRoom: ClassRoom }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-emerald-200 hover:bg-emerald-50/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-950">{classRoom.name}</h3>
          <p className="mt-1 text-sm text-zinc-600">
            {classRoom.minAge} a {classRoom.maxAge} anos
          </p>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800">
          {classRoom.active ? "Ativa" : "Inativa"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoTile label="Crianças" value={`${classRoom.childCount}`} />
        <InfoTile label="Escala" value={classRoom.serviceSchedule || "Sem escala"} />
      </div>

      {classRoom.notes ? (
        <p className="mt-4 text-sm leading-6 text-zinc-700">{classRoom.notes}</p>
      ) : null}
    </article>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-zinc-950">{value}</p>
    </div>
  );
}

function ClassStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Layers3;
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
