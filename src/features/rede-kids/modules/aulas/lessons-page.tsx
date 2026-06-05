"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Edit2,
  FileText,
  MoreVertical,
  Plus,
  Search,
  Share2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { createLessonAndOpen, deleteLesson, updateLesson } from "@/app/actions";
import { ConfirmModal, EmptyState, Heading } from "@/components/ui";
import type { AppData, AppUser, AttendanceStatus } from "@/lib/types";
import { RedeKidsShell } from "../../shell";
import { formatLessonCardDate } from "../../utils";
import { LessonFormModal } from "./components";
import { shareLessonLink } from "./share-lesson-link";

const NO_CLASS_FILTER = "__no_class__";

export function LessonsPage({
  initialData,
  currentUser,
}: {
  initialData: AppData;
  currentUser: AppUser;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [classFilter, setClassFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [lessonNameFilter, setLessonNameFilter] = useState("");
  const [message, setMessage] = useState("Aulas carregadas.");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [openMenuLessonId, setOpenMenuLessonId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const classOptions = useMemo(() => {
    const options = new Map<string, string>();

    for (const lesson of data.lessons) {
      const value = lesson.classId || NO_CLASS_FILTER;
      const label = lesson.className || "Sem turma";

      if (!options.has(value)) {
        options.set(value, label);
      }
    }

    return Array.from(options, ([value, label]) => ({ value, label })).sort(
      (first, second) => first.label.localeCompare(second.label, "pt-BR"),
    );
  }, [data.lessons]);
  const classChildCounts = useMemo(
    () => new Map(data.classes.map((classRoom) => [classRoom.id, classRoom.childCount])),
    [data.classes],
  );

  const filteredLessons = useMemo(() => {
    const normalizedLessonName = lessonNameFilter.toLowerCase().trim();

    return data.lessons.filter((lesson) => {
      const matchesClass =
        !classFilter || (lesson.classId || NO_CLASS_FILTER) === classFilter;

      const matchesLessonName =
        !normalizedLessonName ||
        lesson.theme.toLowerCase().includes(normalizedLessonName);

      const matchesDate =
        !dateFilter || toDateValue(lesson.scheduledAt) === dateFilter;

      return matchesClass && matchesLessonName && matchesDate;
    });
  }, [classFilter, data.lessons, dateFilter, lessonNameFilter]);

  const hasActiveFilters = Boolean(
    classFilter || dateFilter || lessonNameFilter.trim(),
  );
  const editingLesson = data.lessons.find((item) => item.id === editingLessonId) ?? null;
  const deletingLesson = data.lessons.find((item) => item.id === deletingLessonId) ?? null;

  useEffect(() => {
    if (!openMenuLessonId) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuLessonId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenuLessonId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuLessonId]);

  function openDateFilterPicker() {
    const input = dateInputRef.current;

    if (!input) return;

    input.focus();

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch {
        // Focus is the fallback when the browser blocks programmatic picker opening.
      }
    }
  }

  function closeLessonModal() {
    setIsModalOpen(false);
    setEditingLessonId(null);
  }

  function openCreateLessonModal() {
    setEditingLessonId(null);
    setIsModalOpen(true);
  }

  function openEditLessonModal(lessonId: string) {
    setEditingLessonId(lessonId);
    setIsModalOpen(true);
    setOpenMenuLessonId(null);
  }

  function openDeleteLessonModal(lessonId: string) {
    setDeletingLessonId(lessonId);
    setOpenMenuLessonId(null);
  }

  async function shareLesson(lessonId: string, lessonTheme: string) {
    try {
      const nextMessage = await shareLessonLink({ lessonId, lessonTheme });
      setMessage(nextMessage);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível compartilhar a aula.",
      );
    } finally {
      setOpenMenuLessonId(null);
    }
  }

  function submitLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentEditingLessonId = editingLessonId;

    startTransition(async () => {
      try {
        if (currentEditingLessonId) {
          const nextData = await updateLesson(formData);
          setData(nextData);
          setMessage("Aula atualizada.");
          closeLessonModal();
          return;
        }

        const result = await createLessonAndOpen(formData);
        setData(result.data);
        setMessage(`Aula ${result.lessonId} criada aberta.`);
        closeLessonModal();
        form.reset();
        router.push(`/aulas/${result.lessonId}`);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Não foi possível criar a aula.",
        );
      }
    });
  }

  function confirmDeleteLesson() {
    if (!deletingLessonId) return;

    const currentDeletingLessonId = deletingLessonId;
    const formData = new FormData();
    formData.set("lessonId", currentDeletingLessonId);

    startTransition(async () => {
      try {
        const nextData = await deleteLesson(formData);
        setData(nextData);
        setMessage("Aula excluída.");
        setDeletingLessonId(null);
        setOpenMenuLessonId(null);

        if (editingLessonId === currentDeletingLessonId) {
          closeLessonModal();
        }
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Não foi possível excluir a aula.",
        );
      }
    });
  }

  return (
    <RedeKidsShell
      activeModule="lessons"
      currentUser={currentUser}
      search=""
      onSearchChange={() => undefined}
      isPending={isPending}
      message={message}
      showSearch={false}
      showStatus={false}
    >
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <Heading
            title="Aulas"
            subtitle="Crie, abra e acompanhe presença por turma"
          />
          <button
            type="button"
            onClick={openCreateLessonModal}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
          >
            <Plus size={17} aria-hidden="true" />
            Criar Aula
          </button>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-4">
            <Heading
              title="Aulas cadastradas"
              subtitle={
                hasActiveFilters
                  ? `${filteredLessons.length} de ${data.lessons.length} aula(s)`
                  : `${data.lessons.length} aula(s)`
              }
            />

            <div className="grid gap-3 xl:grid-cols-2">
              <label className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
                <Users size={16} className="text-zinc-500" aria-hidden="true" />
                <select
                  value={classFilter}
                  onChange={(event) => setClassFilter(event.target.value)}
                  className="h-full w-full min-w-0 bg-transparent outline-none"
                  aria-label="Filtrar por turma"
                >
                  <option value="">Turma</option>
                  {classOptions.map((classOption) => (
                    <option key={classOption.value} value={classOption.value}>
                      {classOption.label}
                    </option>
                  ))}
                </select>
              </label>

              <label
                className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700"
                onClick={openDateFilterPicker}
              >
                <CalendarDays size={16} className="text-zinc-500" aria-hidden="true" />
                <span className="shrink-0 text-zinc-500">Data</span>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="h-full w-full min-w-0 bg-transparent outline-none"
                  aria-label="Filtrar por data"
                />
              </label>

              <div className="grid gap-3 xl:col-span-2 xl:grid-cols-[minmax(0,1fr)_auto]">
                <label className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
                  <Search size={16} className="text-zinc-500" aria-hidden="true" />
                  <input
                    type="search"
                    value={lessonNameFilter}
                    onChange={(event) => setLessonNameFilter(event.target.value)}
                    placeholder="Nome da aula"
                    className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-zinc-500"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setClassFilter("");
                    setDateFilter("");
                    setLessonNameFilter("");
                  }}
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
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {filteredLessons.length ? (
              filteredLessons.map((lesson) => {
                const isMenuOpen = openMenuLessonId === lesson.id;
                const isClosed = lesson.status === "closed";

                return (
                  <article
                    key={lesson.id}
                    className="group relative flex h-full flex-col rounded-xl border border-zinc-200 bg-zinc-50/40 p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:shadow-sm"
                  >
                    <Link
                      href={`/aulas/${lesson.id}`}
                      aria-label={`Abrir aula ${lesson.theme}`}
                      className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    />

                    <div className="pointer-events-none relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="pointer-events-none flex min-w-0 flex-wrap items-center gap-2">
                          <span
                            className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${
                              lesson.status === "open"
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-rose-50 text-rose-800"
                            }`}
                          >
                            {lesson.status === "open" ? "Aberta" : "Fechada"}
                          </span>
                          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                            {lesson.id}
                          </span>
                        </div>

                        <div
                          ref={isMenuOpen ? menuRef : null}
                          className="pointer-events-auto relative shrink-0"
                        >
                          <button
                            type="button"
                            aria-label={`Ações da aula ${lesson.id}`}
                            aria-expanded={isMenuOpen}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setOpenMenuLessonId((current) =>
                                current === lesson.id ? null : lesson.id,
                              );
                            }}
                            className="inline-flex size-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
                          >
                            <MoreVertical size={16} aria-hidden="true" />
                          </button>

                          {isMenuOpen ? (
                            <div className="absolute right-0 top-11 z-20 min-w-44 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">
                              <button
                                type="button"
                                onClick={async (event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  await shareLesson(lesson.id, lesson.theme);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                              >
                                <Share2 size={15} aria-hidden="true" />
                                Compartilhar
                              </button>
                              <button
                                type="button"
                                disabled={isPending || isClosed}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  openEditLessonModal(lesson.id);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Edit2 size={15} aria-hidden="true" />
                                Editar
                              </button>
                              <button
                                type="button"
                                disabled={isPending || isClosed}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  openDeleteLessonModal(lesson.id);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 size={15} aria-hidden="true" />
                                Excluir aula
                              </button>
                              {isClosed ? (
                                <p className="px-3 pb-1 pt-2 text-[11px] font-medium text-zinc-500">
                                  Disponível apenas para aulas abertas.
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="pointer-events-none">
                        <div className="mt-4">
                          <p className="text-lg font-bold text-zinc-950 transition group-hover:text-emerald-800">
                            {lesson.theme}
                          </p>
                          <p className="mt-1 text-sm text-zinc-600">
                            {lesson.className || "Sem turma"}
                          </p>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <LessonMetaItem
                            label="Ministro"
                            value={lesson.ministerName || "Sem ministro"}
                          />
                          <LessonMetaItem
                            label="Apoio"
                            value={lesson.supportName || "Sem apoio"}
                          />
                          <LessonMetaItem
                            label="Data"
                            value={formatLessonCardDate(lesson.scheduledAt)}
                          />
                          <LessonMetaItem
                            label="Texto bíblico"
                            value={formatScriptureText(lesson.scriptureText)}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700">
                            <FileText size={14} aria-hidden="true" />
                            {lesson.attachmentCount} anexo(s)
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700">
                            <Users size={14} aria-hidden="true" />
                            {formatChildrenCount(
                              lesson.totalChildrenSnapshot,
                              lesson.classId ? classChildCounts.get(lesson.classId) : undefined,
                            )}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-200 pt-4">
                          <AttendanceBadge status="present" count={lesson.presentCount} />
                          <AttendanceBadge status="absent" count={lesson.absentCount} />
                          <AttendanceBadge status="justified" count={lesson.justifiedCount} />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="xl:col-span-2 2xl:col-span-3">
                <EmptyState text="Nenhuma aula encontrada." />
              </div>
            )}
          </div>
        </section>
      </div>

      <LessonFormModal
        data={data}
        lesson={editingLesson ?? undefined}
        open={isModalOpen}
        pending={isPending}
        onClose={closeLessonModal}
        onSubmit={submitLesson}
      />
      <ConfirmModal
        title="Excluir aula"
        description={`A aula "${deletingLesson?.theme ?? deletingLesson?.id ?? "selecionada"}" será excluída com as chamadas e anexos vinculados. Depois de confirmar, não será possível recuperar por esta tela.`}
        confirmLabel="Excluir aula"
        open={Boolean(deletingLessonId)}
        pending={isPending}
        destructive
        onClose={() => setDeletingLessonId(null)}
        onConfirm={confirmDeleteLesson}
      />
    </RedeKidsShell>
  );
}

function LessonMetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 wrap-break-word whitespace-pre-line text-sm font-semibold leading-5 text-zinc-900">
        {value}
      </p>
    </div>
  );
}

function formatChildrenCount(
  value: number | null | undefined,
  fallbackValue?: number,
) {
  const resolvedValue =
    typeof value === "number" && value > 0
      ? value
      : typeof fallbackValue === "number"
        ? fallbackValue
        : typeof value === "number"
          ? value
          : 0;

  if (resolvedValue === 1) return "1 criança";

  return `${resolvedValue} crianças`;
}

function formatScriptureText(value: string) {
  const references = value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!references.length) {
    return "Sem texto bíblico";
  }

  return references.join(", ");
}

function toDateValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function AttendanceBadge({
  status,
  count,
}: {
  status: AttendanceStatus;
  count: number;
}) {
  const styles = {
    present: "bg-emerald-50 text-emerald-800",
    absent: "bg-rose-50 text-rose-800",
    justified: "bg-amber-50 text-amber-800",
  };
  const labels = {
    present: "Presença",
    absent: "Falta",
    justified: "Justificativa",
  };

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-bold ${styles[status]}`}>
      {labels[status]}: {count}
    </span>
  );
}
