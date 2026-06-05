"use client";

import type { FormEvent } from "react";
import { useRef } from "react";
import { CalendarDays } from "lucide-react";
import {
  InputField,
  Modal,
  SelectField,
  SubmitButton,
} from "@/components/ui";
import type { AppData, Lesson } from "@/lib/types";
import { ScriptureReferenceField } from "./scripture-reference-field";

export function LessonFormModal({
  data,
  lesson,
  open,
  pending,
  onClose,
  onSubmit,
}: {
  data: AppData;
  lesson?: Lesson;
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isEditing = Boolean(lesson);

  return (
    <Modal title={isEditing ? "Editar aula" : "Criar aula"} open={open} onClose={onClose}>
      <form className="grid gap-4" onSubmit={onSubmit}>
        {lesson && <input type="hidden" name="lessonId" value={lesson.id} />}
        <SelectField
          name="classId"
          label="Turma"
          required
          defaultValue={lesson?.classId ?? ""}
        >
          <option value="">Selecione</option>
          {data.classes.map((classRoom) => (
            <option key={classRoom.id} value={classRoom.id}>
              {classRoom.name}
            </option>
          ))}
        </SelectField>
        <DateTimeField
          name="scheduledAt"
          label="Data e horário"
          required
          defaultValue={lesson ? toDateTimeInputValue(lesson.scheduledAt) : ""}
        />
        <InputField
          name="theme"
          label="Tema"
          defaultValue={lesson?.theme ?? ""}
          required
        />
        <ScriptureReferenceField
          name="scriptureText"
          label="Textos bíblicos"
          defaultValue={lesson?.scriptureText ?? ""}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            name="ministerId"
            label="Ministro"
            defaultValue={lesson?.ministerId ?? ""}
          >
            <option value="">Selecione</option>
            {data.workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.fullName}
              </option>
            ))}
          </SelectField>
          <SelectField
            name="supportId"
            label="Apoio"
            defaultValue={lesson?.supportId ?? ""}
          >
            <option value="">Selecione</option>
            {data.workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.fullName}
              </option>
            ))}
          </SelectField>
        </div>
        <SubmitButton
          label={isEditing ? "Salvar alterações" : "Criar aula aberta"}
          pending={pending}
        />
      </form>
    </Modal>
  );
}

function DateTimeField({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const input = inputRef.current;

    if (!input) return;

    input.focus();

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch {
        // Focus keeps the field usable when the browser blocks showPicker.
      }
    }
  }

  return (
    <label className={`grid gap-1 text-sm font-semibold text-zinc-700 ${className}`}>
      {label}
      <div
        className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-3 text-sm font-normal focus-within:border-emerald-600"
        onClick={openPicker}
      >
        <CalendarDays size={16} className="text-zinc-500" aria-hidden="true" />
        <input
          {...props}
          ref={inputRef}
          type="datetime-local"
          className="h-full w-full min-w-0 bg-transparent outline-none"
        />
      </div>
    </label>
  );
}

function toDateTimeInputValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}
