"use client";

import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CloudUpload,
  ExternalLink,
  FileImage,
  FileText,
  Paperclip,
  Trash2,
} from "lucide-react";
import { EmptyState, Heading } from "@/components/ui";
import type { AppData, LessonAttachment } from "@/lib/types";

const attachmentLabels: Record<LessonAttachment["kind"], string> = {
  image: "Foto",
  pdf: "PDF",
  link: "Link",
  other: "Arquivo",
};

export function LessonAttachmentsCard({
  attachments,
  isClosed,
  isPending,
  onUpload,
  onDelete,
}: {
  attachments: AppData["lessonAttachments"];
  isClosed: boolean;
  isPending: boolean;
  onUpload: (files: File[]) => void;
  onDelete: (attachmentId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function uploadFiles(fileList: FileList | null) {
    if (!fileList || isClosed || isPending) return;

    onUpload(Array.from(fileList));

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Heading
          title="Anexos da aula"
          subtitle={`${attachments.length} arquivo(s)`}
        />
        {!isClosed && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-zinc-900 px-3 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            <CloudUpload size={16} aria-hidden="true" />
            Adicionar Anexo
          </button>
        )}
      </div>

      {!isClosed && (
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => uploadFiles(event.currentTarget.files)}
        />
      )}

      {!isClosed && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!isPending) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            uploadFiles(event.dataTransfer.files);
          }}
          className={`mt-4 rounded-lg border border-dashed px-4 py-7 text-center transition ${
            isDragging
              ? "border-emerald-400 bg-emerald-50"
              : "border-zinc-300 bg-zinc-50"
          }`}
        >
          <CloudUpload
            size={28}
            className="mx-auto text-zinc-500"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm font-semibold text-zinc-800">
            Arraste arquivos aqui
          </p>
          <p className="text-xs font-medium text-zinc-500">
            Fotos, PDFs e outros anexos ficam ligados a esta aula.
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-3">
        {attachments.length ? (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="rounded-lg border border-zinc-200 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  download={attachment.name}
                  className="flex min-w-0 flex-1 items-start gap-3 rounded-md hover:text-emerald-800"
                >
                  <AttachmentIcon
                    kind={attachment.kind}
                    className="mt-0.5 shrink-0 text-zinc-500"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-950">
                      {attachment.name}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {attachmentLabels[attachment.kind]}
                    </p>
                  </div>
                  <ExternalLink
                    size={15}
                    className="mt-0.5 shrink-0 text-zinc-400"
                    aria-hidden="true"
                  />
                </a>
                {!isClosed && (
                  <button
                    type="button"
                    onClick={() => onDelete(attachment.id)}
                    disabled={isPending}
                    aria-label={`Excluir ${attachment.name}`}
                    className="grid size-9 shrink-0 place-items-center rounded-md text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <EmptyState text="Nenhum anexo cadastrado para esta aula." />
        )}
      </div>
    </section>
  );
}

function AttachmentIcon({
  kind,
  className,
}: {
  kind: LessonAttachment["kind"];
  className?: string;
}) {
  const icons: Record<LessonAttachment["kind"], LucideIcon> = {
    image: FileImage,
    pdf: FileText,
    link: Paperclip,
    other: Paperclip,
  };
  const Icon = icons[kind];

  return <Icon size={18} className={className} aria-hidden="true" />;
}
