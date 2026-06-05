import type { AppData, Lesson, Member } from "@/lib/types";

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export function buildChildReport(
  child: Member,
  data: AppData,
  lessons: Lesson[] = data.lessons,
) {
  const relevantLessonIds = new Set(
    lessons
      .filter(
        (lesson) =>
          lesson.status === "closed" &&
          (!lesson.classId || lesson.classId === child.classId),
      )
      .map((lesson) => lesson.id),
  );

  const records = data.attendance.filter(
    (attendance) =>
      attendance.childId === child.id &&
      relevantLessonIds.has(attendance.lessonId),
  );

  const present = records.filter((record) => record.status === "present").length;
  const absent = records.filter((record) => record.status === "absent").length;
  const justified = records.filter(
    (record) => record.status === "justified",
  ).length;
  const total = present + absent + justified;
  const frequency = total ? Math.round((present / total) * 100) : 0;

  return { child, present, absent, justified, frequency };
}

export function formatDateTime(value: string) {
  if (!value) return "Sem data";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatLessonCardDate(value: string) {
  if (!value) return "Sem data";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const weekday = WEEKDAY_LABELS[date.getDay()] || "";
  const hours = date.getHours();
  const period =
    hours >= 6 && hours < 12 ? "Manhã" : hours >= 12 && hours < 18 ? "Tarde" : "Noite";

  return `${day}/${month}/${year} - ${weekday} - ${period}`;
}
