import type { LessonReportGroups } from "../types";

export function LessonStats({ report }: { report: LessonReportGroups }) {
  const stats = [
    {
      label: "Presentes",
      value: report.present.length,
      className: "bg-emerald-50 text-emerald-800",
    },
    {
      label: "Faltas",
      value: report.absent.length,
      className: "bg-rose-50 text-rose-700",
    },
    {
      label: "Justific.",
      value: report.justified.length,
      className: "bg-amber-50 text-amber-700",
    },
    {
      label: "Sem reg.",
      value: report.pending.length,
      className: "bg-zinc-100 text-zinc-600",
    },
  ];

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="grid gap-2 md:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className={`rounded-md px-4 py-3 text-center ${item.className}`}
          >
            <p className="text-xl font-medium">{item.value}</p>
            <p className="text-xs font-semibold uppercase">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
