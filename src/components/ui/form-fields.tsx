import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { Plus, RefreshCw } from "lucide-react";

export function InputField({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`grid gap-1 text-sm font-semibold text-zinc-700 ${className}`}>
      {label}
      <input
        {...props}
        className="h-10 rounded-lg border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-emerald-600"
      />
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-zinc-700">
      {label}
      <select
        {...props}
        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-normal outline-none focus:border-emerald-600"
      >
        {children}
      </select>
    </label>
  );
}

export function TextareaField({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-zinc-700">
      {label}
      <textarea
        {...props}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal outline-none focus:border-emerald-600"
      />
    </label>
  );
}

export function SubmitButton({
  label,
  pending,
}: {
  label: string;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
    >
      {pending ? (
        <RefreshCw size={17} aria-hidden="true" />
      ) : (
        <Plus size={17} aria-hidden="true" />
      )}
      {pending ? "Salvando..." : label}
    </button>
  );
}
