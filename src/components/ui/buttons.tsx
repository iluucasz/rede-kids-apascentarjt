import type { LucideIcon } from "lucide-react";

export function IconButton({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 px-3 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-60"
    >
      <Icon size={17} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export function QuickLink({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left font-semibold text-zinc-900 hover:border-emerald-300 hover:bg-emerald-50"
    >
      <span>{label}</span>
      <Icon size={19} aria-hidden="true" />
    </button>
  );
}
