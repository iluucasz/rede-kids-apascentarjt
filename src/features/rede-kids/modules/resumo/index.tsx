import {
  AlertTriangle,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  HandHeart,
  Users,
  Warehouse,
} from "lucide-react";
import { EmptyState, Heading, QuickLink, StatCard } from "@/components/ui";
import type { AppData } from "@/lib/types";
import { RoleBadge } from "../../badges";
import type { ModuleId } from "../../types";
import { formatDateTime } from "../../utils";

export function Dashboard({
  data,
  childrenCount,
  guardiansCount,
  progressAlerts,
  lowStockCount,
  loadedAt,
  setActiveModule,
}: {
  data: AppData;
  childrenCount: number;
  guardiansCount: number;
  progressAlerts: AppData["progress"];
  lowStockCount: number;
  loadedAt: string;
  setActiveModule: (module: ModuleId) => void;
}) {
  const loadedAtTime = Date.parse(loadedAt);
  const nextSchedule = data.schedule
    .filter((entry) => new Date(entry.scheduledAt).getTime() >= loadedAtTime)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Crianças" value={childrenCount} accent="emerald" />
        <StatCard icon={ClipboardList} label="Aulas" value={data.lessons.length} accent="sky" />
        <StatCard icon={HandHeart} label="Trabalhadores" value={data.workers.length} accent="rose" />
        <StatCard icon={AlertTriangle} label="Alertas" value={progressAlerts.length + lowStockCount} accent="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Heading title="Próximas escalas" subtitle={`${data.schedule.length} registros`} />
            <button
              type="button"
              onClick={() => setActiveModule("schedule")}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-zinc-900 px-3 text-sm font-semibold text-white"
            >
              <CalendarDays size={16} aria-hidden="true" />
              Escala
            </button>
          </div>

          <div className="space-y-3">
            {nextSchedule.length ? (
              nextSchedule.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-zinc-950">
                      {formatDateTime(entry.scheduledAt)} · {entry.serviceLabel}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {entry.className || "Geral"} · {entry.workerName || "Sem trabalhador"}
                    </p>
                  </div>
                  <RoleBadge role={entry.role} />
                </div>
              ))
            ) : (
              <EmptyState text="Nenhuma escala futura cadastrada." />
            )}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <Heading title="Atenção" subtitle="Trocas de turma e estoque" />
          <div className="mt-4 space-y-3">
            {progressAlerts.slice(0, 4).map((item) => (
              <div key={item.childId} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="font-semibold text-amber-950">{item.childName}</p>
                <p className="text-sm text-amber-900">{item.message}</p>
              </div>
            ))}
            {lowStockCount > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="font-semibold text-rose-950">{lowStockCount} item(ns) com estoque baixo</p>
                <p className="text-sm text-rose-900">Confira materiais antes da próxima aula.</p>
              </div>
            )}
            {!progressAlerts.length && !lowStockCount && (
              <EmptyState text="Sem alertas no momento." />
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickLink icon={Users} label={`${guardiansCount} responsáveis`} onClick={() => setActiveModule("members")} />
        <QuickLink icon={ClipboardCheck} label="Lançar presença" onClick={() => setActiveModule("lessons")} />
        <QuickLink icon={Warehouse} label="Ver estoque" onClick={() => setActiveModule("inventory")} />
      </div>
    </div>
  );
}
