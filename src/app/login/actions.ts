"use server";

import { redirect } from "next/navigation";
import {
  authenticateUser,
  createUserSession,
  deleteUserSession,
} from "@/lib/auth";
import { hasConfiguredUsers } from "@/lib/db";

export type AuthFormState = {
  error: string;
};

export async function loginUserAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = field(formData, "email");
  const password = field(formData, "password");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  if (!(await hasConfiguredUsers())) {
    return {
      error: "Nenhum acesso foi configurado ainda. Peça ao administrador para criar seu usuário.",
    };
  }

  const user = await authenticateUser(email, password);

  if (!user) {
    return { error: "E-mail ou senha inválidos." };
  }

  await createUserSession(user);
  redirect("/");
}

export async function logoutUserAction() {
  await deleteUserSession();
  redirect("/login");
}

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}