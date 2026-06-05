import { RedeKidsApp } from "@/features/rede-kids/rede-kids-app";
import type { ModuleId } from "@/features/rede-kids/types";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getAppData } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ module?: string | string[] }>;
}) {
  let data = null;
  let message = "";
  const params = searchParams ? await searchParams : {};
  const initialModule = parseModuleId(params.module);

  const redirectedModulePath = moduleRedirects[initialModule];

  if (redirectedModulePath) {
    redirect(redirectedModulePath);
  }

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
      key={initialModule}
      initialData={data}
      loadedAt={new Date().toISOString()}
      initialModule={initialModule}
      currentUser={currentUser}
      showStatus={false}
    />
  );
}

const moduleRedirects: Partial<Record<ModuleId, string>> = {
  lessons: "/aulas",
  members: "/membros",
  progress: "/progresso",
  workers: "/trabalhadores",
  classes: "/turmas",
  inventory: "/estoque",
  schedule: "/escala",
  reports: "/relatorios",
  categories: "/categorias",
  users: "/usuarios",
};

function parseModuleId(value: string | string[] | undefined): ModuleId {
  const moduleId = Array.isArray(value) ? value[0] : value;

  if (
    moduleId === "members" ||
    moduleId === "lessons" ||
    moduleId === "progress" ||
    moduleId === "workers" ||
    moduleId === "classes" ||
    moduleId === "inventory" ||
    moduleId === "schedule" ||
    moduleId === "reports" ||
    moduleId === "categories" ||
    moduleId === "users"
  ) {
    return moduleId;
  }

  return "dashboard";
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
