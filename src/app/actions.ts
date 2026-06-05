"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth";
import {
  createId,
  createShortId,
  ensureDatabase,
  ensureWorkerByName,
  findAuthUserByEmail,
  getAppData,
  getDbSql,
  normalizeName,
} from "@/lib/db";
import { hashPassword } from "@/lib/auth/crypto";
import type { AppData, ClassRoom, ScheduleEntry } from "@/lib/types";

type ScheduleRole = ScheduleEntry["role"];

export async function refreshData(): Promise<AppData> {
  await requireAuthenticatedUser();
  return getAppData();
}

export async function createClassRoom(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();

  await sql`
    INSERT INTO rk_classes (id, name, min_age, max_age, service_schedule, notes, active)
    VALUES (
      ${createId("class")},
      ${field(formData, "name")},
      ${integerField(formData, "minAge")},
      ${integerField(formData, "maxAge")},
      ${field(formData, "serviceSchedule")},
      ${field(formData, "notes")},
      ${true}
    )
  `;

  return refreshed();
}

export async function createCategory(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();

  await sql`
    INSERT INTO rk_categories (id, name, color)
    VALUES (${createId("category")}, ${field(formData, "name")}, ${field(formData, "color") || "#2563eb"})
    ON CONFLICT (name)
    DO UPDATE SET color = EXCLUDED.color
  `;

  return refreshed();
}

export async function createMember(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const kind = field(formData, "kind") === "guardian" ? "guardian" : "child";
  const memberId = createId("member");
  const fullName = field(formData, "fullName");
  const categoryIds = formData
    .getAll("categoryIds")
    .map((value) => String(value))
    .filter(Boolean);

  await sql`
    INSERT INTO rk_members (
      id,
      kind,
      full_name,
      normalized_name,
      phone,
      birth_date,
      congregates_since,
      class_id,
      address,
      notes
    )
    VALUES (
      ${memberId},
      ${kind},
      ${fullName},
      ${normalizeName(fullName)},
      ${field(formData, "phone")},
      ${field(formData, "birthDate")},
      ${field(formData, "congregatesSince")},
      ${nullable(kind === "child" ? field(formData, "classId") : "")},
      ${field(formData, "address")},
      ${field(formData, "notes")}
    )
  `;

  await replaceMemberGuardianLinks(sql, memberId, kind, formData);

  for (const categoryId of categoryIds) {
    await sql`
      INSERT INTO rk_member_categories (member_id, category_id)
      VALUES (${memberId}, ${categoryId})
      ON CONFLICT DO NOTHING
    `;
  }

  return refreshed();
}

export async function updateMember(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const memberId = field(formData, "memberId");
  const kind = field(formData, "kind") === "guardian" ? "guardian" : "child";
  const fullName = field(formData, "fullName");
  const categoryIds = formData
    .getAll("categoryIds")
    .map((value) => String(value))
    .filter(Boolean);

  await sql`
    UPDATE rk_members
    SET
      kind = ${kind},
      full_name = ${fullName},
      normalized_name = ${normalizeName(fullName)},
      phone = ${field(formData, "phone")},
      birth_date = ${field(formData, "birthDate")},
      congregates_since = ${field(formData, "congregatesSince")},
      class_id = ${nullable(kind === "child" ? field(formData, "classId") : "")},
      address = ${field(formData, "address")},
      notes = ${field(formData, "notes")}
    WHERE id = ${memberId}
  `;

  await replaceMemberGuardianLinks(sql, memberId, kind, formData);

  await sql`DELETE FROM rk_member_categories WHERE member_id = ${memberId}`;

  for (const categoryId of categoryIds) {
    await sql`
      INSERT INTO rk_member_categories (member_id, category_id)
      VALUES (${memberId}, ${categoryId})
      ON CONFLICT DO NOTHING
    `;
  }

  return refreshed();
}

export async function deleteMember(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();

  await sql`
    DELETE FROM rk_members
    WHERE id = ${field(formData, "memberId")}
  `;

  return refreshed();
}

export async function createWorker(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const fullName = field(formData, "fullName");
  const roles = formData
    .getAll("roles")
    .map((value) => String(value))
    .filter(Boolean);

  await sql`
    INSERT INTO rk_workers (id, full_name, normalized_name, phone, bio, roles, notes, active)
    VALUES (
      ${createId("worker")},
      ${fullName},
      ${normalizeName(fullName)},
      ${field(formData, "phone")},
      ${field(formData, "bio")},
      ${roles},
      ${field(formData, "notes")},
      ${true}
    )
    ON CONFLICT (normalized_name)
    DO UPDATE SET
      phone = EXCLUDED.phone,
      bio = EXCLUDED.bio,
      roles = EXCLUDED.roles,
      notes = EXCLUDED.notes,
      active = TRUE
  `;

  return refreshed();
}

