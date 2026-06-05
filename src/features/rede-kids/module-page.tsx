import { RedeKidsApp } from "./rede-kids-app";
import type { ModuleId } from "./types";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getAppData } from "@/lib/db";

export async function RedeKidsModulePage({ moduleId }: { moduleId: ModuleId }) {
  let data = null;
  let message = "";
  const currentUser = await requireAuthenticatedUser();

  try {
    data = await getAppData();
  } catch (error) {
    message =
      error instanceof Error
        ? error.message
        : "Não foi possível carregar os dados.";
  }

  if (!data) {
    return <DatabaseError message={message} />;
  }

  return (
    <RedeKidsApp
      initialData={data}
      loadedAt={new Date().toISOString()}
      initialModule={moduleId}
      currentUser={currentUser}
      showStatus={false}
    />
  );
}

function DatabaseError({ message }: { message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f3] p-6">
      <section className="max-w-xl rounded-lg border border-rose-200 bg-white p-6">
        <p className="text-sm font-semibold text-rose-700">Banco de dados</p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-950">
          Não foi possível iniciar o aplicativo
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-700">{message}</p>
      </section>
    </main>
  );
}
