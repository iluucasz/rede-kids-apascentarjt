"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { InputField, Modal, SubmitButton, TextareaField } from "@/components/ui";
import type { Lesson } from "@/lib/types";
import {
  LESSON_NOTE_PRESETS,
  findMatchingLessonNotePreset,
} from "./lesson-note-presets";

const OTHER_NOTE_OPTION = "__other__";

export function CloseLessonModal({
  lesson,
  open,
  pending,
  onClose,
  onSubmit,
}: {
  lesson: Lesson;
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal title="Finalizar aula" open={open} onClose={onClose}>
      <CloseLessonForm
        key={`${lesson.id}-${lesson.notes}`}
        lesson={lesson}
        pending={pending}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}

function CloseLessonForm({
  lesson,
  pending,
  onSubmit,
}: {
  lesson: Lesson;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const initialNotes = lesson.notes ?? "";
  const initialNoteOption = useMemo(
    () => getInitialNoteOption(initialNotes),
    [initialNotes],
  );
  const [notes, setNotes] = useState(initialNotes);
  const [selectedNoteOption, setSelectedNoteOption] = useState<string | null>(
    initialNoteOption,
  );
  const isOtherSelected = selectedNoteOption === OTHER_NOTE_OPTION;

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <input type="hidden" name="lessonId" value={lesson.id} />
      <input type="hidden" name="notes" value={notes} />
      <InputField
        name="offering"
        label="Valor da oferta"
        inputMode="decimal"
        placeholder="0,00"
        defaultValue={formatOffering(lesson.offeringCents)}
        required
      />
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Observação
        </p>
        <div className="grid gap-2">
          {LESSON_NOTE_PRESETS.map((note) => (
            <button
              key={note.text}
              type="button"
              onClick={() => {
                setSelectedNoteOption(note.text);
                setNotes(note.text);
              }}
              className={`rounded-2xl border px-3 py-2.5 text-left text-xs font-semibold transition ${note.buttonClassName} ${
                selectedNoteOption === note.text
                  ? "ring-2 ring-current ring-offset-1"
                  : "opacity-80"
              }`}
            >
              {note.text}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setSelectedNoteOption(OTHER_NOTE_OPTION);
              setNotes("");
            }}
            className={`rounded-2xl border border-zinc-300 bg-white px-3 py-2.5 text-left text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 ${
              isOtherSelected ? "ring-2 ring-zinc-300 ring-offset-1" : "opacity-80"
            }`}
          >
            Outros
          </button>
        </div>
      </div>
      {isOtherSelected ? (
        <TextareaField
          label="Observação"
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      ) : null}
      <SubmitButton label="Finalizar aula" pending={pending} />
    </form>
  );
}

function getInitialNoteOption(initialNotes: string) {
  const trimmedNotes = initialNotes.trim();

  if (!trimmedNotes) return null;

  const matchingPreset = findMatchingLessonNotePreset(initialNotes);

  return matchingPreset && trimmedNotes === matchingPreset.text
    ? matchingPreset.text
    : OTHER_NOTE_OPTION;
}

function formatOffering(value: number) {
  if (!value) return "";

  return (value / 100).toFixed(2).replace(".", ",");
}