export async function updateWorker(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const workerId = field(formData, "workerId");
  const fullName = field(formData, "fullName");
  const roles = formData
    .getAll("roles")
    .map((value) => String(value))
    .filter(Boolean);

  await sql`
    UPDATE rk_workers
    SET
      full_name = ${fullName},
      normalized_name = ${normalizeName(fullName)},
      phone = ${field(formData, "phone")},
      bio = ${field(formData, "bio")},
      roles = ${roles},
      notes = ${field(formData, "notes")},
      active = TRUE
    WHERE id = ${workerId}
  `;

  return refreshed();
}

export async function deleteWorker(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();

  await sql`
    DELETE FROM rk_workers
    WHERE id = ${field(formData, "workerId")}
  `;

  return refreshed();
}

export async function createLesson(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();

  const lessonId = await insertLesson(sql, formData);

  return refreshed(lessonId);
}

export async function createLessonAndOpen(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const lessonId = await insertLesson(sql, formData);
  const data = await refreshed(lessonId);

  return { data, lessonId };
}

export async function updateLesson(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const lessonId = field(formData, "lessonId");
  const classId = field(formData, "classId");
  const totalChildrenSnapshot = await resolveLessonChildrenSnapshot(sql, classId);
  const hasNotes = formData.has("notes");
  const hasOffering = formData.has("offering");
  await assertLessonOpen(sql, lessonId);

  await sql`
    UPDATE rk_lessons
    SET
      class_id = ${nullable(classId)},
      scheduled_at = ${field(formData, "scheduledAt")},
      theme = ${field(formData, "theme")},
      scripture_text = ${field(formData, "scriptureText")},
      notes = CASE WHEN ${hasNotes} THEN ${field(formData, "notes")} ELSE notes END,
      minister_id = ${nullable(field(formData, "ministerId"))},
      support_id = ${nullable(field(formData, "supportId"))},
      offering_cents = CASE
        WHEN ${hasOffering} THEN ${moneyToCents(field(formData, "offering"))}
        ELSE offering_cents
      END,
      total_children_snapshot = ${totalChildrenSnapshot}
    WHERE id = ${lessonId}
  `;

  return refreshed(lessonId);
}

export async function deleteLesson(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const lessonId = field(formData, "lessonId");
  await assertLessonOpen(sql, lessonId);

  await sql`
    DELETE FROM rk_lessons
    WHERE id = ${lessonId}
  `;

  return refreshed(lessonId);
}

async function insertLesson(sql: ReturnType<typeof getDbSql>, formData: FormData) {
  const lessonId = await createUniqueLessonId(sql);
  const classId = field(formData, "classId");
  const totalChildrenSnapshot = await resolveLessonChildrenSnapshot(sql, classId);

  await sql`
    INSERT INTO rk_lessons (
      id,
      class_id,
      scheduled_at,
      status,
      theme,
      scripture_text,
      notes,
      minister_id,
      support_id,
      offering_cents,
      total_children_snapshot
    )
    VALUES (
      ${lessonId},
      ${nullable(classId)},
      ${field(formData, "scheduledAt")},
      ${"open"},
      ${field(formData, "theme")},
      ${field(formData, "scriptureText")},
      ${field(formData, "notes")},
      ${nullable(field(formData, "ministerId"))},
      ${nullable(field(formData, "supportId"))},
      ${moneyToCents(field(formData, "offering"))},
      ${totalChildrenSnapshot}
    )
  `;

  return lessonId;
}

export async function saveAttendance(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const lessonId = field(formData, "lessonId");
  const status = coerceAttendanceStatus(field(formData, "status"));
  const note = status === "justified" ? field(formData, "note").trim() : "";
  await assertLessonOpen(sql, lessonId);
  const lessonRows = await sql`
    SELECT status FROM rk_lessons WHERE id = ${lessonId} LIMIT 1
  `;

  if (lessonRows[0]?.status === "closed") {
    throw new Error("Essa aula já está fechada.");
  }

  if (status === "justified" && !note) {
    throw new Error("Informe a justificativa.");
  }

  await sql`
    INSERT INTO rk_attendance (lesson_id, child_id, status, note, updated_at)
    VALUES (
      ${lessonId},
      ${field(formData, "childId")},
      ${status},
      ${note},
      NOW()
    )
    ON CONFLICT (lesson_id, child_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      note = EXCLUDED.note,
      updated_at = NOW()
  `;

  return refreshed(lessonId);
}

