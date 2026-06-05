"use client";

import Link from "next/link";
import { ArrowLeft, Download, Edit2, RefreshCw, Share2, Trash2 } from "lucide-react";
import type { Lesson } from "@/lib/types";

export function LessonDetailHeader({
  lesson,
  isPending,
  isDownloadingPdf,
  isClosed,
  onDownloadPdf,
  onShare,
  onFinalize,
  onReopen,
  onEdit,
  onDelete,
}: {
  lesson: Lesson;
  isPending: boolean;
  isDownloadingPdf: boolean;
  isClosed: boolean;
  onDownloadPdf: () => void;
  onShare: () => void;
  onFinalize: () => void;
  onReopen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <Link
          href="/aulas"
          className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold leading-none text-zinc-900 shadow-sm hover:bg-zinc-50"
        >
          <ArrowLeft size={16} className="shrink-0" aria-hidden="true" />
          <span>Voltar para aulas</span>
        </Link>
        <h1 className="mt-3 max-w-4xl text-3xl font-normal leading-tight text-zinc-950 lg:text-4xl">
          {lesson.theme}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          {lesson.className || "Sem turma"} · {lesson.id}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
        >
          <Download size={16} aria-hidden="true" />
          {isDownloadingPdf ? "Gerando PDF..." : "Baixar PDF"}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          <Share2 size={16} aria-hidden="true" />
          Compartilhar
        </button>
        {!isClosed && (
          <button
            type="button"
            onClick={onEdit}
            disabled={isPending}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
          >
            <Edit2 size={16} aria-hidden="true" />
            Editar
          </button>
        )}
        {isClosed ? (
          <button
            type="button"
            onClick={onReopen}
            disabled={isPending}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Reabrir
          </button>
        ) : (
          <button
            type="button"
            onClick={onFinalize}
            disabled={isPending}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            Finalizar
          </button>
        )}
        {!isClosed && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
          >
            <Trash2 size={16} aria-hidden="true" />
            Excluir aula
          </button>
        )}
      </div>
    </section>
  );
}
