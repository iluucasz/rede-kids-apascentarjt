"use client";

import Image from "next/image";
import { useActionState } from "react";
import { InputField } from "@/components/ui";
import { loginUserAction, type AuthFormState } from "./actions";

const initialState: AuthFormState = {
  error: "",
};

export function LoginScreen() {
  const [state, formAction, pending] = useActionState(loginUserAction, initialState);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f3] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm">
            <Image
              src="/logo-apascentar.png"
              alt="Logo Ministério Apascentar"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-700">Ministério Apascentar</p>
            <h1 className="text-2xl font-bold text-zinc-950">Rede Kids Jardim Tropical</h1>
            <p className="text-sm text-zinc-500">Acesso restrito a usuários autenticados.</p>
          </div>
        </div>

        <form action={formAction} className="mt-8 grid gap-4 border-t border-zinc-200 pt-6">
          <InputField name="email" label="E-mail" type="email" required />
          <InputField
            name="password"
            label="Senha"
            type="password"
            minLength={6}
            required
          />

          {state.error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}