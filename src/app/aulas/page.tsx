import { LessonsPage } from "@/features/rede-kids/modules/aulas";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getAppData } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AulasPage() {
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

  return <LessonsPage initialData={data} currentUser={currentUser} />;
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