export async function saveBulkAttendance(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const lessonId = field(formData, "lessonId");
  const status = coerceAttendanceStatus(field(formData, "status"));
  const note = status === "justified" ? field(formData, "note").trim() : "";
  const childIds = formData
    .getAll("childIds")
    .map((value) => String(value))
    .filter(Boolean);
  await assertLessonOpen(sql, lessonId);
  const lessonRows = await sql`
    SELECT status FROM rk_lessons WHERE id = ${lessonId} LIMIT 1
  `;

  if (lessonRows[0]?.status === "closed") {
    throw new Error("Essa aula já está fechada.");
  }

  if (status === "justified" && !note) {
    throw new Error("Informe a justificativa.");
  }

  for (const childId of childIds) {
    await sql`
      INSERT INTO rk_attendance (lesson_id, child_id, status, note, updated_at)
      VALUES (${lessonId}, ${childId}, ${status}, ${note}, NOW())
      ON CONFLICT (lesson_id, child_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        note = EXCLUDED.note,
        updated_at = NOW()
    `;
  }

  return refreshed(lessonId);
}

export async function closeLesson(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const lessonId = field(formData, "lessonId");
  await assertLessonOpen(sql, lessonId);

  const lessonRows = await sql`
    SELECT class_id
    FROM rk_lessons
    WHERE id = ${lessonId}
    LIMIT 1
  `;
  const lessonClassId = lessonRows[0]?.class_id ?? null;

  if (lessonClassId) {
    await sql`
      INSERT INTO rk_attendance (lesson_id, child_id, status, note, updated_at)
      SELECT
        ${lessonId},
        member.id,
        ${"absent"},
        ${""},
        NOW()
      FROM rk_members AS member
      WHERE member.kind = 'child'
        AND member.class_id = ${lessonClassId}
        AND NOT EXISTS (
          SELECT 1
          FROM rk_attendance AS attendance
          WHERE attendance.lesson_id = ${lessonId}
            AND attendance.child_id = member.id
        )
      ON CONFLICT (lesson_id, child_id) DO NOTHING
    `;
  } else {
    await sql`
      INSERT INTO rk_attendance (lesson_id, child_id, status, note, updated_at)
      SELECT
        ${lessonId},
        member.id,
        ${"absent"},
        ${""},
        NOW()
      FROM rk_members AS member
      WHERE member.kind = 'child'
        AND NOT EXISTS (
          SELECT 1
          FROM rk_attendance AS attendance
          WHERE attendance.lesson_id = ${lessonId}
            AND attendance.child_id = member.id
        )
      ON CONFLICT (lesson_id, child_id) DO NOTHING
    `;
  }

  await sql`
    UPDATE rk_lessons
    SET
      status = 'closed',
      closed_at = NOW(),
      offering_cents = ${moneyToCents(field(formData, "offering"))},
      notes = ${field(formData, "notes")}
    WHERE id = ${lessonId}
  `;

  return refreshed(lessonId);
}

export async function reopenLesson(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const lessonId = field(formData, "lessonId");

  await sql`
    UPDATE rk_lessons
    SET status = 'open', closed_at = NULL
    WHERE id = ${lessonId}
  `;

  return refreshed(lessonId);
}

export async function createLessonAttachment(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const lessonId = field(formData, "lessonId");
  await assertLessonOpen(sql, lessonId);

  await sql`
    INSERT INTO rk_lesson_attachments (id, lesson_id, name, url, kind, notes)
    VALUES (
      ${createId("attachment")},
      ${lessonId},
      ${field(formData, "name")},
      ${field(formData, "url")},
      ${coerceAttachmentKind(field(formData, "kind"))},
      ${field(formData, "notes")}
    )
  `;

  return refreshed(lessonId);
}

