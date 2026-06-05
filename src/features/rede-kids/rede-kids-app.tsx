"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppData, AppUser } from "@/lib/types";
import {
  CategoriesModule,
  ClassesModule,
  Dashboard,
  InventoryModule,
  MembersModule,
  ProgressModule,
  ReportsModule,
  ScheduleModule,
  UsersModule,
  WorkersModule,
} from "./modules";
import { moduleRoutes, RedeKidsShell } from "./shell";
import type { ActionFn, ModuleId } from "./types";

export function RedeKidsApp({
  initialData,
  loadedAt,
  initialModule = "dashboard",
  currentUser,
  showStatus = true,
}: {
  initialData: AppData;
  loadedAt: string;
  initialModule?: ModuleId;
  currentUser: AppUser;
  showStatus?: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const activeModule = initialModule;
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("Pronto para gerenciar a Rede Kids.");
  const [isPending, startTransition] = useTransition();

  const children = useMemo(
    () => data.members.filter((member) => member.kind === "child"),
    [data.members],
  );

  const guardians = useMemo(
    () => data.members.filter((member) => member.kind === "guardian"),
    [data.members],
  );

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    if (!normalizedSearch) return data.members;

    return data.members.filter((member) =>
      [
        member.fullName,
        member.phone,
        member.className,
        member.guardianNames.join(" "),
        member.childNames.join(" "),
        member.categoryNames.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [data.members, search]);

  const progressAlerts = data.progress.filter((item) => item.status !== "ok");
  const lowStock = data.inventory.filter(
    (item) => item.quantity <= item.minQuantity,
  );

  function runAction(
    action: ActionFn,
    formData: FormData,
    successMessage: string,
    afterSuccess?: () => void,
  ) {
    startTransition(async () => {
      try {
        const nextData = await action(formData);
        setData(nextData);
        setMessage(successMessage);
        afterSuccess?.();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Não foi possível salvar.",
        );
      }
    });
  }

  function openModule(moduleId: ModuleId) {
    router.push(moduleRoutes[moduleId]);
  }

  return (
    <RedeKidsShell
      activeModule={activeModule}
      currentUser={currentUser}
      search={search}
      onSearchChange={setSearch}
      isPending={isPending}
      message={message}
      showStatus={showStatus}
    >
          {activeModule === "dashboard" && (
            <Dashboard
              data={data}
              childrenCount={children.length}
              guardiansCount={guardians.length}
              progressAlerts={progressAlerts}
              lowStockCount={lowStock.length}
              loadedAt={loadedAt}
              setActiveModule={openModule}
            />
          )}

          {activeModule === "members" && (
            <MembersModule
              data={data}
              filteredMembers={filteredMembers}
              runAction={runAction}
              isPending={isPending}
            />
          )}

          {activeModule === "progress" && (
            <ProgressModule
              data={data}
              runAction={runAction}
              isPending={isPending}
            />
          )}

          {activeModule === "workers" && (
            <WorkersModule data={data} runAction={runAction} isPending={isPending} />
          )}

          {activeModule === "classes" && (
            <ClassesModule data={data} runAction={runAction} isPending={isPending} />
          )}

          {activeModule === "inventory" && (
            <InventoryModule data={data} runAction={runAction} isPending={isPending} />
          )}

          {activeModule === "schedule" && <ScheduleModule data={data} />}

          {activeModule === "reports" && (
            <ReportsModule data={data} childMembers={children} />
          )}

          {activeModule === "categories" && (
            <CategoriesModule data={data} runAction={runAction} isPending={isPending} />
          )}

          {activeModule === "users" && (
            <UsersModule data={data} runAction={runAction} isPending={isPending} />
          )}
    </RedeKidsShell>
  );
}
