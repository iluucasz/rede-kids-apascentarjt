"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Baby,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import { moveChildToClass } from "@/app/actions";
import { ConfirmModal, EmptyState, Heading } from "@/components/ui";
import type { AppData, AppUser, ClassRoom, ProgressItem } from "@/lib/types";
import { RedeKidsShell } from "../../shell";
import type { RunAction } from "../../types";

type ProgressFilter = "all" | "attention" | ProgressItem["status"];

type PendingMove = {
  item: ProgressItem;
  classRoom: ClassRoom;
};

const progressFilters: { id: ProgressFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "attention", label: "Atenção" },
  { id: "move", label: "Trocar turma" },
  { id: "unassigned", label: "Sem turma" },
  { id: "no_rule", label: "Revisar regra" },
  { id: "ok", label: "Em dia" },
];

const statusLabels: Record<ProgressItem["status"], string> = {
  ok: "Em dia",
  move: "Trocar turma",
  unassigned: "Sem turma",
  no_rule: "Revisar regra",
};

const statusStyles: Record<
  ProgressItem["status"],
  {
    badge: string;
    card: string;
    dot: string;
    panel: string;
  }
> = {
  ok: {
    badge: "bg-emerald-50 text-emerald-800",
    card: "border-zinc-200 hover:border-emerald-200",
    dot: "bg-emerald-500",
    panel: "border-emerald-100 bg-emerald-50 text-emerald-950",
  },
  move: {
    badge: "bg-amber-50 text-amber-800",
    card: "border-amber-200 bg-amber-50/20 hover:border-amber-300",
    dot: "bg-amber-500",
    panel: "border-amber-100 bg-amber-50 text-amber-950",
  },
  unassigned: {
    badge: "bg-sky-50 text-sky-800",
    card: "border-sky-200 bg-sky-50/20 hover:border-sky-300",
    dot: "bg-sky-500",
    panel: "border-sky-100 bg-sky-50 text-sky-950",
  },
  no_rule: {
    badge: "bg-zinc-100 text-zinc-700",
    card: "border-zinc-200 hover:border-zinc-300",
    dot: "bg-zinc-400",
    panel: "border-zinc-200 bg-zinc-50 text-zinc-800",
  },
};

export function ProgressPage({
  initialData,
  currentUser,
}: {
  initialData: AppData;
  currentUser: AppUser;
}) {
  const [data, setData] = useState(initialData);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [notice, setNotice] = useState("");
  const [isPending, startTransition] = useTransition();

  function confirmMove() {
    if (!pendingMove) return;

    const formData = new FormData();
    formData.set("childId", pendingMove.item.childId);
    formData.set("classId", pendingMove.classRoom.id);

    startTransition(async () => {
      try {
        const nextData = await moveChildToClass(formData);
        setData(nextData);
        setNotice(`${pendingMove.item.childName} foi movida para ${pendingMove.classRoom.name}.`);
        setPendingMove(null);
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "Não foi possível mover a criança.",
        );
        setPendingMove(null);
      }
    });
  }

  return (
    <RedeKidsShell
      activeModule="progress"
      currentUser={currentUser}
      search=""
      onSearchChange={() => undefined}
      isPending={isPending}
      message={notice}
      showSearch={false}
      showStatus={false}
    >
      <ProgressWorkspace
        data={data}
        notice={notice}
        isPending={isPending}
        onRequestMove={setPendingMove}
      />
      <MoveClassModal
        pendingMove={pendingMove}
        pending={isPending}
        onClose={() => setPendingMove(null)}
        onConfirm={confirmMove}
      />
    </RedeKidsShell>
  );
}

export function ProgressModule({
  data,
  runAction,
  isPending,
}: {
  data: AppData;
  runAction: RunAction;
  isPending: boolean;
}) {
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  function confirmMove() {
    if (!pendingMove) return;

    const formData = new FormData();
    formData.set("childId", pendingMove.item.childId);
    formData.set("classId", pendingMove.classRoom.id);

    runAction(
      moveChildToClass,
      formData,
      `${pendingMove.item.childName} foi movida para ${pendingMove.classRoom.name}.`,
      () => setPendingMove(null),
    );
  }

  return (
    <>
      <ProgressWorkspace
        data={data}
        isPending={isPending}
        onRequestMove={setPendingMove}
      />
      <MoveClassModal
        pendingMove={pendingMove}
        pending={isPending}
        onClose={() => setPendingMove(null)}
        onConfirm={confirmMove}
      />
    </>
  );
}

