"use client";

import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useMemo, useState } from "react";
import {
  Edit2,
  Eye,
  HandHeart,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { createWorker, deleteWorker, updateWorker } from "@/app/actions";
import {
  ConfirmModal,
  EmptyState,
  Heading,
  InputField,
  Modal,
  SubmitButton,
  TextareaField,
} from "@/components/ui";
import type { AppData, Worker } from "@/lib/types";
import type { ActionFn, RunAction } from "../../types";

type WorkerFilter = "all" | "minister" | "support" | "coordination" | "service";

const workerRoles = ["Ministro", "Apoio", "Coordenação", "Lanche", "Limpeza"];

const filters: { id: WorkerFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "minister", label: "Ministros" },
  { id: "support", label: "Apoio" },
  { id: "coordination", label: "Coordenação" },
  { id: "service", label: "Serviço" },
];

export function WorkersModule({
  data,
  runAction,
  isPending,
}: {
  data: AppData;
  runAction: RunAction;
  isPending: boolean;
}) {
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<WorkerFilter>("all");
  const [search, setSearch] = useState("");
  const [editingWorker, setEditingWorker] = useState<Worker | undefined>();
  const [viewingWorker, setViewingWorker] = useState<Worker | null>(null);
  const [deletingWorker, setDeletingWorker] = useState<Worker | null>(null);

  const counts = useMemo(() => {
    return {
      total: data.workers.length,
      minister: data.workers.filter((worker) => worker.roles.includes("Ministro")).length,
      support: data.workers.filter((worker) => worker.roles.includes("Apoio")).length,
      coordination: data.workers.filter((worker) =>
        worker.roles.includes("Coordenação"),
      ).length,
    };
  }, [data.workers]);

  const visibleWorkers = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return data.workers.filter((worker) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "minister" && worker.roles.includes("Ministro")) ||
        (activeFilter === "support" && worker.roles.includes("Apoio")) ||
        (activeFilter === "coordination" && worker.roles.includes("Coordenação")) ||
        (activeFilter === "service" &&
          (worker.roles.includes("Lanche") || worker.roles.includes("Limpeza")));

      const matchesSearch =
        !normalizedSearch ||
        [worker.fullName, worker.phone, worker.bio, worker.roles.join(" "), worker.notes]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, data.workers, search]);

  function openNewWorker() {
    setEditingWorker(undefined);
    setWorkerModalOpen(true);
  }

  function openEditWorker(worker: Worker) {
    setEditingWorker(worker);
    setWorkerModalOpen(true);
  }

  function openWorkerDetails(worker: Worker) {
    setViewingWorker(worker);
  }

  function submitWorker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const action: ActionFn = editingWorker ? updateWorker : createWorker;

    runAction(
      action,
      formData,
      editingWorker ? "Trabalhador atualizado." : "Trabalhador cadastrado.",
      () => {
        form.reset();
        setWorkerModalOpen(false);
        setEditingWorker(undefined);
      },
    );
  }

  function confirmDeleteWorker() {
    if (!deletingWorker) return;

    const formData = new FormData();
    formData.set("workerId", deletingWorker.id);

    runAction(deleteWorker, formData, "Trabalhador excluído.", () =>
      setDeletingWorker(null),
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <Heading
          title="Trabalhadores"
          subtitle="Organize ministros, apoios, coordenação e equipes de serviço"
        />
        <button
          type="button"
          onClick={openNewWorker}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
        >
          <Plus size={17} aria-hidden="true" />
          Novo trabalhador
        </button>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WorkerStat icon={UsersRound} label="Trabalhadores" value={counts.total} tone="emerald" />
        <WorkerStat icon={HandHeart} label="Ministros" value={counts.minister} tone="sky" />
        <WorkerStat icon={Sparkles} label="Apoio" value={counts.support} tone="amber" />
        <WorkerStat icon={ShieldCheck} label="Coordenação" value={counts.coordination} tone="rose" />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <Heading
            title="Equipe cadastrada"
            subtitle={`${visibleWorkers.length} de ${data.workers.length} pessoa(s)`}
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
              placeholder="Buscar por nome, telefone, perfil ou função"
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
          {visibleWorkers.length ? (
            visibleWorkers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                isPending={isPending}
                onOpen={openWorkerDetails}
                onEdit={openEditWorker}
                onDelete={setDeletingWorker}
              />
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState text="Nenhum trabalhador encontrado." />
            </div>
          )}
        </div>
      </section>

      <WorkerFormModal
        worker={editingWorker}
        open={workerModalOpen}
        pending={isPending}
        onClose={() => {
          setWorkerModalOpen(false);
          setEditingWorker(undefined);
        }}
        onSubmit={submitWorker}
      />
      <WorkerDetailsModal
        worker={viewingWorker ?? undefined}
        open={Boolean(viewingWorker)}
        onClose={() => setViewingWorker(null)}
      />
      <ConfirmModal
        title="Excluir trabalhador"
        description={`O cadastro de "${deletingWorker?.fullName ?? "trabalhador"}" será removido. Escalas, aulas e usuários vinculados ficarão sem esse trabalhador associado.`}
        confirmLabel="Excluir trabalhador"
        open={Boolean(deletingWorker)}
        pending={isPending}
        destructive
        onClose={() => setDeletingWorker(null)}
        onConfirm={confirmDeleteWorker}
      />
    </div>
  );
}

