"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Header, PageContainer, Sidebar } from "@/components/layout";
import type { AppUser } from "@/lib/types";
import type { ModuleId } from "./types";
import { moduleHeaders, modules } from "./config";

export const moduleRoutes: Record<ModuleId, string> = {
  dashboard: "/",
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

export function RedeKidsShell({
  activeModule,
  currentUser,
  search,
  onSearchChange,
  isPending,
  message,
  searchPlaceholder,
  showSearch = false,
  showStatus,
  headerTitle,
  headerSubtitle,
  children,
}: {
  activeModule: ModuleId;
  currentUser: AppUser;
  search: string;
  onSearchChange: (value: string) => void;
  isPending: boolean;
  message: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showStatus?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const header = moduleHeaders[activeModule];

  function navigate(moduleId: ModuleId) {
    router.push(moduleRoutes[moduleId]);
  }

  return (
    <div className="min-h-screen bg-[#f6f7f3] text-zinc-950">
      <Sidebar
        items={modules}
        activeItem={activeModule}
        currentUser={currentUser}
        onItemChange={navigate}
      />

      <div className="lg:pl-72">
        <Header
          items={modules}
          activeItem={activeModule}
          currentUser={currentUser}
          title={headerTitle ?? header.title}
          subtitle={headerSubtitle ?? header.subtitle}
          search={search}
          onSearchChange={onSearchChange}
          onItemChange={navigate}
          searchPlaceholder={searchPlaceholder}
          showSearch={showSearch}
        />

        <PageContainer
          message={message}
          isPending={isPending}
          showStatus={showStatus}
        >
          {children}
        </PageContainer>
      </div>
    </div>
  );
}