function ProgressWorkspace({
  data,
  notice,
  isPending,
  onRequestMove,
}: {
  data: AppData;
  notice?: string;
  isPending: boolean;
  onRequestMove: (pendingMove: PendingMove) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<ProgressFilter>("all");
  const [classFilter, setClassFilter] = useState("");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => getProgressCounts(data.progress), [data.progress]);

  const classOptions = useMemo(() => {
    const options = new Set(
      data.progress
        .map((item) => item.currentClassName)
        .filter((name) => name && name !== "Sem turma"),
    );

    return Array.from(options).sort((first, second) =>
      first.localeCompare(second, "pt-BR"),
    );
  }, [data.progress]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return data.progress.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "attention" && item.status !== "ok") ||
        item.status === statusFilter;

      const matchesClass = !classFilter || item.currentClassName === classFilter;

      const matchesSearch =
        !normalizedSearch ||
        [
          item.childName,
          item.currentClassName,
          item.recommendedClassName,
          item.message,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesClass && matchesSearch;
    });
  }, [classFilter, data.progress, search, statusFilter]);

  const hasActiveFilters = Boolean(
    search.trim() || classFilter || statusFilter !== "all",
  );

  function clearFilters() {
    setSearch("");
    setClassFilter("");
    setStatusFilter("all");
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <Heading
          title="Progresso"
          subtitle="Acompanhe a faixa etária das crianças e resolva trocas de turma com segurança"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <StatusSummary label="Em dia" value={counts.ok} tone="emerald" />
          <StatusSummary label="Pendências" value={counts.attention} tone="amber" />
        </div>
      </section>

      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ProgressStat icon={Baby} label="Crianças" value={counts.total} tone="emerald" />
        <ProgressStat
          icon={ArrowRightLeft}
          label="Trocar turma"
          value={counts.move}
          tone="amber"
        />
        <ProgressStat
          icon={UsersRound}
          label="Sem turma"
          value={counts.unassigned}
          tone="sky"
        />
        <ProgressStat
          icon={AlertTriangle}
          label="Revisar cadastro"
          value={counts.noRule}
          tone="rose"
        />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <Heading
              title="Crianças por faixa etária"
              subtitle={`${filteredItems.length} de ${data.progress.length} criança(s)`}
            />
            <div className="flex flex-wrap gap-2">
              {progressFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id)}
                  className={`h-9 rounded-md px-3 text-sm font-semibold ${
                    statusFilter === filter.id
                      ? "bg-emerald-700 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px_auto]">
            <label className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
              <Search size={16} className="text-zinc-500" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar criança, turma ou aviso"
                className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-zinc-500"
              />
            </label>

            <label className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
              <UsersRound size={16} className="text-zinc-500" aria-hidden="true" />
              <select
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
                className="h-full w-full min-w-0 bg-transparent outline-none"
                aria-label="Filtrar por turma atual"
              >
                <option value="">Turma atual</option>
                {classOptions.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                hasActiveFilters
                  ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  : "border-zinc-200 bg-white text-zinc-400"
              }`}
            >
              <X size={16} aria-hidden="true" />
              Limpar filtros
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {filteredItems.length ? (
            filteredItems.map((item) => (
              <ProgressCard
                key={item.childId}
                item={item}
                recommendedClass={findRecommendedClass(data.classes, item)}
                pending={isPending}
                onRequestMove={onRequestMove}
              />
            ))
          ) : (
            <div className="xl:col-span-2">
              <EmptyState text="Nenhuma criança encontrada para os filtros atuais." />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ProgressCard({
  item,
  recommendedClass,
  pending,
  onRequestMove,
}: {
  item: ProgressItem;
  recommendedClass?: ClassRoom;
  pending: boolean;
  onRequestMove: (pendingMove: PendingMove) => void;
}) {
  const styles = statusStyles[item.status];
  const canMove =
    Boolean(recommendedClass) &&
    (item.status === "move" || item.status === "unassigned");

  return (
    <article
      className={`rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${styles.card}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-zinc-100 text-sm font-bold text-emerald-900">
            {getInitials(item.childName)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <h3 className="text-lg font-bold leading-tight text-zinc-950">
                {item.childName}
              </h3>
              <span className={`rounded-md px-2 py-1 text-xs font-bold ${styles.badge}`}>
                {statusLabels[item.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600">{formatAge(item.age)}</p>
          </div>
        </div>

        {canMove && recommendedClass ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onRequestMove({ item, classRoom: recommendedClass })}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            <ArrowRightLeft size={16} aria-hidden="true" />
            {item.status === "unassigned" ? "Vincular turma" : "Mover turma"}
          </button>
        ) : (
          <span className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold text-zinc-500">
            Sem ação
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-stretch">
        <ClassPanel label="Turma atual" value={item.currentClassName} />
        <div className="hidden items-center justify-center text-zinc-400 sm:flex">
          <ArrowRight size={20} aria-hidden="true" />
        </div>
        <ClassPanel label="Turma indicada" value={item.recommendedClassName} />
      </div>

      <div className={`mt-4 rounded-xl border px-4 py-3 ${styles.panel}`}>
        <div className="flex gap-3">
          <span className={`mt-2 size-2 shrink-0 rounded-full ${styles.dot}`} />
          <p className="text-sm font-semibold leading-6">{item.message}</p>
        </div>
      </div>
    </article>
  );
}

function MoveClassModal({
  pendingMove,
  pending,
  onClose,
  onConfirm,
}: {
  pendingMove: PendingMove | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmModal
      title="Mover criança"
      description={
        pendingMove
          ? `${pendingMove.item.childName} sairá de "${pendingMove.item.currentClassName}" e será vinculada à turma "${pendingMove.classRoom.name}".`
          : "Confirme a mudança de turma."
      }
      confirmLabel="Mover criança"
      open={Boolean(pendingMove)}
      pending={pending}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function ClassPanel({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold leading-5 text-zinc-950">{value}</p>
    </section>
  );
}

function StatusSummary({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber";
}) {
  const styles = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <div className={`rounded-lg border px-4 py-2 ${styles[tone]}`}>
      <p className="text-xs font-semibold">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function ProgressStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Baby;
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

function findRecommendedClass(classes: ClassRoom[], item: ProgressItem) {
  return classes.find((classRoom) => classRoom.name === item.recommendedClassName);
}

function getProgressCounts(items: ProgressItem[]) {
  const counts = {
    total: items.length,
    ok: 0,
    move: 0,
    unassigned: 0,
    noRule: 0,
    attention: 0,
  };

  for (const item of items) {
    if (item.status === "ok") counts.ok += 1;
    if (item.status === "move") counts.move += 1;
    if (item.status === "unassigned") counts.unassigned += 1;
    if (item.status === "no_rule") counts.noRule += 1;
    if (item.status !== "ok") counts.attention += 1;
  }

  return counts;
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

function formatAge(age: number | null) {
  if (age === null) return "Idade pendente";
  if (age === 1) return "1 ano";

  return `${age} anos`;
}
