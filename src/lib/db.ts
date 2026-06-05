import { neon } from "@neondatabase/serverless";
import { randomBytes, randomUUID } from "crypto";
import type {
  AppData,
  AppUser,
  Attendance,
  Category,
  ClassRoom,
  InventoryItem,
  Lesson,
  LessonAttachment,
  Member,
  ProgressItem,
  ScheduleEntry,
  Worker,
} from "./types";

type DbRow = Record<string, unknown>;

let schemaReady: Promise<void> | null = null;

export function getDbSql() {
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não foi configurada no ambiente.");
  }

  return neon(connectionString);
}

export async function ensureDatabase() {
  if (!schemaReady) {
    schemaReady = createSchema().then(seedDefaults);
  }

  return schemaReady;
}

async function createSchema() {
  const sql = getDbSql();

  await sql`
    CREATE TABLE IF NOT EXISTS rk_classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      min_age INTEGER NOT NULL DEFAULT 0,
      max_age INTEGER NOT NULL DEFAULT 99,
      service_schedule TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rk_families (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rk_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#2563eb',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rk_members (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL CHECK (kind IN ('child', 'guardian')),
      full_name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      birth_date TEXT NOT NULL DEFAULT '',
      congregates_since TEXT NOT NULL DEFAULT '',
      class_id TEXT REFERENCES rk_classes(id) ON DELETE SET NULL,
      family_id TEXT REFERENCES rk_families(id) ON DELETE SET NULL,
      address TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rk_member_categories (
      member_id TEXT NOT NULL REFERENCES rk_members(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES rk_categories(id) ON DELETE CASCADE,
      PRIMARY KEY (member_id, category_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rk_child_guardians (
      child_id TEXT NOT NULL REFERENCES rk_members(id) ON DELETE CASCADE,
      guardian_id TEXT NOT NULL REFERENCES rk_members(id) ON DELETE CASCADE,
      relationship TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (child_id, guardian_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rk_workers (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      normalized_name TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      roles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      notes TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE rk_workers
    ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT ''
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rk_users (
      id TEXT PRIMARY KEY,
      worker_id TEXT REFERENCES rk_workers(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL CHECK (role IN ('admin', 'coordinator', 'worker')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE rk_users
    ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT ''
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rk_lessons (
      id TEXT PRIMARY KEY,
      class_id TEXT REFERENCES rk_classes(id) ON DELETE SET NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
      theme TEXT NOT NULL,
      scripture_text TEXT NOT NULL DEFAULT '',
      lesson_text TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      minister_id TEXT REFERENCES rk_workers(id) ON DELETE SET NULL,
      support_id TEXT REFERENCES rk_workers(id) ON DELETE SET NULL,
      offering_cents INTEGER NOT NULL DEFAULT 0,
      total_children_snapshot INTEGER NOT NULL DEFAULT 0,
      closed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE rk_lessons
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
  `;

  await sql`
    ALTER TABLE rk_lessons
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rk_lesson_attachments (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL REFERENCES rk_lessons(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'link' CHECK (kind IN ('image', 'pdf', 'link', 'other')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rk_attendance (
      lesson_id TEXT NOT NULL REFERENCES rk_lessons(id) ON DELETE CASCADE,
      child_id TEXT NOT NULL REFERENCES rk_members(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'justified')),
      note TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (lesson_id, child_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rk_inventory_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      quantity NUMERIC NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'un',
      min_quantity NUMERIC NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rk_schedule_entries (
      id TEXT PRIMARY KEY,
      scheduled_at TEXT NOT NULL,
      service_label TEXT NOT NULL DEFAULT '',
      class_id TEXT REFERENCES rk_classes(id) ON DELETE SET NULL,
      worker_id TEXT REFERENCES rk_workers(id) ON DELETE SET NULL,
      role TEXT NOT NULL CHECK (role IN ('coordinator', 'minister', 'support', 'snack', 'cleaning')),
      theme TEXT NOT NULL DEFAULT '',
      scripture_text TEXT NOT NULL DEFAULT '',
      lesson_text TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS rk_members_kind_idx ON rk_members(kind)`;
  await sql`CREATE INDEX IF NOT EXISTS rk_members_class_idx ON rk_members(class_id)`;
  await sql`CREATE INDEX IF NOT EXISTS rk_lessons_scheduled_idx ON rk_lessons(scheduled_at)`;
  await sql`CREATE INDEX IF NOT EXISTS rk_lesson_attachments_lesson_idx ON rk_lesson_attachments(lesson_id)`;
  await sql`CREATE INDEX IF NOT EXISTS rk_schedule_scheduled_idx ON rk_schedule_entries(scheduled_at)`;
}