export async function createLessonAttachments(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const lessonId = field(formData, "lessonId");
  await assertLessonOpen(sql, lessonId);
  const files = formData.getAll("files").filter(isUploadFile);

  if (!files.length) {
    throw new Error("Selecione pelo menos um anexo.");
  }

  for (const file of files) {
    const mimeType = file.type || "application/octet-stream";
    const dataUrl = await fileToDataUrl(file, mimeType);

    await sql`
      INSERT INTO rk_lesson_attachments (id, lesson_id, name, url, kind, notes)
      VALUES (
        ${createId("attachment")},
        ${lessonId},
        ${attachmentFileName(file.name)},
        ${dataUrl},
        ${inferAttachmentKind(mimeType, file.name)},
        ${""}
      )
    `;
  }

  return refreshed(lessonId);
}

export async function deleteLessonAttachment(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const lessonId = field(formData, "lessonId");
  await assertLessonOpen(sql, lessonId);

  await sql`
    DELETE FROM rk_lesson_attachments
    WHERE id = ${field(formData, "attachmentId")}
      AND lesson_id = ${lessonId}
  `;

  return refreshed(lessonId);
}

export async function createInventoryItem(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();

  await sql`
    INSERT INTO rk_inventory_items (id, name, quantity, unit, min_quantity, notes)
    VALUES (
      ${createId("item")},
      ${field(formData, "name")},
      ${Math.max(0, decimalField(formData, "quantity"))},
      ${field(formData, "unit") || "un"},
      ${Math.max(0, decimalField(formData, "minQuantity"))},
      ${field(formData, "notes")}
    )
  `;

  return refreshed();
}

export async function updateInventoryItem(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();

  await sql`
    UPDATE rk_inventory_items
    SET
      name = ${field(formData, "name")},
      quantity = ${Math.max(0, decimalField(formData, "quantity"))},
      unit = ${field(formData, "unit") || "un"},
      min_quantity = ${Math.max(0, decimalField(formData, "minQuantity"))},
      notes = ${field(formData, "notes")}
    WHERE id = ${field(formData, "itemId")}
  `;

  return refreshed();
}

export async function adjustInventoryItemQuantity(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();

  await sql`
    UPDATE rk_inventory_items
    SET quantity = GREATEST(0, quantity + ${decimalField(formData, "delta")})
    WHERE id = ${field(formData, "itemId")}
  `;

  return refreshed();
}

export async function deleteInventoryItem(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();

  await sql`
    DELETE FROM rk_inventory_items
    WHERE id = ${field(formData, "itemId")}
  `;

  return refreshed();
}

export async function createScheduleEntry(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();

  await sql`
    INSERT INTO rk_schedule_entries (
      id,
      scheduled_at,
      service_label,
      class_id,
      worker_id,
      role,
      theme,
      scripture_text,
      lesson_text,
      notes
    )
    VALUES (
      ${createId("schedule")},
      ${field(formData, "scheduledAt")},
      ${field(formData, "serviceLabel")},
      ${nullable(field(formData, "classId"))},
      ${nullable(field(formData, "workerId"))},
      ${coerceScheduleRole(field(formData, "role"))},
      ${field(formData, "theme")},
      ${field(formData, "scriptureText")},
      ${field(formData, "lessonText")},
      ${field(formData, "notes")}
    )
  `;

  return refreshed();
}

export async function createUser(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();
  const password = field(formData, "password");

  if (password.length < 6) {
    throw new Error("Informe uma senha com pelo menos 6 caracteres.");
  }

  const existingUser = await findAuthUserByEmail(field(formData, "email"));
  const passwordHash = hashPassword(password);

  await sql`
    INSERT INTO rk_users (id, worker_id, name, email, password_hash, role)
    VALUES (
      ${existingUser?.id || createId("user")},
      ${nullable(field(formData, "workerId"))},
      ${field(formData, "name")},
      ${field(formData, "email")},
      ${passwordHash},
      ${coerceUserRole(field(formData, "role"))}
    )
    ON CONFLICT (email)
    DO UPDATE SET
      worker_id = EXCLUDED.worker_id,
      name = EXCLUDED.name,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role
  `;

  return refreshed();
}

export async function moveChildToClass(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();
  const sql = getDbSql();

  await sql`
    UPDATE rk_members
    SET class_id = ${nullable(field(formData, "classId"))}
    WHERE id = ${field(formData, "childId")} AND kind = 'child'
  `;

  return refreshed();
}

