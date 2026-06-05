import type {
  AppData,
  AttendanceStatus,
  LessonStatus,
  ScheduleEntry,
} from "@/lib/types";
import { attendanceLabels, scheduleRoleLabels } from "./config";

export function RoleBadge({ role }: { role: ScheduleEntry["role"] }) {
  const styles = {
    coordinator: "bg-indigo-50 text-indigo-800",
    minister: "bg-emerald-50 text-emerald-800",
    support: "bg-sky-50 text-sky-800",
    snack: "bg-amber-50 text-amber-800",
    cleaning: "bg-rose-50 text-rose-800",
  };

  return (
    <span className={`w-fit rounded-md px-2 py-1 text-xs font-bold ${styles[role]}`}>
      {scheduleRoleLabels[role]}
    </span>
  );
}

export function ProgressBadge({
  status,
  message,
}: {
  status: AppData["progress"][number]["status"];
  message: string;
}) {
  const styles = {
    ok: "bg-emerald-50 text-emerald-800",
    move: "bg-amber-50 text-amber-800",
    unassigned: "bg-sky-50 text-sky-800",
    no_rule: "bg-zinc-100 text-zinc-700",
  };

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${styles[status]}`}>
      {message}
    </span>
  );
}

export function AttendancePill({
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

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-bold ${styles[status]}`}>
      {attendanceLabels[status]}: {count}
    </span>
  );
}

export function LessonStatusBadge({ status }: { status: LessonStatus }) {
  const styles = {
    open: "bg-emerald-50 text-emerald-800",
    closed: "bg-zinc-100 text-zinc-700",
  };

  return (
    <span className={`w-fit rounded-md px-2 py-1 text-xs font-bold ${styles[status]}`}>
      {status === "open" ? "Aberta" : "Fechada"}
    </span>
  );
}
