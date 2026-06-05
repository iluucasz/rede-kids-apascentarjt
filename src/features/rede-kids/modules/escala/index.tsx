"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Search,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { EmptyState, Heading } from "@/components/ui";
import type { AppData, Lesson } from "@/lib/types";

const NO_CLASS_FILTER = "__no_class__";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type CalendarDay = {
  dateKey: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  lessons: Lesson[];
};

export function ScheduleModule({ data }: { data: AppData }) {
  const [monthFilter, setMonthFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [workerFilter, setWorkerFilter] = useState("");
  const [search, setSearch] = useState("");

  const lessons = useMemo(
    () =>
      [...data.lessons].sort(
        (first, second) =>
          getLessonTimestamp(first.scheduledAt) -
          getLessonTimestamp(second.scheduledAt),
      ),
    [data.lessons],
  );

  const monthOptions = useMemo(() => {
    const options = new Map<string, string>();

    for (const lesson of lessons) {
      const monthKey = getMonthKey(lesson.scheduledAt);

      if (monthKey && !options.has(monthKey)) {
        options.set(monthKey, formatMonthLabel(monthKey));
      }
    }

    return Array.from(options, ([value, label]) => ({ value, label }));
  }, [lessons]);

  const selectedMonthKey = useMemo(() => {
    if (monthFilter) return monthFilter;

    const currentMonthKey = getMonthKey(new Date().toISOString());

    if (monthOptions.some((option) => option.value === currentMonthKey)) {
      return currentMonthKey;
    }

    return monthOptions.at(-1)?.value ?? "";
  }, [monthFilter, monthOptions]);

  const classOptions = useMemo(() => {
    const options = new Map(
      data.classes.map((classRoom) => [classRoom.id, classRoom.name]),
    );

    if (lessons.some((lesson) => !lesson.classId)) {
      options.set(NO_CLASS_FILTER, "Sem turma");
    }

    return Array.from(options, ([value, label]) => ({ value, label })).sort(
      (first, second) => first.label.localeCompare(second.label, "pt-BR"),
    );
  }, [data.classes, lessons]);

  const workerOptions = useMemo(() => {
    const options = new Map<string, string>();

    for (const lesson of lessons) {
      addWorkerOption(options, lesson.ministerId, lesson.ministerName);
      addWorkerOption(options, lesson.supportId, lesson.supportName);
    }

    return Array.from(options, ([value, label]) => ({ value, label })).sort(
      (first, second) => first.label.localeCompare(second.label, "pt-BR"),
    );
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return lessons.filter((lesson) => {
      const matchesMonth =
        !selectedMonthKey || getMonthKey(lesson.scheduledAt) === selectedMonthKey;
      const matchesClass =
        !classFilter || (lesson.classId || NO_CLASS_FILTER) === classFilter;
      const matchesWorker =
        !workerFilter ||
        lesson.ministerId === workerFilter ||
        lesson.supportId === workerFilter;
      const matchesSearch =
        !normalizedSearch ||
        [
          lesson.id,
          lesson.theme,
          lesson.className,
          lesson.scriptureText,
          lesson.ministerName,
          lesson.supportName,
          lesson.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesMonth && matchesClass && matchesWorker && matchesSearch;
    });
  }, [classFilter, lessons, search, selectedMonthKey, workerFilter]);

  const assignedWorkers = useMemo(() => {
    const workers = new Set<string>();

    for (const lesson of filteredLessons) {
      addWorkerKey(workers, lesson.ministerId, lesson.ministerName);
      addWorkerKey(workers, lesson.supportId, lesson.supportName);
    }

    return workers.size;
  }, [filteredLessons]);

  const assignedSlots = filteredLessons.reduce(
    (total, lesson) =>
      total +
      Number(Boolean(lesson.ministerName || lesson.ministerId)) +
      Number(Boolean(lesson.supportName || lesson.supportId)),
    0,
  );
  const pendingSlots = filteredLessons.length * 2 - assignedSlots;
  const hasActiveFilters = Boolean(
    monthFilter || classFilter || workerFilter || search.trim(),
  );
  const selectedMonthIndex = monthOptions.findIndex(
    (option) => option.value === selectedMonthKey,
  );
  const previousMonth =
    selectedMonthIndex > 0 ? monthOptions[selectedMonthIndex - 1] : undefined;
  const nextMonth =
    selectedMonthIndex >= 0 && selectedMonthIndex < monthOptions.length - 1
      ? monthOptions[selectedMonthIndex + 1]
      : undefined;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <Heading
          title="Escala"
          subtitle="Calendário das aulas cadastradas com ministro e apoio de cada encontro"
        />
        <div className="flex w-fit items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
          <BookOpen size={16} aria-hidden="true" />
          Baseado em aulas
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ScheduleStat
          icon={CalendarDays}
          label="Aulas"
          value={filteredLessons.length}
          tone="emerald"
        />
        <ScheduleStat
          icon={UserRound}
          label="Escalados"
          value={assignedWorkers}
          tone="sky"
        />
        <ScheduleStat
          icon={CheckCircle2}
          label="Funções preenchidas"
          value={assignedSlots}
          tone="amber"
        />
        <ScheduleStat
          icon={Clock3}
          label="Pendências"
          value={pendingSlots}
          tone="rose"
        />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4">
          <Heading
            title="Filtros"
            subtitle={
              hasActiveFilters
                ? `${filteredLessons.length} de ${lessons.length} aula(s)`
                : selectedMonthKey
                  ? `Mostrando ${formatMonthLabel(selectedMonthKey)}. Use o filtro para trocar de mês.`
                  : "Selecione um mês para exibir o calendário."
            }
          />

          <div className="grid gap-3 xl:grid-cols-[220px_220px_240px_minmax(0,1fr)_auto]">
            <FilterSelect
              value={selectedMonthKey}
              onChange={setMonthFilter}
              ariaLabel="Filtrar por mês"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              value={classFilter}
              onChange={setClassFilter}
              ariaLabel="Filtrar por turma"
            >
              <option value="">Todas as turmas</option>
              {classOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              value={workerFilter}
              onChange={setWorkerFilter}
              ariaLabel="Filtrar por trabalhador"
            >
              <option value="">Todos os trabalhadores</option>
              {workerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FilterSelect>

            <label className="flex h-11 min-w-0 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
              <Search size={16} className="shrink-0 text-zinc-500" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar aula, texto ou trabalhador"
                className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-zinc-500"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setMonthFilter("");
                setClassFilter("");
                setWorkerFilter("");
                setSearch("");
              }}
              disabled={!hasActiveFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} aria-hidden="true" />
              Limpar
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <Heading
            title="Calendário"
            subtitle={selectedMonthKey
              ? `${formatMonthLabel(selectedMonthKey)} · ${filteredLessons.length} aula(s) no recorte atual`
              : `${filteredLessons.length} aula(s) no recorte atual`}
          />
          <div className="flex flex-col items-center gap-3 text-center sm:items-end sm:text-right">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-zinc-500 sm:justify-end">
              <UsersRound size={16} aria-hidden="true" />
              Ministro e apoio por aula
            </div>
            {selectedMonthKey ? (
              <MonthNavigator
                currentLabel={formatMonthLabel(selectedMonthKey)}
                previousLabel={previousMonth?.label}
                nextLabel={nextMonth?.label}
                onPrevious={previousMonth ? () => setMonthFilter(previousMonth.value) : undefined}
                onNext={nextMonth ? () => setMonthFilter(nextMonth.value) : undefined}
              />
            ) : null}
          </div>
        </div>

        <div className="mt-5 space-y-6">
          {selectedMonthKey ? (
            <MonthCalendar monthKey={selectedMonthKey} lessons={filteredLessons} />
          ) : (
            <EmptyState text="Nenhuma aula encontrada para os filtros selecionados." />
          )}
        </div>
      </section>
    </div>
  );
}

function MonthNavigator({
  currentLabel,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
}: {
  currentLabel: string;
  previousLabel?: string;
  nextLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2 py-2 shadow-sm">
      <button
        type="button"
        aria-label={previousLabel ? `Ir para ${previousLabel}` : "Sem mês anterior"}
        title={previousLabel ? `Ir para ${previousLabel}` : "Sem mês anterior"}
        onClick={onPrevious}
        disabled={!onPrevious}
        className="inline-flex size-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      <div className="min-w-40 px-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Navegar mês
        </p>
        <p className="text-sm font-bold capitalize text-zinc-950">{currentLabel}</p>
      </div>

      <button
        type="button"
        aria-label={nextLabel ? `Ir para ${nextLabel}` : "Sem próximo mês"}
        title={nextLabel ? `Ir para ${nextLabel}` : "Sem próximo mês"}
        onClick={onNext}
        disabled={!onNext}
        className="inline-flex size-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

function MonthCalendar({
  monthKey,
  lessons,
}: {
  monthKey: string;
  lessons: Lesson[];
}) {
  const days = buildMonthDays(monthKey, groupLessonsByDate(lessons));

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-col gap-1 border-b border-zinc-200 bg-zinc-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-base font-bold capitalize text-zinc-950">
          {formatMonthLabel(monthKey)}
        </h4>
        <p className="text-sm font-semibold text-zinc-500">
          {lessons.length} aula(s)
        </p>
      </div>

      <MobileMonthAgenda days={days} />

      <DesktopMonthCalendar days={days} />
    </section>
  );
}

function DesktopMonthCalendar({ days }: { days: CalendarDay[] }) {
  return (
    <div className="hidden md:block">
      <div className="grid grid-cols-7 border-b border-zinc-200 bg-white">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-3 py-2 text-center text-xs font-bold uppercase text-zinc-500"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, index) => (
          <CalendarCell key={`${day.dateKey}-${index}`} day={day} />
        ))}
      </div>
    </div>
  );
}

