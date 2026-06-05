"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "./modal";

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  open,
  pending,
  destructive = false,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  open: boolean;
  pending: boolean;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} open={open} onClose={onClose}>
      <div className="grid gap-5">
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium leading-6">{description}</p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-bold text-white disabled:opacity-60 ${
              destructive
                ? "bg-rose-700 hover:bg-rose-800"
                : "bg-emerald-700 hover:bg-emerald-800"
            }`}
          >
            {pending ? "Aguarde..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