async function seedDefaults() {
  const sql = getDbSql();
  const classes = [
    {
      id: "class-2-3",
      name: "2 e 3 anos",
      minAge: 2,
      maxAge: 3,
      notes: "Turma base para crianças pequenas.",
    },
    {
      id: "class-4-5",
      name: "4 e 5 anos",
      minAge: 4,
      maxAge: 5,
      notes: "Turma intermediária.",
    },
    {
      id: "class-6-9",
      name: "6 a 9 anos",
      minAge: 6,
      maxAge: 9,
      notes: "Turma das crianças maiores.",
    },
  ];

  for (const classRoom of classes) {
    await sql`
      INSERT INTO rk_classes (id, name, min_age, max_age, service_schedule, notes)
      VALUES (
        ${classRoom.id},
        ${classRoom.name},
        ${classRoom.minAge},
        ${classRoom.maxAge},
        ${"Domingo e quarta-feira"},
        ${classRoom.notes}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  const categories = [
    ["cat-acompanhamento", "Acompanhamento", "#0f766e"],
    ["cat-neurodivergencia", "Atenção sensorial", "#7c3aed"],
    ["cat-novo", "Novo na Rede Kids", "#2563eb"],
  ];

  for (const [id, name, color] of categories) {
    await sql`
      INSERT INTO rk_categories (id, name, color)
      VALUES (${id}, ${name}, ${color})
      ON CONFLICT (name) DO NOTHING
    `;
  }

  const workers = [
    "Andressa",
    "Juliene",
    "Josiane",
    "Aninha",
    "Victória",
    "Leila",
    "Mainara",
    "Paola",
    "Vinícius",
    "Gustavo",
    "Gleise",
    "Valquíria",
    "Gilson",
    "Ingrid",
    "Andrei",
    "Jean",
    "Verônica",
    "Paloma",
    "Ana",
    "Carla Feitosa",
    "Rose",
    "Lucas",
    "Suelen",
    "Rafaela",
    "Patricia",
    "Philipe",
  ];

  for (const worker of workers) {
    await insertWorkerByName(worker, ["Ministro", "Apoio"]);
  }

  const inventory = [
    ["item-lapis", "Lápis", 25, "un", 10],
    ["item-folhas", "Folhas A4", 200, "folhas", 50],
    ["item-impressao", "Impressões disponíveis", 80, "páginas", 30],
  ] as const;

  for (const [id, name, quantity, unit, minQuantity] of inventory) {
    await sql`
      INSERT INTO rk_inventory_items (id, name, quantity, unit, min_quantity)
      VALUES (${id}, ${name}, ${quantity}, ${unit}, ${minQuantity})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

export async function getAppData(): Promise<AppData> {
  await ensureDatabase();

  const sql = getDbSql();
  const [
    classRows,
    categoryRows,
    memberRows,
    workerRows,
    lessonRows,
    attachmentRows,
    attendanceRows,
    inventoryRows,
    scheduleRows,
    userRows,
  ] = await Promise.all([
    sql`
      SELECT
        c.*,
        COUNT(m.id) FILTER (WHERE m.kind = 'child') AS child_count
      FROM rk_classes c
      LEFT JOIN rk_members m ON m.class_id = c.id
      GROUP BY c.id
      ORDER BY c.min_age, c.name
    `,
    sql`SELECT * FROM rk_categories ORDER BY name`,
    sql`
      SELECT
        m.*,
        c.name AS class_name,
        COALESCE(
          (
            SELECT array_agg(mc.category_id ORDER BY cat.name)
            FROM rk_member_categories mc
            JOIN rk_categories cat ON cat.id = mc.category_id
            WHERE mc.member_id = m.id
          ),
          ARRAY[]::TEXT[]
        ) AS category_ids,
        COALESCE(
          (
            SELECT array_agg(cat.name ORDER BY cat.name)
            FROM rk_member_categories mc
            JOIN rk_categories cat ON cat.id = mc.category_id
            WHERE mc.member_id = m.id
          ),
          ARRAY[]::TEXT[]
        ) AS category_names,
        COALESCE(
          (
            SELECT array_agg(g.id ORDER BY g.full_name)
            FROM rk_child_guardians cg
            JOIN rk_members g ON g.id = cg.guardian_id
            WHERE cg.child_id = m.id
          ),
          ARRAY[]::TEXT[]
        ) AS guardian_ids,
        COALESCE(
          (
            SELECT array_agg(g.full_name ORDER BY g.full_name)
            FROM rk_child_guardians cg
            JOIN rk_members g ON g.id = cg.guardian_id
            WHERE cg.child_id = m.id
          ),
          ARRAY[]::TEXT[]
        ) AS guardian_names,
        COALESCE(
          (
            SELECT array_agg(c2.id ORDER BY c2.full_name)
            FROM rk_child_guardians cg
            JOIN rk_members c2 ON c2.id = cg.child_id
            WHERE cg.guardian_id = m.id
          ),
          ARRAY[]::TEXT[]
        ) AS child_ids,
        COALESCE(
          (
            SELECT array_agg(c2.full_name ORDER BY c2.full_name)
            FROM rk_child_guardians cg
            JOIN rk_members c2 ON c2.id = cg.child_id
            WHERE cg.guardian_id = m.id
          ),
          ARRAY[]::TEXT[]
        ) AS child_names
      FROM rk_members m
      LEFT JOIN rk_classes c ON c.id = m.class_id
      ORDER BY m.kind, m.full_name
    `,
    sql`SELECT * FROM rk_workers ORDER BY active DESC, full_name`,
    sql`
      SELECT
        l.*,
        c.name AS class_name,
        minister.full_name AS minister_name,
        support.full_name AS support_name,
        (SELECT COUNT(*) FROM rk_lesson_attachments la WHERE la.lesson_id = l.id) AS attachment_count,
        COUNT(a.child_id) FILTER (WHERE l.status = 'closed' AND a.status = 'present') AS present_count,
        COUNT(a.child_id) FILTER (WHERE l.status = 'closed' AND a.status = 'absent') AS absent_count,
        COUNT(a.child_id) FILTER (WHERE l.status = 'closed' AND a.status = 'justified') AS justified_count
      FROM rk_lessons l
      LEFT JOIN rk_classes c ON c.id = l.class_id
      LEFT JOIN rk_workers minister ON minister.id = l.minister_id
      LEFT JOIN rk_workers support ON support.id = l.support_id
      LEFT JOIN rk_attendance a ON a.lesson_id = l.id
      GROUP BY l.id, c.name, minister.full_name, support.full_name
      ORDER BY l.scheduled_at DESC
    `,
    sql`
      SELECT *
      FROM rk_lesson_attachments
      ORDER BY created_at DESC
    `,
    sql`
      SELECT
        a.*,
        m.full_name AS child_name
      FROM rk_attendance a
      JOIN rk_members m ON m.id = a.child_id
      ORDER BY a.updated_at DESC
    `,
    sql`SELECT * FROM rk_inventory_items ORDER BY name`,
    sql`
      SELECT
        s.*,
        c.name AS class_name,
        w.full_name AS worker_name
      FROM rk_schedule_entries s
      LEFT JOIN rk_classes c ON c.id = s.class_id
      LEFT JOIN rk_workers w ON w.id = s.worker_id
      ORDER BY s.scheduled_at ASC, s.service_label, s.role
    `,
    sql`
      SELECT
        u.*,
        COALESCE(u.password_hash, '') <> '' AS has_password,
        w.full_name AS worker_name
      FROM rk_users u
      LEFT JOIN rk_workers w ON w.id = u.worker_id
      ORDER BY u.name
    `,
  ]);

  const classes = classRows.map(mapClassRoom);
  const members = memberRows.map(mapMember);
  const progress = buildProgress(members, classes);

  return {
    classes,
    categories: categoryRows.map(mapCategory),
    members,
    workers: workerRows.map(mapWorker),
    lessons: lessonRows.map(mapLesson),
    lessonAttachments: attachmentRows.map(mapLessonAttachment),
    attendance: attendanceRows.map(mapAttendance),
    inventory: inventoryRows.map(mapInventoryItem),
    schedule: scheduleRows.map(mapScheduleEntry),
    users: userRows.map(mapUser),
    progress,
  };
}

export async function ensureWorkerByName(name: string, roles: string[] = []) {
  await ensureDatabase();
  return insertWorkerByName(name, roles);
}

export async function findAppUserById(userId: string) {
  await ensureDatabase();
  const sql = getDbSql();
  const rows = await sql`
    SELECT
      u.*, 
      COALESCE(u.password_hash, '') <> '' AS has_password,
      w.full_name AS worker_name
    FROM rk_users u
    LEFT JOIN rk_workers w ON w.id = u.worker_id
    WHERE u.id = ${userId}
    LIMIT 1
  `;

  if (!rows[0]) {
    return null;
  }

  return mapUser(rows[0]);
}

export async function findAuthUserByEmail(email: string) {
  await ensureDatabase();
  const sql = getDbSql();
  const rows = await sql`
    SELECT
      u.*,
      COALESCE(u.password_hash, '') <> '' AS has_password,
      w.full_name AS worker_name
    FROM rk_users u
    LEFT JOIN rk_workers w ON w.id = u.worker_id
    WHERE LOWER(u.email) = LOWER(${email.trim()})
    LIMIT 1
  `;

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    ...mapUser(row),
    passwordHash: text(row.password_hash),
  };
}

export async function hasConfiguredUsers() {
  await ensureDatabase();
  const sql = getDbSql();
  const rows = await sql`
    SELECT EXISTS(
      SELECT 1
      FROM rk_users
      WHERE COALESCE(password_hash, '') <> ''
    ) AS configured
  `;

  return Boolean(rows[0]?.configured);
}

async function insertWorkerByName(name: string, roles: string[] = []) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "";
  }

  const sql = getDbSql();
  const normalizedName = normalizeName(trimmedName);
  const id = `worker-${randomUUID()}`;
  const rows = await sql`
    INSERT INTO rk_workers (id, full_name, normalized_name, roles)
    VALUES (${id}, ${trimmedName}, ${normalizedName}, ${roles})
    ON CONFLICT (normalized_name)
    DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id
  `;

  return String(rows[0]?.id ?? "");
}