function MobileMonthAgenda({ days }: { days: CalendarDay[] }) {
  const agendaDays = days.filter((day) => day.inMonth && day.lessons.length > 0);

  return (
    <div className="md:hidden">
      {agendaDays.length ? (
        <div className="divide-y divide-zinc-200">
          {agendaDays.map((day) => (
            <section key={day.dateKey} className="grid gap-3 p-3">
              <div className="flex items-center gap-3">
                <div
                  className={`grid size-11 shrink-0 place-items-center rounded-lg text-base font-bold ${
                    day.isToday
                      ? "bg-emerald-700 text-white"
                      : "bg-zinc-100 text-zinc-950"
                  }`}
                >
                  {day.dayNumber}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold capitalize text-zinc-950">
                    {formatAgendaWeekday(day.dateKey)}
                  </p>
                  <p className="text-xs font-semibold text-zinc-500">
                    {formatAgendaDate(day.dateKey)}
                    {day.isToday ? " · Hoje" : ""}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                {day.lessons.map((lesson) => (
                  <LessonCalendarItem
                    key={lesson.id}
                    lesson={lesson}
                    variant="agenda"
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="p-3">
          <EmptyState text="Nenhuma aula neste mês." />
        </div>
      )}
    </div>
  );
}

function CalendarCell({ day }: { day: CalendarDay }) {
  return (
    <div
      className={`min-h-36 border-b border-r border-zinc-200 p-2 ${
        day.inMonth ? "bg-white" : "bg-zinc-50/70"
      } ${day.isToday ? "ring-2 ring-inset ring-emerald-500" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`grid size-7 place-items-center rounded-md text-sm font-bold ${
            day.inMonth ? "text-zinc-900" : "text-zinc-400"
          } ${day.isToday ? "bg-emerald-700 text-white" : ""}`}
        >
          {day.dayNumber}
        </span>
        {day.lessons.length ? (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600">
            {day.lessons.length}
          </span>
        ) : null}
      </div>

      <div className="mt-2 space-y-2">
        {day.lessons.map((lesson) => (
          <LessonCalendarItem key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}

function LessonCalendarItem({
  lesson,
  variant = "calendar",
}: {
  lesson: Lesson;
  variant?: "agenda" | "calendar";
}) {
  const isAgenda = variant === "agenda";

  return (
    <Link
      href={`/aulas/${lesson.id}`}
      className={`block rounded-md border border-zinc-200 bg-zinc-50 text-left transition hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isAgenda ? "px-3 py-3" : "px-2 py-2"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`truncate font-bold text-zinc-950 ${
            isAgenda ? "text-sm" : "text-xs"
          }`}
        >
          {formatLessonTime(lesson.scheduledAt)}
        </span>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
            lesson.status === "open"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-zinc-200 text-zinc-700"
          }`}
        >
          {lesson.status === "open" ? "Aberta" : "Fechada"}
        </span>
      </div>
      <p
        className={`mt-1 truncate font-bold text-zinc-900 ${
          isAgenda ? "text-sm" : "text-xs"
        }`}
      >
        {lesson.theme || "Aula sem tema"}
      </p>
      <p
        className={`mt-0.5 truncate font-semibold text-zinc-500 ${
          isAgenda ? "text-xs" : "text-[11px]"
        }`}
      >
        {lesson.className || "Sem turma"}
      </p>
      <div className="mt-2 space-y-1">
        <WorkerLine role="Min" name={lesson.ministerName} emptyLabel="Sem ministro" />
        <WorkerLine role="Apoio" name={lesson.supportName} emptyLabel="Sem apoio" />
      </div>
    </Link>
  );
}

function WorkerLine({
  role,
  name,
  emptyLabel,
}: {
  role: string;
  name: string;
  emptyLabel: string;
}) {
  const hasWorker = Boolean(name);

  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded bg-white px-1.5 py-1 text-[11px]">
      <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 font-bold text-zinc-600">
        {role}
      </span>
      <span
        className={`min-w-0 truncate font-semibold ${
          hasWorker ? "text-zinc-800" : "text-rose-700"
        }`}
      >
        {name || emptyLabel}
      </span>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  ariaLabel,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex h-11 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full w-full min-w-0 bg-transparent outline-none"
        aria-label={ariaLabel}
      >
        {children}
      </select>
    </label>
  );
}

function ScheduleStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarDays;
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

function buildMonthDays(monthKey: string, lessonsByDate: Map<string, Lesson[]>) {
  const [year, month] = monthKey.split("-").map(Number);
  const monthIndex = (month || 1) - 1;
  const firstDate = new Date(year, monthIndex, 1);
  const firstWeekday = firstDate.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const todayKey = toDateKey(new Date());
  const days: CalendarDay[] = [];

  for (let index = 0; index < totalCells; index += 1) {
    const dayOffset = index - firstWeekday + 1;
    const date = new Date(year, monthIndex, dayOffset);
    const dateKey = toDateKey(date);
    const inMonth = date.getMonth() === monthIndex;

    days.push({
      dateKey,
      dayNumber: date.getDate(),
      inMonth,
      isToday: dateKey === todayKey,
      lessons: inMonth ? lessonsByDate.get(dateKey) ?? [] : [],
    });
  }

  return days;
}

function groupLessonsByDate(lessons: Lesson[]) {
  const grouped = new Map<string, Lesson[]>();

  for (const lesson of lessons) {
    const dateKey = getDateKey(lesson.scheduledAt);

    if (!dateKey) continue;

    const dateLessons = grouped.get(dateKey) ?? [];
    dateLessons.push(lesson);
    grouped.set(dateKey, dateLessons);
  }

  return grouped;
}

function addWorkerOption(
  options: Map<string, string>,
  workerId: string,
  workerName: string,
) {
  if (workerId && workerName && !options.has(workerId)) {
    options.set(workerId, workerName);
  }
}

function addWorkerKey(workers: Set<string>, workerId: string, workerName: string) {
  if (workerId || workerName) {
    workers.add(workerId || workerName);
  }
}

function getLessonTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return Number.MAX_SAFE_INTEGER;
  }

  return date.getTime();
}

function getMonthKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return /^\d{4}-\d{2}/.test(value) ? value.slice(0, 7) : "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getDateKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : "";
  }

  return toDateKey(date);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatAgendaWeekday(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(date);
}

function formatAgendaDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatLessonTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(11, 16) || "Sem horário";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
