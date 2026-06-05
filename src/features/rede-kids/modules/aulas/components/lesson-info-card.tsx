import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BookOpen, CalendarDays, GraduationCap, UserRound } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { formatLessonCardDate } from "../../../utils";
import { findMatchingLessonNotePreset } from "./lesson-note-presets";

export function LessonInfoCard({ lesson }: { lesson: Lesson }) {
  const matchingNotePreset = findMatchingLessonNotePreset(lesson.notes);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <InfoGroup title="Resumo da aula">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoTile
              icon={GraduationCap}
              label="Turma"
              value={lesson.className || "Sem turma"}
            />
            <InfoTile
              icon={CalendarDays}
              label="Data"
              value={formatLessonCardDate(lesson.scheduledAt)}
            />
            <StatusTile status={lesson.status} />
            <OfferingTile offeringCents={lesson.offeringCents} />
          </div>
        </InfoGroup>

        <InfoGroup title="Equipe">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <InfoTile
              icon={UserRound}
              label="Ministro"
              value={lesson.ministerName || "Sem ministro"}
            />
            <InfoTile
              icon={UserRound}
              label="Apoio"
              value={lesson.supportName || "Sem apoio"}
            />
          </div>
        </InfoGroup>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DetailPanel
          icon={BookOpen}
          label="Texto bíblico"
          value={formatScriptureText(lesson.scriptureText)}
        />
        <DetailPanel
          label="Observações"
          value={lesson.notes || "Sem observações registradas."}
          surfaceClassName={matchingNotePreset?.panelClassName}
          labelClassName={matchingNotePreset?.labelClassName}
          valueClassName={matchingNotePreset?.valueClassName}
        />
      </div>
    </section>
  );
}

function InfoGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
          <Icon size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {label}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-zinc-950">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusTile({ status }: { status: Lesson["status"] }) {
  const isOpen = status === "open";

  return (
    <div
      className={`rounded-xl border p-4 ${
        isOpen ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
      }`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
          isOpen ? "text-emerald-700" : "text-rose-700"
        }`}
      >
        Status
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`size-3 rounded-full ${isOpen ? "bg-emerald-500" : "bg-rose-500"}`}
        />
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
            isOpen ? "bg-white text-emerald-700" : "bg-white text-rose-700"
          }`}
        >
          {isOpen ? "Aberta" : "Fechada"}
        </span>
      </div>
    </div>
  );
}

function OfferingTile({ offeringCents }: { offeringCents: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Oferta
      </p>
      <p className="mt-2 text-base font-semibold text-zinc-950">
        {formatOffering(offeringCents)}
      </p>
    </div>
  );
}

function DetailPanel({
  icon: Icon,
  label,
  value,
  className = "",
  surfaceClassName,
  labelClassName = "",
  valueClassName = "",
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  className?: string;
  surfaceClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  const resolvedSurfaceClassName = surfaceClassName ?? "border-zinc-200 bg-white";

  return (
    <div className={`min-h-36 rounded-xl border p-5 ${resolvedSurfaceClassName} ${className}`}>
      <div className="flex items-center gap-2">
        {Icon ? <Icon size={16} className="text-zinc-500" aria-hidden="true" /> : null}
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 ${labelClassName}`}
        >
          {label}
        </p>
      </div>
      <p className={`mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-800 ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function formatOffering(value: number) {
  if (!value) return "Sem oferta registrada";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
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
