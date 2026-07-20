"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, FileDown, FileSpreadsheet, Search, TrendingUp, UsersRound, X } from "lucide-react";
import { EmptyState, Heading } from "@/components/ui";
import type { AppData, Member } from "@/lib/types";
import { buildChildReport } from "../../utils";
import { downloadReportCsv, downloadReportPdf } from "./export-utils";
import type { ReportExportRow } from "./export-utils";

type ChildReport = ReturnType<typeof buildChildReport>;
type SelectOption = { value: string; label: string };

type ReportFilter = "all" | "absent" | "high" | "low" | "empty";

const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const filters: { id: ReportFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "absent", label: "Faltaram" },
  { id: "high", label: "80% ou mais" },
  { id: "low", label: "Atenção" },
  { id: "empty", label: "Sem registros" },
];

export function ReportsModule({
  data,
  childMembers,
}: {
  data: AppData;
  childMembers: Member[];
}) {
  const [activeFilter, setActiveFilter] = useState<ReportFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("all");

  const classOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "Todas as turmas" },
      ...[...data.classes]
        .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))
        .map((classRoom) => ({ value: classRoom.id, label: classRoom.name })),
    ],
    [data.classes],
  );

  const classScopedLessons = useMemo(
    () =>
      data.lessons.filter(
        (lesson) =>
          lesson.status === "closed" &&
          matchesClassFilter(lesson.classId, selectedClassId),
      ),
    [data.lessons, selectedClassId],
  );

  const yearOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "Todos os anos" },
      ...buildYearOptions(classScopedLessons),
    ],
    [classScopedLessons],
  );
  const activeYear = yearOptions.some((option) => option.value === selectedYear)
    ? selectedYear
    : "all";

  const yearScopedLessons = useMemo(
    () =>
      classScopedLessons.filter(
        (lesson) =>
          activeYear === "all" || String(getLessonYear(lesson.scheduledAt)) === activeYear,
      ),
    [activeYear, classScopedLessons],
  );

  const monthOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "Todos os meses" },
      ...buildMonthOptions(yearScopedLessons),
    ],
    [yearScopedLessons],
  );
  const activeMonth = monthOptions.some((option) => option.value === selectedMonth)
    ? selectedMonth
    : "all";

  const monthScopedLessons = useMemo(
    () =>
      yearScopedLessons.filter(
        (lesson) =>
          activeMonth === "all" ||
          String(getLessonMonth(lesson.scheduledAt)) === activeMonth,
      ),
    [activeMonth, yearScopedLessons],
  );

  const weekOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "Todas as semanas" },
      ...buildWeekOptions(monthScopedLessons),
    ],
    [monthScopedLessons],
  );
  const activeWeek = weekOptions.some((option) => option.value === selectedWeek)
    ? selectedWeek
    : "all";

  const filteredLessons = useMemo(
    () =>
      monthScopedLessons.filter(
        (lesson) =>
          activeWeek === "all" || getWeekKey(lesson.scheduledAt) === activeWeek,
      ),
    [activeWeek, monthScopedLessons],
  );

  const filteredChildren = useMemo(
    () =>
      childMembers.filter(
        (child) =>
          selectedClassId === "all" ||
          child.classIds.includes(selectedClassId) ||
          child.classId === selectedClassId,
      ),
    [childMembers, selectedClassId],
  );

  const reports = useMemo(
    () =>
      sortReportsByPriority(
        filteredChildren.map((child) => buildChildReport(child, data, filteredLessons)),
      ),
    [data, filteredChildren, filteredLessons],
  );

  const averageFrequency = reports.length
    ? Math.round(
        reports.reduce((total, report) => total + report.frequency, 0) / reports.length,
      )
    : 0;
  const childrenWithAbsencesCount = reports.filter(
    (report) => report.absent > 0,
  ).length;
  const totalAbsences = reports.reduce(
    (total, report) => total + report.absent,
    0,
  );
  const emptyReportCount = reports.filter(
    (report) => report.present + report.absent + report.justified === 0,
  ).length;
  const filterSummaryItems = [
    classOptions.find((option) => option.value === selectedClassId)?.label ?? "Todas as turmas",
    activeYear === "all" ? "Todos os anos" : activeYear,
    activeMonth === "all" ? "Todos os meses" : MONTH_LABELS[Number(activeMonth) - 1],
    activeWeek === "all" ? "Todas as semanas" : formatWeekLabel(activeWeek),
  ];

  const visibleReports = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return reports.filter((report) => {
      const total = report.present + report.absent + report.justified;
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "absent" && report.absent > 0) ||
        (activeFilter === "high" && report.frequency >= 80 && total > 0) ||
        (activeFilter === "low" && report.frequency > 0 && report.frequency < 80) ||
        (activeFilter === "empty" && total === 0);

      const matchesSearch =
        !normalizedSearch ||
        [report.child.fullName, report.child.className]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, reports, search]);

  const [exportingPdf, setExportingPdf] = useState(false);
  const exportSummary = filterSummaryItems.join(" · ");

  function buildExportRows(): ReportExportRow[] {
    return visibleReports.map((report) => {
      const total = report.present + report.absent + report.justified;

      return {
        name: report.child.fullName,
        classes: report.child.classNames.length
          ? report.child.classNames.join(", ")
          : report.child.className || "Sem turma",
        present: report.present,
        absent: report.absent,
        justified: report.justified,
        total,
        frequency: report.frequency,
      };
    });
  }

  function handleExportCsv() {
    downloadReportCsv({
      rows: buildExportRows(),
      summary: exportSummary,
      generatedAt: new Date(),
    });
  }

  async function handleExportPdf() {
    setExportingPdf(true);

    try {
      await downloadReportPdf({
        rows: buildExportRows(),
        summary: exportSummary,
        generatedAt: new Date(),
      });
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <Heading
          title="Relatórios"
          subtitle="Consulte frequência por criança com presença, falta e justificativa"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!visibleReports.length}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet size={16} aria-hidden="true" />
            Exportar Excel (CSV)
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={!visibleReports.length || exportingPdf}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileDown size={16} aria-hidden="true" />
            {exportingPdf ? "Gerando PDF..." : "Exportar PDF"}
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportStat icon={UsersRound} label="Crianças" value={reports.length} tone="emerald" />
        <ReportStat icon={TrendingUp} label="Frequência média" value={averageFrequency} suffix="%" tone="sky" />
        <ReportStat icon={AlertTriangle} label="Faltaram" value={childrenWithAbsencesCount} tone="rose" />
        <ReportStat icon={BarChart3} label="Sem registros" value={emptyReportCount} tone="rose" />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <Heading
            title="Frequência por criança"
            subtitle={`${visibleReports.length} de ${reports.length} criança(s) · ${filteredLessons.length} aula(s) finalizada(s) no recorte`}
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

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            label="Turma"
            value={selectedClassId}
            options={classOptions}
            onChange={(value) => {
              setSelectedClassId(value);
              setSelectedWeek("all");
            }}
          />
          <FilterSelect
            label="Ano"
            value={activeYear}
            options={yearOptions}
            onChange={(value) => {
              setSelectedYear(value);
              setSelectedWeek("all");
            }}
          />
          <FilterSelect
            label="Mês"
            value={activeMonth}
            options={monthOptions}
            onChange={(value) => {
              setSelectedMonth(value);
              setSelectedWeek("all");
            }}
          />
          <FilterSelect
            label="Semana"
            value={activeWeek}
            options={weekOptions}
            onChange={setSelectedWeek}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Recorte
          </span>
          {filterSummaryItems.map((item) => (
            <span
              key={item}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200"
            >
              {item}
            </span>
          ))}
          <span className="ml-auto text-sm font-semibold text-zinc-900">
            {filteredLessons.length} aula(s) finalizada(s)
          </span>
        </div>

        {childrenWithAbsencesCount ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-rose-900">
                Crianças que faltaram em aulas finalizadas
              </p>
              <p className="mt-1 text-sm leading-6 text-rose-700">
                {childrenWithAbsencesCount} criança(s) com {totalAbsences} falta(s) registradas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveFilter("absent")}
              disabled={activeFilter === "absent"}
              className="inline-flex h-10 items-center justify-center rounded-md bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              Ver só faltas
            </button>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
            <Search size={16} className="text-zinc-500" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar criança ou turma"
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

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {visibleReports.length ? (
            visibleReports.map((report) => (
              <ReportCard key={report.child.id} report={report} />
            ))
          ) : (
            <div className="xl:col-span-2">
              <EmptyState text="Nenhum relatório encontrado." />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ReportCard({
  report,
}: {
  report: ChildReport;
}) {
  const total = report.present + report.absent + report.justified;
  const hasAbsences = report.absent > 0;
  const tone =
    total === 0
      ? "zinc"
      : hasAbsences
        ? "rose"
      : report.frequency >= 80
        ? "emerald"
        : "amber";
  const toneClasses = {
    emerald: "bg-emerald-50 text-emerald-800",
    rose: "bg-rose-100 text-rose-800",
    amber: "bg-amber-50 text-amber-800",
    zinc: "bg-zinc-100 text-zinc-700",
  };
  const progressBarClass =
    total === 0
      ? "bg-zinc-300"
      : hasAbsences
        ? "bg-rose-600"
        : report.frequency >= 80
          ? "bg-emerald-700"
          : "bg-amber-600";
  const cardClassName = hasAbsences
    ? "rounded-2xl border border-rose-200 bg-rose-50/40 p-5 transition hover:border-rose-300 hover:bg-rose-50/60"
    : "rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-emerald-200 hover:bg-emerald-50/30";

  return (
    <article className={cardClassName}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-950">{report.child.fullName}</h3>
          <p className="mt-1 text-sm text-zinc-600">
            {report.child.className || "Sem turma"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasAbsences ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
              <AlertTriangle size={14} aria-hidden="true" />
              {report.absent} falta(s)
            </span>
          ) : null}
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${toneClasses[tone]}`}>
            {tone === "emerald" ? <CheckCircle2 size={14} aria-hidden="true" /> : null}
            {total ? `${report.frequency}%` : "Sem registros"}
          </span>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full ${progressBarClass}`} style={{ width: `${report.frequency}%` }} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Metric label="Presenças" value={report.present} tone="emerald" />
        <Metric label="Faltas" value={report.absent} tone="rose" />
        <Metric label="Justificadas" value={report.justified} tone="amber" />
        <Metric label="Total" value={total} tone="zinc" />
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "rose" | "amber" | "zinc";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-800",
    rose: "bg-rose-50 text-rose-800",
    amber: "bg-amber-50 text-amber-800",
    zinc: "bg-zinc-100 text-zinc-700",
  };

  return (
    <div className={`rounded-xl px-3 py-2 ${colors[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function ReportStat({
  icon: Icon,
  label,
  value,
  tone,
  suffix = "",
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
  tone: "emerald" | "sky" | "amber" | "rose";
  suffix?: string;
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
          <p className="mt-2 text-3xl font-bold text-zinc-950">
            {value}
            {suffix}
          </p>
        </div>
        <div className={`grid size-12 place-items-center rounded-lg ${colors[tone]}`}>
          <Icon size={22} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 outline-none transition focus:border-emerald-300"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function sortReportsByPriority(reports: ChildReport[]) {
  return [...reports].sort((left, right) => {
    if (right.absent !== left.absent) {
      return right.absent - left.absent;
    }

    if (left.frequency !== right.frequency) {
      return left.frequency - right.frequency;
    }

    return left.child.fullName.localeCompare(right.child.fullName, "pt-BR");
  });
}

function matchesClassFilter(lessonClassId: string, selectedClassId: string) {
  return selectedClassId === "all" || !lessonClassId || lessonClassId === selectedClassId;
}

function buildYearOptions(lessons: AppData["lessons"]): SelectOption[] {
  const years = Array.from(
    new Set(
      lessons
        .map((lesson) => getLessonYear(lesson.scheduledAt))
        .filter((year): year is number => year !== null),
    ),
  ).sort((left, right) => right - left);

  return years.map((year) => ({ value: String(year), label: String(year) }));
}

function buildMonthOptions(lessons: AppData["lessons"]): SelectOption[] {
  const months = Array.from(
    new Set(
      lessons
        .map((lesson) => getLessonMonth(lesson.scheduledAt))
        .filter((month): month is number => month !== null),
    ),
  ).sort((left, right) => left - right);

  return months.map((month) => ({
    value: String(month),
    label: MONTH_LABELS[month - 1] ?? String(month),
  }));
}

function buildWeekOptions(lessons: AppData["lessons"]): SelectOption[] {
  const weekKeys = Array.from(
    new Set(
      lessons
        .map((lesson) => getWeekKey(lesson.scheduledAt))
        .filter(Boolean),
    ),
  ).sort((left, right) => right.localeCompare(left));

  return weekKeys.map((weekKey) => ({
    value: weekKey,
    label: formatWeekLabel(weekKey),
  }));
}

function getLessonYear(value: string) {
  const date = parseDate(value);

  return date ? date.getFullYear() : null;
}

function getLessonMonth(value: string) {
  const date = parseDate(value);

  return date ? date.getMonth() + 1 : null;
}

function getWeekKey(value: string) {
  const startOfWeek = getStartOfWeek(value);

  if (!startOfWeek) return "";

  return startOfWeek.toISOString().slice(0, 10);
}

function getStartOfWeek(value: string) {
  const date = parseDate(value);

  if (!date) return null;

  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  return start;
}

function formatWeekLabel(weekKey: string) {
  const start = parseDate(`${weekKey}T00:00:00`);

  if (!start) return weekKey;

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${formatShortDate(start)} a ${formatShortDate(end)}`;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function parseDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}