export async function importScheduleText(formData: FormData) {
  await requireAuthenticatedUser();
  await ensureDatabase();

  const text = field(formData, "scheduleText");
  const data = await getAppData();
  const sql = getDbSql();
  const year = extractYear(text);
  let currentService = "";
  let currentScheduledAt = "";
  let inserted = 0;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^\*+/, "").trim();

    if (!line) continue;

    const header = line.match(
      /^(Domingo\s+Manh[aã]|Domingo\s+Noite|Quarta[- ]feira)\s+(\d{1,2})\/(\d{1,2})/i,
    );

    if (header) {
      currentService = normalizeServiceLabel(header[1]);
      currentScheduledAt = buildScheduledAt(
        year,
        Number(header[3]),
        Number(header[2]),
        currentService,
      );
      continue;
    }

    if (!currentScheduledAt || !line.includes(":")) continue;

    const [labelPart, ...valueParts] = line.split(":");
    const label = labelPart.trim();
    const value = valueParts.join(":").trim();

    if (!label || !value) continue;

    const normalizedLabel = normalizeName(label);
    const isCoordination = normalizedLabel.startsWith("coordenacao");
    const isSnackOrCleaning = normalizedLabel.startsWith("apoio");
    const classId = isCoordination || isSnackOrCleaning ? "" : matchClassId(label, data.classes);
    const names = splitWorkerNames(value);

    for (const [index, workerName] of names.entries()) {
      const workerId = await ensureWorkerByName(workerName, ["Ministro", "Apoio"]);
      const role = inferScheduleRole({
        isCoordination,
        isSnackOrCleaning,
        label: normalizedLabel,
        index,
      });

      await sql`
        INSERT INTO rk_schedule_entries (
          id,
          scheduled_at,
          service_label,
          class_id,
          worker_id,
          role,
          notes
        )
        VALUES (
          ${createId("schedule")},
          ${currentScheduledAt},
          ${currentService},
          ${nullable(classId)},
          ${nullable(workerId)},
          ${role},
          ${`Importado da escala: ${label}`}
        )
      `;
      inserted += 1;
    }
  }

  if (inserted === 0) {
    throw new Error("Não encontrei linhas de escala para importar.");
  }

  return refreshed();
}

async function refreshed(lessonId?: string) {
  revalidatePath("/");
  revalidatePath("/aulas");
  revalidatePath("/membros");
  revalidatePath("/progresso");
  revalidatePath("/trabalhadores");
  revalidatePath("/turmas");
  revalidatePath("/estoque");
  revalidatePath("/escala");
  revalidatePath("/relatorios");
  revalidatePath("/categorias");
  revalidatePath("/usuarios");

  if (lessonId) {
    revalidatePath(`/aulas/${lessonId}`);
  }

  return getAppData();
}

async function replaceMemberGuardianLinks(
  sql: ReturnType<typeof getDbSql>,
  memberId: string,
  kind: "child" | "guardian",
  formData: FormData,
) {
  if (kind === "child") {
    const guardianIds = formData
      .getAll("guardianIds")
      .map((value) => String(value))
      .filter(Boolean);

    await sql`DELETE FROM rk_child_guardians WHERE child_id = ${memberId}`;

    for (const guardianId of guardianIds) {
      if (guardianId === memberId) continue;

      await sql`
        INSERT INTO rk_child_guardians (child_id, guardian_id)
        VALUES (${memberId}, ${guardianId})
        ON CONFLICT DO NOTHING
      `;
    }

    return;
  }

  const childIds = formData
    .getAll("childIds")
    .map((value) => String(value))
    .filter(Boolean);

  await sql`DELETE FROM rk_child_guardians WHERE guardian_id = ${memberId}`;

  for (const childId of childIds) {
    if (childId === memberId) continue;

    await sql`
      INSERT INTO rk_child_guardians (child_id, guardian_id)
      VALUES (${childId}, ${memberId})
      ON CONFLICT DO NOTHING
    `;
  }
}

async function assertLessonOpen(sql: ReturnType<typeof getDbSql>, lessonId: string) {
  const lessonRows = await sql`
    SELECT status FROM rk_lessons WHERE id = ${lessonId} LIMIT 1
  `;

  if (!lessonRows.length) {
    throw new Error("Aula não encontrada.");
  }

  if (lessonRows[0]?.status === "closed") {
    throw new Error("Essa aula está fechada. Reabra para alterar.");
  }
}

async function createUniqueLessonId(sql: ReturnType<typeof getDbSql>) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const lessonId = createShortId("aula");
    const existing = await sql`
      SELECT id FROM rk_lessons WHERE id = ${lessonId} LIMIT 1
    `;

    if (existing.length === 0) {
      return lessonId;
    }
  }

  throw new Error("Não foi possível gerar um ID curto para a aula.");
}

