"use client";

import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  closeLesson,
  createLessonAttachments,
  deleteLesson,
  deleteLessonAttachment,
  reopenLesson,
  saveAttendance,
  saveBulkAttendance,
  updateLesson,
} from "@/app/actions";
import { ConfirmModal, EmptyState } from "@/components/ui";
import type { AppData, AppUser, AttendanceStatus } from "@/lib/types";
import { RedeKidsShell } from "../../shell";
import {
  AttendanceList,
  CloseLessonModal,
  LessonAttachmentsCard,
  LessonDetailHeader,
  LessonFormModal,
  LessonInfoCard,
  LessonStats,
} from "./components";
import { shareLessonLink } from "./share-lesson-link";
import { buildLessonReport, downloadLessonPdf } from "./utils";

export function LessonDetailPage({
  initialData,
  lessonId,
  currentUser,
}: {
  initialData: AppData;
  lessonId: string;
  currentUser: AppUser;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteLessonModalOpen, setIsDeleteLessonModalOpen] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(
    null,
  );
  const [message, setMessage] = useState("Aula carregada.");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPending, startTransition] = useTransition();

  const lesson = data.lessons.find((item) => item.id === lessonId);
  const isClosed = lesson?.status === "closed";

  const allClassChildren = useMemo(() => {
    if (!lesson) return [];

    return data.members.filter(
      (member) =>
        member.kind === "child" &&
        (!lesson.classId || member.classId === lesson.classId),
    );
  }, [data.members, lesson]);

  const classChildren = useMemo(() => {
    const normalizedSearch = memberSearch.toLowerCase().trim();

    if (!normalizedSearch) return allClassChildren;

    return allClassChildren.filter((child) =>
      [
        child.fullName,
        child.guardianNames.join(" "),
        child.phone,
        child.categoryNames.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [allClassChildren, memberSearch]);

  const lessonAttendance = data.attendance.filter(
    (attendance) => attendance.lessonId === lessonId,
  );
  const lessonAttachments = data.lessonAttachments.filter(
    (attachment) => attachment.lessonId === lessonId,
  );
  const deletingAttachment = lessonAttachments.find(
    (attachment) => attachment.id === deletingAttachmentId,
  );
  const attendanceReport = useMemo(
    () => buildLessonReport(allClassChildren, lessonAttendance),
    [allClassChildren, lessonAttendance],
  );

  function runAction(
    action: (formData: FormData) => Promise<AppData>,
    formData: FormData,
    successMessage: string,
    afterSuccess?: () => void,
  ) {
    startTransition(async () => {
      try {
        const nextData = await action(formData);
        setData(nextData);
        setMessage(successMessage);
        afterSuccess?.();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Não foi possível salvar.",
        );
      }
    });
  }

  function submitCloseLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    runAction(closeLesson, formData, "Aula finalizada.", () =>
      setIsCloseModalOpen(false),
    );
  }

  function submitEditLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    runAction(updateLesson, formData, "Aula atualizada.", () =>
      setIsEditModalOpen(false),
    );
  }

  function confirmDeleteLesson() {
    const formData = new FormData();
    formData.set("lessonId", lessonId);

    runAction(deleteLesson, formData, "Aula excluída.", () => {
      setIsDeleteLessonModalOpen(false);
      router.push("/aulas");
    });
  }

  function reopenCurrentLesson() {
    const formData = new FormData();
    formData.set("lessonId", lessonId);
    runAction(reopenLesson, formData, "Aula reaberta.");
  }

  async function handleDownloadPdf() {
    if (!lesson) return;

    setIsDownloadingPdf(true);

    try {
      await downloadLessonPdf({ lesson, report: attendanceReport });
      setMessage("PDF da aula baixado.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível gerar o PDF.",
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  async function handleShareLesson() {
    if (!lesson) return;

    try {
      const nextMessage = await shareLessonLink({
        lessonId: lesson.id,
        lessonTheme: lesson.theme,
      });
      setMessage(nextMessage);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível compartilhar a aula.",
      );
    }
  }

  function markChildStatus(
    childId: string,
    status: AttendanceStatus,
    note = "",
  ) {
    const formData = new FormData();
    formData.set("lessonId", lessonId);
    formData.set("childId", childId);
    formData.set("status", status);
    formData.set("note", status === "justified" ? note : "");
    runAction(saveAttendance, formData, "Presença salva.");
  }

  function markSelected(status: AttendanceStatus, note = "") {
    const formData = new FormData();
    formData.set("lessonId", lessonId);
    formData.set("status", status);
    formData.set("note", status === "justified" ? note : "");

    for (const childId of selectedIds) {
      formData.append("childIds", childId);
    }

    runAction(saveBulkAttendance, formData, "Chamada atualizada.", () =>
      setSelectedIds(new Set()),
    );
  }

  function uploadAttachments(files: File[]) {
    const uploadFiles = files.filter((file) => file.size > 0);

    if (!uploadFiles.length) return;

    const formData = new FormData();
    formData.set("lessonId", lessonId);

    for (const file of uploadFiles) {
      formData.append("files", file);
    }

    runAction(
      createLessonAttachments,
      formData,
      uploadFiles.length > 1 ? "Anexos salvos." : "Anexo salvo.",
    );
  }

  function confirmDeleteAttachment() {
    if (!deletingAttachmentId) return;

    const formData = new FormData();
    formData.set("lessonId", lessonId);
    formData.set("attachmentId", deletingAttachmentId);

    runAction(deleteLessonAttachment, formData, "Anexo excluído.", () =>
      setDeletingAttachmentId(null),
    );
  }

  function toggleChild(childId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(childId)) {
        next.delete(childId);
      } else {
        next.add(childId);
      }

      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const visibleIds = classChildren.map((child) => child.id);
      const allVisibleSelected =
        visibleIds.length > 0 && visibleIds.every((id) => current.has(id));
      const next = new Set(current);

      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }

      return next;
    });
  }

  if (!lesson) {
    return (
      <RedeKidsShell
        activeModule="lessons"
        currentUser={currentUser}
        search=""
        onSearchChange={() => undefined}
        isPending={isPending}
        message={message}
        showSearch={false}
        showStatus={false}
        headerTitle="Aula"
        headerSubtitle="Detalhes, chamada, finalização e anexos da aula."
      >
        <EmptyState text="Aula não encontrada." />
      </RedeKidsShell>
    );
  }

  return (
    <RedeKidsShell
      activeModule="lessons"
      currentUser={currentUser}
      search=""
      onSearchChange={() => undefined}
      isPending={isPending}
      message={message}
      showSearch={false}
      showStatus={false}
      headerTitle="Aula"
      headerSubtitle="Detalhes, chamada, finalização e anexos da aula."
    >
      <div className="space-y-5">
        <LessonDetailHeader
          lesson={lesson}
          isPending={isPending}
          isDownloadingPdf={isDownloadingPdf}
          isClosed={Boolean(isClosed)}
          onDownloadPdf={handleDownloadPdf}
          onShare={() => {
            void handleShareLesson();
          }}
          onFinalize={() => setIsCloseModalOpen(true)}
          onReopen={reopenCurrentLesson}
          onEdit={() => setIsEditModalOpen(true)}
          onDelete={() => setIsDeleteLessonModalOpen(true)}
        />

        <LessonInfoCard lesson={lesson} />
        <LessonStats report={attendanceReport} />

        <AttendanceList
          members={classChildren}
          attendance={lessonAttendance}
          selectedIds={selectedIds}
          isClosed={Boolean(isClosed)}
          isPending={isPending}
          search={memberSearch}
          onSearchChange={setMemberSearch}
          onToggleChild={toggleChild}
          onToggleAll={toggleAllVisible}
          onClearSelection={() => setSelectedIds(new Set())}
          onBulkStatus={markSelected}
          onChildStatus={markChildStatus}
        />

        <LessonAttachmentsCard
          attachments={lessonAttachments}
          isClosed={Boolean(isClosed)}
          isPending={isPending}
          onUpload={uploadAttachments}
          onDelete={setDeletingAttachmentId}
        />
      </div>

      <LessonFormModal
        data={data}
        lesson={lesson}
        open={isEditModalOpen}
        pending={isPending}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={submitEditLesson}
      />
      <CloseLessonModal
        lesson={lesson}
        open={isCloseModalOpen}
        pending={isPending}
        onClose={() => setIsCloseModalOpen(false)}
        onSubmit={submitCloseLesson}
      />
      <ConfirmModal
        title="Excluir aula"
        description="Essa ação exclui a aula, chamadas registradas e anexos vinculados. Depois de confirmar, não será possível recuperar por esta tela."
        confirmLabel="Excluir aula"
        open={isDeleteLessonModalOpen}
        pending={isPending}
        destructive
        onClose={() => setIsDeleteLessonModalOpen(false)}
        onConfirm={confirmDeleteLesson}
      />
      <ConfirmModal
        title="Excluir anexo"
        description={`O anexo "${deletingAttachment?.name ?? "selecionado"}" será removido desta aula.`}
        confirmLabel="Excluir anexo"
        open={Boolean(deletingAttachmentId)}
        pending={isPending}
        destructive
        onClose={() => setDeletingAttachmentId(null)}
        onConfirm={confirmDeleteAttachment}
      />
    </RedeKidsShell>
  );
}
