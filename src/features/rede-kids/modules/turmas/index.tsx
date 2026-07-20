"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Baby, CalendarDays, Edit2, Layers3, Plus, Search, Trash2, UsersRound, X } from "lucide-react";
import { createClassRoom, deleteClassRoom, updateClassRoom } from "@/app/actions";
import {
  ConfirmModal,
  EmptyState,
  Heading,
  InputField,
  Modal,
  SelectField,
  SubmitButton,
  TextareaField,
} from "@/components/ui";
import type { AppData, ClassRoom } from "@/lib/types";
import type { ActionFn, RunAction } from "../../types";

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
  const [editingClass, setEditingClass] = useState<ClassRoom | undefined>();
  const [deletingClass, setDeletingClass] = useState<ClassRoom | null>(null);
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

  function openNewClass() {
    setEditingClass(undefined);
    setModalOpen(true);
  }

  function openEditClass(classRoom: ClassRoom) {
    setEditingClass(classRoom);
    setModalOpen(true);
  }

  function submitClassRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const action: ActionFn = editingClass ? updateClassRoom : createClassRoom;

    runAction(
      action,
      formData,
      editingClass ? "Turma atualizada." : "Turma criada.",
      () => {
        form.reset();
        setModalOpen(false);
        setEditingClass(undefined);
      },
    );
  }

  function confirmDeleteClass() {
    if (!deletingClass) return;

    const formData = new FormData();
    formData.set("classId", deletingClass.id);

    runAction(deleteClassRoom, formData, "Turma excluída.", () =>
      setDeletingClass(null),
    );
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
          onClick={openNewClass}
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
              <ClassCard
                key={classRoom.id}
                classRoom={classRoom}
                isPending={isPending}
                onEdit={openEditClass}
                onDelete={setDeletingClass}
              />
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState text="Nenhuma turma encontrada." />
            </div>
          )}
        </div>
      </section>

      <ClassFormModal
        classRoom={editingClass}
        open={modalOpen}
        pending={isPending}
        onClose={() => {
          setModalOpen(false);
          setEditingClass(undefined);
        }}
        onSubmit={submitClassRoom}
      />
      <ConfirmModal
        title="Excluir turma"
        description={`A turma "${deletingClass?.name ?? ""}" será removida. Crianças vinculadas ficarão sem esta turma.`}
        confirmLabel="Excluir turma"
        open={Boolean(deletingClass)}
        pending={isPending}
        destructive
        onClose={() => setDeletingClass(null)}
        onConfirm={confirmDeleteClass}
      />
    </div>
  );
}

function ClassFormModal({
  classRoom,
  open,
  pending,
  onClose,
  onSubmit,
}: {
  classRoom?: ClassRoom;
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isEditing = Boolean(classRoom);

  return (
    <Modal title={isEditing ? "Editar turma" : "Nova turma"} open={open} onClose={onClose}>
      <form key={classRoom?.id ?? "new"} className="grid gap-4" onSubmit={onSubmit}>
        {classRoom ? (
          <input type="hidden" name="classId" value={classRoom.id} />
        ) : null}
        <InputField
          name="name"
          label="Nome da turma"
          placeholder="2 a 4 anos"
          defaultValue={classRoom?.name ?? ""}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            name="minAge"
            label="Idade mínima"
            type="number"
            min="0"
            defaultValue={classRoom ? String(classRoom.minAge) : ""}
            required
          />
          <InputField
            name="maxAge"
            label="Idade máxima"
            type="number"
            min="0"
            defaultValue={classRoom ? String(classRoom.maxAge) : ""}
            required
          />
        </div>
        <InputField
          name="serviceSchedule"
          label="Escala"
          placeholder="Domingo manhã"
          defaultValue={classRoom?.serviceSchedule ?? ""}
        />
        {isEditing ? (
          <SelectField
            name="active"
            label="Situação"
            defaultValue={classRoom?.active ? "true" : "false"}
          >
            <option value="true">Ativa</option>
            <option value="false">Inativa</option>
          </SelectField>
        ) : null}
        <TextareaField
          name="notes"
          label="Observações"
          rows={4}
          defaultValue={classRoom?.notes ?? ""}
        />
        <SubmitButton label={isEditing ? "Salvar alterações" : "Criar turma"} pending={pending} />
      </form>
    </Modal>
  );
}

function ClassCard({
  classRoom,
  isPending,
  onEdit,
  onDelete,
}: {
  classRoom: ClassRoom;
  isPending: boolean;
  onEdit: (classRoom: ClassRoom) => void;
  onDelete: (classRoom: ClassRoom) => void;
}) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-emerald-200 hover:bg-emerald-50/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-950">{classRoom.name}</h3>
          <p className="mt-1 text-sm text-zinc-600">
            {classRoom.minAge} a {classRoom.maxAge} anos
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            classRoom.active
              ? "bg-sky-50 text-sky-800"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
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

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(classRoom)}
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
        >
          <Edit2 size={15} aria-hidden="true" />
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(classRoom)}
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
        >
          <Trash2 size={15} aria-hidden="true" />
          Excluir
        </button>
      </div>
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
