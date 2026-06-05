import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  createSessionToken,
  parseSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  verifyPassword,
} from "./auth/crypto";
import { findAppUserById, findAuthUserByEmail } from "./db";
import type { AppUser } from "./types";

export async function createUserSession(user: Pick<AppUser, "id" | "role">) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const sessionToken = createSessionToken({
    userId: user.id,
    role: user.role,
    exp: expiresAt.getTime(),
  });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export const getOptionalAuthenticatedUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionToken(token);

  if (!session) {
    return null;
  }

  const user = await findAppUserById(session.userId);

  if (!user) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return user;
});

export const requireAuthenticatedUser = cache(async () => {
  const user = await getOptionalAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});

export async function authenticateUser(email: string, password: string) {
  const user = await findAuthUserByEmail(email);

  if (!user || !user.passwordHash) {
    return null;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return user;
}