export async function findClassIdByLabel(label: string) {
  await ensureDatabase();

  const data = await getAppData();
  const normalizedLabel = normalizeName(label);

  const exactMatch = data.classes.find((classRoom) => {
    const normalizedClass = normalizeName(classRoom.name);
    return (
      normalizedLabel.includes(normalizedClass) ||
      normalizedClass.includes(normalizedLabel)
    );
  });

  if (exactMatch) {
    return exactMatch.id;
  }

  if (/2.*3/.test(normalizedLabel)) return "class-2-3";
  if (/4.*5/.test(normalizedLabel)) return "class-4-5";
  if (/6.*9/.test(normalizedLabel)) return "class-6-9";

  return "";
}

export function createId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

export function createShortId(prefix: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  const code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");

  return `${prefix}-${code}`;
}

export function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function mapClassRoom(row: DbRow): ClassRoom {
  return {
    id: text(row.id),
    name: text(row.name),
    minAge: number(row.min_age),
    maxAge: number(row.max_age),
    serviceSchedule: text(row.service_schedule),
    notes: text(row.notes),
    active: Boolean(row.active),
    childCount: number(row.child_count),
  };
}

function mapCategory(row: DbRow): Category {
  return {
    id: text(row.id),
    name: text(row.name),
    color: text(row.color),
  };
}