async function resolveLessonChildrenSnapshot(
  sql: ReturnType<typeof getDbSql>,
  classId: string,
) {
  const rows = classId
    ? await sql`
        SELECT COUNT(*)::int AS count
        FROM rk_members
        WHERE kind = 'child' AND class_id = ${classId}
      `
    : await sql`
        SELECT COUNT(*)::int AS count
        FROM rk_members
        WHERE kind = 'child'
      `;

  return rows[0]?.count ?? 0;
}

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullable(value: string) {
  return value.trim() ? value.trim() : null;
}

function integerField(formData: FormData, key: string) {
  const parsed = Number.parseInt(field(formData, key), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function decimalField(formData: FormData, key: string) {
  const parsed = Number(field(formData, key).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyToCents(value: string) {
  const parsed = Number(value.replace(/[^\d,.]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function coerceAttendanceStatus(value: string) {
  if (value === "absent" || value === "justified") return value;
  return "present";
}

function coerceScheduleRole(value: string): ScheduleRole {
  if (
    value === "coordinator" ||
    value === "support" ||
    value === "snack" ||
    value === "cleaning"
  ) {
    return value;
  }

  return "minister";
}

function coerceAttachmentKind(value: string) {
  if (value === "image" || value === "pdf" || value === "other") {
    return value;
  }

  return "link";
}

function isUploadFile(value: FormDataEntryValue): value is File {
  return typeof value !== "string" && value.size > 0;
}

async function fileToDataUrl(file: File, mimeType: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

function attachmentFileName(name: string) {
  return name.trim() || "Anexo";
}

function inferAttachmentKind(mimeType: string, fileName: string) {
  const normalizedMime = mimeType.toLowerCase();
  const normalizedName = fileName.toLowerCase();

  if (
    normalizedMime.startsWith("image/") ||
    /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/.test(normalizedName)
  ) {
    return "image";
  }

  if (normalizedMime === "application/pdf" || normalizedName.endsWith(".pdf")) {
    return "pdf";
  }

  return "other";
}

function coerceUserRole(value: string) {
  if (value === "admin" || value === "coordinator") return value;
  return "worker";
}

function extractYear(text: string) {
  const yearMatch = text.match(/\b(20\d{2})\b/);
  return yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
}

function normalizeServiceLabel(value: string) {
  const normalized = normalizeName(value);

  if (normalized.includes("domingo") && normalized.includes("manha")) {
    return "Domingo Manhã";
  }

  if (normalized.includes("domingo") && normalized.includes("noite")) {
    return "Domingo Noite";
  }

  return "Quarta-feira";
}

function buildScheduledAt(year: number, month: number, day: number, serviceLabel: string) {
  const hour =
    serviceLabel === "Domingo Manhã"
      ? "09:00"
      : serviceLabel === "Domingo Noite"
        ? "19:00"
        : "19:30";

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${hour}`;
}

function matchClassId(label: string, classes: ClassRoom[]) {
  const normalizedLabel = normalizeName(label);
  const match = classes.find((classRoom) => {
    const normalizedClass = normalizeName(classRoom.name);
    return normalizedLabel.includes(normalizedClass) || normalizedClass.includes(normalizedLabel);
  });

  if (match) return match.id;
  if (/2.*3/.test(normalizedLabel)) return "class-2-3";
  if (/4.*5/.test(normalizedLabel)) return "class-4-5";
  if (/6.*9/.test(normalizedLabel)) return "class-6-9";
  return "";
}

function splitWorkerNames(value: string) {
  return value
    .replace(/\*/g, "")
    .replace(/\s+\/\s+/g, "/")
    .split("/")
    .flatMap((part) => part.split(/\s+\be\b\s+/i))
    .map((part) =>
      part
        .replace(/\b(di[aá]cono|diaconisa|lider|l[ií]der|dona)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

function inferScheduleRole({
  isCoordination,
  isSnackOrCleaning,
  label,
  index,
}: {
  isCoordination: boolean;
  isSnackOrCleaning: boolean;
  label: string;
  index: number;
}): ScheduleRole {
  if (isCoordination) return "coordinator";
  if (isSnackOrCleaning && label.includes("limpeza")) return "cleaning";
  if (isSnackOrCleaning) return "snack";
  return index === 0 ? "minister" : "support";
}
