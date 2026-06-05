import type { FormEvent } from "react";
import type { AppData } from "@/lib/types";

export type ModuleId =
  | "dashboard"
  | "lessons"
  | "members"
  | "progress"
  | "workers"
  | "classes"
  | "inventory"
  | "schedule"
  | "reports"
  | "categories"
  | "users";

export type ActionFn = (formData: FormData) => Promise<AppData>;

export type SubmitHandler = (
  action: ActionFn,
  resetForm?: boolean,
) => (event: FormEvent<HTMLFormElement>) => void;

export type RunAction = (
  action: ActionFn,
  formData: FormData,
  successMessage: string,
  afterSuccess?: () => void,
) => void;