function mapMember(row: DbRow): Member {
  const birthDate = text(row.birth_date);

  return {
    id: text(row.id),
    kind: text(row.kind) === "guardian" ? "guardian" : "child",
    fullName: text(row.full_name),
    phone: text(row.phone),
    birthDate,
    congregatesSince: text(row.congregates_since),
    classId: text(row.class_id),
    className: text(row.class_name),
    address: text(row.address),
    notes: text(row.notes),
    categoryIds: textArray(row.category_ids),
    categoryNames: textArray(row.category_names),
    guardianIds: textArray(row.guardian_ids),
    guardianNames: textArray(row.guardian_names),
    childIds: textArray(row.child_ids),
    childNames: textArray(row.child_names),
    age: birthDate ? calculateAge(birthDate) : null,
  };
}

function mapWorker(row: DbRow): Worker {
  return {
    id: text(row.id),
    fullName: text(row.full_name),
    phone: text(row.phone),
    bio: text(row.bio),
    roles: textArray(row.roles),
    notes: text(row.notes),
    active: Boolean(row.active),
  };
}

function mapLesson(row: DbRow): Lesson {
  const status = text(row.status);

  return {
    id: text(row.id),
    classId: text(row.class_id),
    className: text(row.class_name),
    scheduledAt: text(row.scheduled_at),
    status: status === "closed" ? "closed" : "open",
    theme: text(row.theme),
    scriptureText: text(row.scripture_text),
    lessonText: text(row.lesson_text),
    notes: text(row.notes),
    ministerId: text(row.minister_id),
    ministerName: text(row.minister_name),
    supportId: text(row.support_id),
    supportName: text(row.support_name),
    offeringCents: number(row.offering_cents),
    totalChildrenSnapshot: number(row.total_children_snapshot),
    presentCount: number(row.present_count),
    absentCount: number(row.absent_count),
    justifiedCount: number(row.justified_count),
    attachmentCount: number(row.attachment_count),
  };
}

