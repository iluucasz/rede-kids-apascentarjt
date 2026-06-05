import type { LessonReportGroups } from "../types";

export function LessonReportCard({ report }: { report: LessonReportGroups }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-950">Relatório da aula</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ReportList title="Vieram" names={report.present.map((item) => item.fullName)} />
        <ReportList title="Faltaram" names={report.absent.map((item) => item.fullName)} />
        <ReportList
          title="Justificaram"
          names={report.justified.map((item) => item.fullName)}
        />
        <ReportList
          title="Sem lançamento"
          names={report.pending.map((item) => item.fullName)}
        />
      </div>
    </section>
  );
}

function ReportList({ title, names }: { title: string; names: string[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 px-4 py-3">
      <p className="font-bold text-zinc-950">{title}</p>
      {names.length ? (
        <ul className="mt-2 space-y-1 text-sm text-zinc-700">
          {names.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">Nenhum registro.</p>
      )}
    </div>
  );
}
