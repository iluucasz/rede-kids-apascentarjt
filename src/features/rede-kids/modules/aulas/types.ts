import type { AttendanceStatus, Member } from "@/lib/types";

export type LessonReportGroups = Record<AttendanceStatus | "pending", Member[]>;
