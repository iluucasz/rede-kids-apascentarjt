export type LessonNotePreset = {
  text: string;
  buttonClassName: string;
  panelClassName: string;
  labelClassName: string;
  valueClassName: string;
};

export const LESSON_NOTE_PRESETS: LessonNotePreset[] = [
  {
    text: "A aula foi tranquila e as crianças participaram bem de toda a atividade.",
    buttonClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100",
    panelClassName: "border-emerald-200 bg-emerald-50/80",
    labelClassName: "text-emerald-700",
    valueClassName: "text-emerald-950",
  },
  {
    text: "A aula foi animada e a turma interagiu bastante com o conteúdo apresentado.",
    buttonClassName:
      "border-green-200 bg-green-50 text-green-800 hover:border-green-300 hover:bg-green-100",
    panelClassName: "border-green-200 bg-green-50/80",
    labelClassName: "text-green-700",
    valueClassName: "text-green-950",
  },
  {
    text: "A turma esteve agitada em alguns momentos, mas a aula conseguiu seguir bem.",
    buttonClassName:
      "border-lime-200 bg-lime-50 text-lime-800 hover:border-lime-300 hover:bg-lime-100",
    panelClassName: "border-lime-200 bg-lime-50/80",
    labelClassName: "text-lime-700",
    valueClassName: "text-lime-950",
  },
  {
    text: "Foi necessário redirecionar a atenção da turma algumas vezes durante a aula.",
    buttonClassName:
      "border-yellow-200 bg-yellow-50 text-yellow-800 hover:border-yellow-300 hover:bg-yellow-100",
    panelClassName: "border-yellow-200 bg-yellow-50/80",
    labelClassName: "text-yellow-700",
    valueClassName: "text-yellow-950",
  },
  {
    text: "A equipe precisou dar bastante apoio para manter a concentração das crianças.",
    buttonClassName:
      "border-orange-200 bg-orange-50 text-orange-800 hover:border-orange-300 hover:bg-orange-100",
    panelClassName: "border-orange-200 bg-orange-50/80",
    labelClassName: "text-orange-700",
    valueClassName: "text-orange-950",
  },
  {
    text: "Não foi possível aplicar a aula como planejado por causa da agitação da turma.",
    buttonClassName:
      "border-red-200 bg-red-50 text-red-800 hover:border-red-300 hover:bg-red-100",
    panelClassName: "border-red-200 bg-red-50/80",
    labelClassName: "text-red-700",
    valueClassName: "text-red-950",
  },
];

export function findMatchingLessonNotePreset(note: string | null | undefined) {
  const normalizedNote = note?.trim();

  if (!normalizedNote) {
    return null;
  }

  return (
    LESSON_NOTE_PRESETS.find((preset) => normalizedNote.startsWith(preset.text)) ?? null
  );
}