function mapLessonAttachment(row: DbRow): LessonAttachment {
  const kind = text(row.kind);

  return {
    id: text(row.id),
    lessonId: text(row.lesson_id),
    name: text(row.name),
    url: text(row.url),
    kind:
      kind === "image" || kind === "pdf" || kind === "other" ? kind : "link",
    notes: text(row.notes),
    createdAt: text(row.created_at),
  };
}

function mapAttendance(row: DbRow): Attendance {
  const rawStatus = text(row.status);
  const status =
    rawStatus === "absent" || rawStatus === "justified" ? rawStatus : "present";

  return {
    lessonId: text(row.lesson_id),
    childId: text(row.child_id),
    childName: text(row.child_name),
    status,
    note: text(row.note),
  };
}

function mapInventoryItem(row: DbRow): InventoryItem {
  return {
    id: text(row.id),
    name: text(row.name),
    quantity: number(row.quantity),
    unit: text(row.unit),
    minQuantity: number(row.min_quantity),
    notes: text(row.notes),
  };
}

function mapScheduleEntry(row: DbRow): ScheduleEntry {
  const role = text(row.role);

  return {
    id: text(row.id),
    scheduledAt: text(row.scheduled_at),
    serviceLabel: text(row.service_label),
    classId: text(row.class_id),
    className: text(row.class_name),
    workerId: text(row.worker_id),
    workerName: text(row.worker_name),
    role:
      role === "coordinator" ||
      role === "support" ||
      role === "snack" ||
      role === "cleaning"
        ? role
        : "minister",
    theme: text(row.theme),
    scriptureText: text(row.scripture_text),
    lessonText: text(row.lesson_text),
    notes: text(row.notes),
  };
}

function mapUser(row: DbRow): AppUser {
  const role = text(row.role);

  return {
    id: text(row.id),
    workerId: text(row.worker_id),
    workerName: text(row.worker_name),
    name: text(row.name),
    email: text(row.email),
    role: role === "admin" || role === "coordinator" ? role : "worker",
    hasPassword: Boolean(row.has_password),
  };
}

function buildProgress(members: Member[], classes: ClassRoom[]): ProgressItem[] {
  const children = members.filter((member) => member.kind === "child");

  return children
    .map((child) => {
      if (child.age === null) {
        return {
          childId: child.id,
          childName: child.fullName,
          age: null,
          currentClassName: child.className || "Sem turma",
          recommendedClassName: "Data de nascimento pendente",
          status: "no_rule",
          message: "Cadastre a data de nascimento para calcular a troca.",
        } satisfies ProgressItem;
      }

      const recommendedClass = classes
        .filter(
          (classRoom) =>
            classRoom.active &&
            child.age !== null &&
            child.age >= classRoom.minAge &&
            child.age <= classRoom.maxAge,
        )
        .sort((a, b) => a.minAge - b.minAge)[0];

      if (!recommendedClass) {
        return {
          childId: child.id,
          childName: child.fullName,
          age: child.age,
          currentClassName: child.className || "Sem turma",
          recommendedClassName: "Sem turma compatível",
          status: "no_rule",
          message: "Crie ou ajuste uma turma para essa faixa etária.",
        } satisfies ProgressItem;
      }

      if (!child.classId) {
        return {
          childId: child.id,
          childName: child.fullName,
          age: child.age,
          currentClassName: "Sem turma",
          recommendedClassName: recommendedClass.name,
          status: "unassigned",
          message: `Vincule à turma ${recommendedClass.name}.`,
        } satisfies ProgressItem;
      }

      if (child.classId !== recommendedClass.id) {
        return {
          childId: child.id,
          childName: child.fullName,
          age: child.age,
          currentClassName: child.className,
          recommendedClassName: recommendedClass.name,
          status: "move",
          message: `Já pode trocar para ${recommendedClass.name}.`,
        } satisfies ProgressItem;
      }

      return {
        childId: child.id,
        childName: child.fullName,
        age: child.age,
        currentClassName: child.className,
        recommendedClassName: recommendedClass.name,
        status: "ok",
        message: "Está na turma adequada.",
      } satisfies ProgressItem;
    })
    .sort((a, b) => {
      const priority = { move: 0, unassigned: 1, no_rule: 2, ok: 3 };
      return priority[a.status] - priority[b.status];
    });
}

function calculateAge(dateValue: string) {
  const birthDate = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function number(value: unknown) {
  if (typeof value === "number") return value;

  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function textArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.startsWith("{")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.replace(/^"|"$/g, "").trim())
      .filter(Boolean);
  }

  return [];
}