function WorkerFormModal({
  worker,
  open,
  pending,
  onClose,
  onSubmit,
}: {
  worker?: Worker;
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal
      title={worker ? "Editar trabalhador" : "Novo trabalhador"}
      open={open}
      onClose={onClose}
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        {worker ? <input type="hidden" name="workerId" value={worker.id} /> : null}
        <InputField
          name="fullName"
          label="Nome completo"
          required
          defaultValue={worker?.fullName}
        />
        <InputField name="phone" label="Telefone" defaultValue={worker?.phone} />
        <TextareaField
          name="bio"
          label="Quem é esse trabalhador?"
          rows={4}
          defaultValue={worker?.bio}
          placeholder="Conte brevemente quem ele é, sua história ou como serve na Rede Kids."
        />
        <div className="grid gap-2 text-sm font-semibold text-zinc-700">
          Funções
          <div className="grid gap-2 sm:grid-cols-2">
            {workerRoles.map((role) => (
              <label
                key={role}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 font-medium"
              >
                <input
                  type="checkbox"
                  name="roles"
                  value={role}
                  defaultChecked={worker?.roles.includes(role)}
                  className="size-4 accent-emerald-700"
                />
                {role}
              </label>
            ))}
          </div>
        </div>
        <TextareaField
          name="notes"
          label="Observações"
          rows={4}
          defaultValue={worker?.notes}
        />
        <SubmitButton
          label={worker ? "Salvar trabalhador" : "Cadastrar trabalhador"}
          pending={pending}
        />
      </form>
    </Modal>
  );
}

function WorkerCard({
  worker,
  isPending,
  onOpen,
  onEdit,
  onDelete,
}: {
  worker: Worker;
  isPending: boolean;
  onOpen: (worker: Worker) => void;
  onEdit: (worker: Worker) => void;
  onDelete: (worker: Worker) => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Abrir detalhes de ${worker.fullName}`}
      onClick={() => onOpen(worker)}
      onKeyDown={(event) => handleCardKeyDown(event, () => onOpen(worker))}
      className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-emerald-200 hover:bg-emerald-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-zinc-100 text-sm font-bold text-emerald-900">
            {getInitials(worker.fullName)}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-tight text-zinc-950">{worker.fullName}</h3>
            <p className="mt-1 text-sm text-zinc-600">{worker.phone || "Sem telefone"}</p>
            <p className="text-sm text-zinc-600">
              {worker.bio ? "Perfil preenchido" : "Perfil ainda não informado"}
            </p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap lg:justify-end">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(worker);
            }}
            disabled={isPending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 sm:w-auto"
          >
            <Eye size={15} aria-hidden="true" />
            Ver
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(worker);
            }}
            disabled={isPending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 sm:w-auto"
          >
            <Edit2 size={15} aria-hidden="true" />
            Editar
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(worker);
            }}
            disabled={isPending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60 sm:w-auto"
          >
            <Trash2 size={15} aria-hidden="true" />
            Excluir
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {worker.roles.length ? (
          worker.roles.map((role) => (
            <span
              key={role}
              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
            >
              {role}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
            Sem função
          </span>
        )}
      </div>

      {worker.bio ? (
        <section className="mt-4 rounded-xl bg-zinc-50 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Quem é
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
            {worker.bio}
          </p>
        </section>
      ) : null}

      {worker.notes ? (
        <p className="mt-4 text-sm leading-6 text-zinc-700">{worker.notes}</p>
      ) : null}
    </article>
  );
}

function WorkerDetailsModal({
  worker,
  open,
  onClose,
}: {
  worker?: Worker;
  open: boolean;
  onClose: () => void;
}) {
  if (!worker) return null;

  return (
    <Modal
      title="Detalhes do trabalhador"
      open={open}
      onClose={onClose}
      panelClassName="max-w-3xl"
    >
      <div className="grid gap-5">
        <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-lg font-bold text-emerald-900 shadow-sm ring-1 ring-zinc-200">
                {getInitials(worker.fullName)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Trabalhador
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-950">
                  {worker.fullName}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {worker.phone || "Sem telefone"}
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              {worker.active ? "Cadastro ativo" : "Cadastro inativo"}
            </span>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <DetailPanel label="Telefone" value={worker.phone || "Sem telefone"} />
          <section className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Funções
            </p>
            {worker.roles.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {worker.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                  >
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-zinc-500">Sem função cadastrada.</p>
            )}
          </section>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-zinc-900">Quem é esse trabalhador</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
            {worker.bio || "Sem apresentação registrada."}
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-zinc-900">Observações</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
            {worker.notes || "Sem observações registradas."}
          </p>
        </section>
      </div>
    </Modal>
  );
}

function DetailPanel({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-zinc-900">
        {value}
      </p>
    </section>
  );
}

function WorkerStat({
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

function handleCardKeyDown(
  event: ReactKeyboardEvent<HTMLElement>,
  onOpen: () => void,
) {
  if (event.target !== event.currentTarget) {
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onOpen();
  }
}
