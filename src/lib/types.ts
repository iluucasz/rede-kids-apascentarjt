export type AttendanceStatus = "present" | "absent" | "justified";
export type LessonStatus = "open" | "closed";

export type ClassRoom = {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
  serviceSchedule: string;
  notes: string;
  active: boolean;
  childCount: number;
};

export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Member = {
  id: string;
  kind: "child" | "guardian";
  fullName: string;
  phone: string;
  birthDate: string;
  congregatesSince: string;
  enrollmentDate: string;
  origin: string;
  classId: string;
  className: string;
  classIds: string[];
  classNames: string[];
  address: string;
  notes: string;
  categoryIds: string[];
  categoryNames: string[];
  guardianIds: string[];
  guardianNames: string[];
  childIds: string[];
  childNames: string[];
  age: number | null;
};

export type Worker = {
  id: string;
  fullName: string;
  phone: string;
  bio: string;
  roles: string[];
  notes: string;
  active: boolean;
};

export type Lesson = {
  id: string;
  classId: string;
  className: string;
  scheduledAt: string;
  status: LessonStatus;
  theme: string;
  scriptureText: string;
  lessonText: string;
  notes: string;
  ministerId: string;
  ministerName: string;
  supportId: string;
  supportName: string;
  offeringCents: number;
  totalChildrenSnapshot: number;
  presentCount: number;
  absentCount: number;
  justifiedCount: number;
  attachmentCount: number;
};

export type LessonAttachment = {
  id: string;
  lessonId: string;
  name: string;
  url: string;
  kind: "image" | "pdf" | "link" | "other";
  notes: string;
  createdAt: string;
};

export type Attendance = {
  lessonId: string;
  childId: string;
  childName: string;
  status: AttendanceStatus;
  note: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  notes: string;
};

export type ScheduleEntry = {
  id: string;
  scheduledAt: string;
  serviceLabel: string;
  classId: string;
  className: string;
  workerId: string;
  workerName: string;
  role: "coordinator" | "minister" | "support" | "snack" | "cleaning";
  theme: string;
  scriptureText: string;
  lessonText: string;
  notes: string;
};

export type AppUser = {
  id: string;
  workerId: string;
  workerName: string;
  name: string;
  email: string;
  role: "admin" | "coordinator" | "worker";
  hasPassword: boolean;
};

export type ProgressItem = {
  childId: string;
  childName: string;
  age: number | null;
  currentClassName: string;
  recommendedClassName: string;
  status: "ok" | "move" | "unassigned" | "no_rule";
  message: string;
};

export type AppData = {
  classes: ClassRoom[];
  categories: Category[];
  members: Member[];
  workers: Worker[];
  lessons: Lesson[];
  lessonAttachments: LessonAttachment[];
  attendance: Attendance[];
  inventory: InventoryItem[];
  schedule: ScheduleEntry[];
  users: AppUser[];
  progress: ProgressItem[];
};
