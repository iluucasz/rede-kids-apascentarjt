"use client";

import { useState } from "react";
import { AlertCircle, Check, Search, X } from "lucide-react";
import { Modal } from "@/components/ui";
import type { AppData, AttendanceStatus, Member } from "@/lib/types";
import { getInitials } from "../utils";

type JustificationTarget =
  | {
      mode: "single";
      childId: string;
      childName: string;
    }
  | {
      mode: "bulk";
      selectedCount: number;
    };

export function AttendanceList({
  members,
  attendance,
  selectedIds,
  isClosed,
  isPending,
  search,
  onSearchChange,
  onToggleChild,
  onToggleAll,
  onClearSelection,
  onBulkStatus,
  onChildStatus,
}: {
  members: Member[];
  attendance: AppData["attendance"];
  selectedIds: Set<string>;
  isClosed: boolean;
  isPending: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onToggleChild: (childId: string) => void;
  onToggleAll: () => void;
  onClearSelection: () => void;
  onBulkStatus: (status: AttendanceStatus, note?: string) => void;
  onChildStatus: (childId: string, status: AttendanceStatus, note?: string) => void;
}) {
  const allSelected = members.length > 0 && selectedIds.size === members.length;
  const [justificationTarget, setJustificationTarget] =
    useState<JustificationTarget | null>(null);
  const [justificationNote, setJustificationNote] = useState("");

  function closeJustificationModal() {
    setJustificationTarget(null);
    setJustificationNote("");
  }

  function openBulkJustificationModal() {
    if (!selectedIds.size) return;

    setJustificationTarget({
      mode: "bulk",
      selectedCount: selectedIds.size,
    });
    setJustificationNote("");
  }

  function openSingleJustificationModal(child: Member, note: string) {
    setJustificationTarget({
      mode: "single",
      childId: child.id,
      childName: child.fullName,
    });
    setJustificationNote(note);
  }

  function confirmJustification() {
    const nextNote = justificationNote.trim();

    if (!justificationTarget || !nextNote) {
      return;
    }

    if (justificationTarget.mode === "single") {
      onChildStatus(justificationTarget.childId, "justified", nextNote);
    } else {
      onBulkStatus("justified", nextNote);
    }

    closeJustificationModal();
  }

  return (
    <>
      <section className="space-y-2">
        <div className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 shadow-sm">
          <Search size={18} className="text-zinc-500" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar membro..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm md:flex-row md:items-center md:justify-between">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleAll}
              className="size-4 rounded border-zinc-300 accent-emerald-700"
            />
            <span className="font-semibold text-zinc-950">Selecionar todos</span>
            <span className="text-zinc-500">{members.length} listados</span>
          </label>

          <div className="flex flex-wrap gap-2">
            <BulkButton
              label="Dar presença"
              status="present"
              disabled={isClosed || isPending || selectedIds.size === 0}
              onClick={() => onBulkStatus("present")}
            />
            <BulkButton
              label="Dar falta"
              status="absent"
              disabled={isClosed || isPending || selectedIds.size === 0}
              onClick={() => onBulkStatus("absent")}
            />
            <BulkButton
              label="Justificar"
              status="justified"
              disabled={isClosed || isPending || selectedIds.size === 0}
              onClick={openBulkJustificationModal}
            />
            <button
              type="button"
              onClick={onClearSelection}
              disabled={selectedIds.size === 0}
              className="h-9 rounded-md px-3 text-sm font-semibold text-zinc-500 hover:bg-zinc-100 disabled:opacity-50"
            >
              Limpar seleção
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          {members.length ? (
            members.map((child) => {
              const record = attendance.find((item) => item.childId === child.id);
              const isSelected = selectedIds.has(child.id);
              const rowToneClass = record
                ? ATTENDANCE_ROW_TONES[record.status]
                : "bg-white";

              return (
                <div
                  key={child.id}
                  className={`grid gap-3 border-b border-zinc-100 px-4 py-3 transition-colors last:border-b-0 md:grid-cols-[auto_auto_1fr_auto] md:items-center ${rowToneClass}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleChild(child.id)}
                    className="size-4 rounded border-zinc-300 accent-emerald-700"
                  />
                  <div className="grid size-10 place-items-center rounded-full bg-zinc-100 text-sm font-semibold text-emerald-900">
                    {getInitials(child.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold uppercase text-zinc-950">
                      {child.fullName}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800">
                        {child.guardianNames.length
                          ? child.guardianNames.join(", ")
                          : "Sem responsável"}
                      </span>
                      {record && <StatusTag status={record.status} />}
                    </div>
                  </div>

                  <div className="flex gap-2 md:justify-end">
                    <StatusButton
                      status="present"
                      active={record?.status === "present"}
                      disabled={isClosed || isPending}
                      onClick={() => onChildStatus(child.id, "present")}
                    />
                    <StatusButton
                      status="absent"
                      active={record?.status === "absent"}
                      disabled={isClosed || isPending}
                      onClick={() => onChildStatus(child.id, "absent")}
                    />
                    <StatusButton
                      status="justified"
                      active={record?.status === "justified"}
                      disabled={isClosed || isPending}
                      onClick={() =>
                        openSingleJustificationModal(
                          child,
                          record?.status === "justified" ? record.note : "",
                        )
                      }
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-sm font-medium text-zinc-500">
              Nenhum membro encontrado.
            </div>
          )}
        </div>
      </section>

      <Modal
        title="Confirmar justificativa"
        open={Boolean(justificationTarget)}
        onClose={closeJustificationModal}
        panelClassName="max-w-lg"
      >
        <div className="grid gap-4">
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              {justificationTarget?.mode === "single"
                ? justificationTarget.childName
                : `${justificationTarget?.selectedCount ?? 0} selecionado(s)`}
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Escreva o motivo da justificativa antes de confirmar a chamada.
            </p>
          </div>

          <label className="grid gap-2 text-sm font-semibold text-zinc-800">
            Motivo da justificativa
            <textarea
              value={justificationNote}
              onChange={(event) => setJustificationNote(event.target.value)}
              placeholder="Ex.: Consulta médica, viagem, compromisso com a família..."
              rows={4}
              autoFocus
              disabled={isPending}
              className="min-h-28 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-normal text-zinc-900 outline-none transition focus:border-amber-300 focus:bg-white"
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
            <button
              type="button"
              onClick={closeJustificationModal}
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmJustification}
              disabled={isPending || !justificationNote.trim()}
              className="inline-flex h-10 items-center justify-center rounded-md bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Confirmar justificativa
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function BulkButton({
  label,
  status,
  disabled,
  onClick,
}: {
  label: string;
  status: AttendanceStatus;
  disabled: boolean;
  onClick: () => void;
}) {
  const classes = {
    present: "border-emerald-200 text-emerald-800 hover:bg-emerald-50",
    absent: "border-rose-200 text-rose-700 hover:bg-rose-50",
    justified: "border-amber-200 text-amber-700 hover:bg-amber-50",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-sm font-semibold disabled:opacity-50 ${classes[status]}`}
    >
      {status === "present" && <Check size={15} aria-hidden="true" />}
      {status === "absent" && <X size={15} aria-hidden="true" />}
      {status === "justified" && <AlertCircle size={15} aria-hidden="true" />}
      {label}
    </button>
  );
}

function StatusButton({
  status,
  active,
  disabled,
  onClick,
}: {
  status: AttendanceStatus;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const classes = {
    present: active
      ? "border-emerald-300 bg-emerald-100 text-emerald-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-800",
    absent: active
      ? "border-rose-300 bg-rose-100 text-rose-800"
      : "border-rose-200 bg-rose-50 text-rose-700",
    justified: active
      ? "border-amber-300 bg-amber-100 text-amber-800"
      : "border-amber-200 bg-amber-50 text-amber-700",
  };
  const labels = {
    present: "P",
    absent: "F",
    justified: "J",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 min-w-11 items-center justify-center gap-1 rounded-md border px-2 text-sm font-bold disabled:opacity-50 ${classes[status]}`}
    >
      {status === "present" && <Check size={15} aria-hidden="true" />}
      {status === "absent" && <X size={15} aria-hidden="true" />}
      {status === "justified" && <AlertCircle size={15} aria-hidden="true" />}
      {labels[status]}
    </button>
  );
}

function StatusTag({ status }: { status: AttendanceStatus }) {
  const classes = {
    present: "bg-emerald-50 text-emerald-800",
    absent: "bg-rose-50 text-rose-700",
    justified: "bg-amber-50 text-amber-700",
  };
  const labels = {
    present: "Presença",
    absent: "Falta",
    justified: "Justificada",
  };

  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}

const ATTENDANCE_ROW_TONES: Record<AttendanceStatus, string> = {
  present: "bg-emerald-50/70",
  absent: "bg-rose-50/70",
  justified: "bg-amber-50/75",
};
