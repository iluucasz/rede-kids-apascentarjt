"use client";

import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useMemo, useState } from "react";
import {
  Baby,
  Edit2,
  Link2,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import { createMember, deleteMember, updateMember } from "@/app/actions";
import { ConfirmModal, EmptyState, Heading, Modal } from "@/components/ui";
import type { AppData, Member } from "@/lib/types";
import type { ActionFn, RunAction } from "../../types";
import { MemberFormModal } from "./components";

type MemberFilter = "all" | "children" | "guardians" | "no-guardian" | "no-class";

const filters: { id: MemberFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "children", label: "Crianças" },
  { id: "guardians", label: "Responsáveis" },
  { id: "no-guardian", label: "Sem responsável" },
  { id: "no-class", label: "Sem turma" },
];

export function MembersModule({
  data,
  filteredMembers,
  runAction,
  isPending,
}: {
  data: AppData;
  filteredMembers: Member[];
  runAction: RunAction;
  isPending: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState<MemberFilter>("all");
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [defaultKind, setDefaultKind] = useState<Member["kind"]>("child");
  const [editingMember, setEditingMember] = useState<Member | undefined>();
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  const children = data.members.filter((member) => member.kind === "child");
  const guardians = data.members.filter((member) => member.kind === "guardian");
  const noGuardianCount = children.filter(
    (member) => member.guardianIds.length === 0,
  ).length;
  const noClassCount = children.filter((member) => !member.classId).length;

  const visibleMembers = useMemo(() => {
    return filteredMembers.filter((member) => {
      if (activeFilter === "children") return member.kind === "child";
      if (activeFilter === "guardians") return member.kind === "guardian";
      if (activeFilter === "no-guardian") {
        return member.kind === "child" && member.guardianIds.length === 0;
      }
      if (activeFilter === "no-class") {
        return member.kind === "child" && !member.classId;
      }

      return true;
    });
  }, [activeFilter, filteredMembers]);

  function openNewMember(kind: Member["kind"] = "child") {
    setDefaultKind(kind);
    setEditingMember(undefined);
    setMemberModalOpen(true);
  }

  function openEditMember(member: Member) {
    setDefaultKind(member.kind);
    setEditingMember(member);
    setMemberModalOpen(true);
  }

  function openMemberDetails(member: Member) {
    setViewingMember(member);
  }

  function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const action: ActionFn = editingMember ? updateMember : createMember;

    runAction(
      action,
      formData,
      editingMember ? "Membro atualizado." : "Membro cadastrado.",
      () => {
        setMemberModalOpen(false);
        setEditingMember(undefined);
      },
    );
  }

  function confirmDeleteMember() {
    if (!deletingMember) return;

    const formData = new FormData();
    formData.set("memberId", deletingMember.id);

    runAction(deleteMember, formData, "Membro excluído.", () =>
      setDeletingMember(null),
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <Heading
          title="Membros"
          subtitle="Cadastre crianças e vincule um ou mais responsáveis a cada criança"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => openNewMember()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
          >
            <Plus size={17} aria-hidden="true" />
            Novo membro
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MemberStat icon={Baby} label="Crianças" value={children.length} tone="emerald" />
        <MemberStat icon={UserRound} label="Responsáveis" value={guardians.length} tone="sky" />
        <MemberStat icon={Link2} label="Sem responsável" value={noGuardianCount} tone="amber" />
        <MemberStat icon={Baby} label="Sem turma" value={noClassCount} tone="rose" />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <Heading
            title="Crianças e responsáveis"
            subtitle={`${visibleMembers.length} pessoa(s) na visualização`}
          />
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`h-9 rounded-md px-3 text-sm font-semibold ${
                  activeFilter === filter.id
                    ? "bg-emerald-700 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {visibleMembers.length ? (
            visibleMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isPending={isPending}
                onOpen={openMemberDetails}
                onEdit={openEditMember}
                onDelete={setDeletingMember}
              />
            ))
          ) : (
            <EmptyState text="Nenhum membro encontrado." />
          )}
        </div>
      </section>

      <MemberFormModal
        data={data}
        member={editingMember}
        defaultKind={defaultKind}
        open={memberModalOpen}
        pending={isPending}
        onClose={() => {
          setMemberModalOpen(false);
          setEditingMember(undefined);
        }}
        onSubmit={submitMember}
      />
      <MemberDetailsModal
        member={viewingMember ?? undefined}
        open={Boolean(viewingMember)}
        onClose={() => setViewingMember(null)}
      />
      <ConfirmModal
        title="Excluir membro"
        description={`O cadastro de "${deletingMember?.fullName ?? "membro"}" será removido. Chamadas e vínculos desse membro também podem ser afetados.`}
        confirmLabel="Excluir membro"
        open={Boolean(deletingMember)}
        pending={isPending}
        destructive
        onClose={() => setDeletingMember(null)}
        onConfirm={confirmDeleteMember}
      />
    </div>
  );
}

function MemberCard({
  member,
  isPending,
  onOpen,
  onEdit,
  onDelete,
}: {
  member: Member;
  isPending: boolean;
  onOpen: (member: Member) => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}) {
  const linkedNames =
    member.kind === "child" ? member.guardianNames : member.childNames;
  const linkedLabel =
    member.kind === "child" ? "Responsáveis vinculados" : "Crianças vinculadas";
  const secondaryText =
    member.kind === "child"
      ? `${member.className || "Sem turma"} · ${
          member.age !== null ? `${member.age} ano(s)` : "Sem idade"
        }`
      : member.address || "Sem endereço";

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Abrir detalhes de ${member.fullName}`}
      onClick={() => onOpen(member)}
      onKeyDown={(event) => handleCardKeyDown(event, () => onOpen(member))}
      className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-zinc-100 text-sm font-bold text-emerald-900">
            {getInitials(member.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <p className="text-lg font-bold leading-tight text-zinc-950">
                {member.fullName}
              </p>
              <span
                className={`w-fit rounded-md px-2 py-1 text-xs font-bold ${
                  member.kind === "child"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-sky-50 text-sky-800"
                }`}
              >
                {member.kind === "child" ? "Criança" : "Responsável"}
              </span>
            </div>
            <p className="mt-1 text-sm leading-5 text-zinc-600">
              {member.phone || "Sem telefone"}
            </p>
            <p className="text-sm leading-5 text-zinc-600">{secondaryText}</p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(member);
            }}
            disabled={isPending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 sm:w-auto"
          >
            <Edit2 size={15} aria-hidden="true" />
            Editar
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(member);
            }}
            disabled={isPending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60 sm:w-auto"
          >
            <Trash2 size={15} aria-hidden="true" />
            Excluir
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-zinc-100 pt-4">
        <section className="rounded-xl bg-zinc-50 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {linkedLabel}
          </p>
          <p className="mt-1 text-sm font-semibold leading-5 text-zinc-800 break-words">
            {linkedNames.length ? linkedNames.join(", ") : "Nenhum vínculo"}
          </p>
        </section>

        {member.categoryNames.length ? (
          <div className="flex flex-wrap gap-2">
            {member.categoryNames.map((category) => (
              <span
                key={category}
                className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800"
              >
                {category}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {member.notes && (
        <p className="mt-4 text-sm leading-6 text-zinc-700">{member.notes}</p>
      )}
    </article>
  );
}

function MemberDetailsModal({
  member,
  open,
  onClose,
}: {
  member?: Member;
  open: boolean;
  onClose: () => void;
}) {
  if (!member) return null;

  const linkedNames = member.kind === "child" ? member.guardianNames : member.childNames;

  return (
    <Modal title="Detalhes do membro" open={open} onClose={onClose} panelClassName="max-w-3xl">
      <div className="grid gap-5">
        <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-lg font-bold text-emerald-900 shadow-sm ring-1 ring-zinc-200">
                {getInitials(member.fullName)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {member.kind === "child" ? "Criança" : "Responsável"}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-950">
                  {member.fullName}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {member.kind === "child"
                    ? `${member.className || "Sem turma"} · ${
                        member.age !== null ? `${member.age} ano(s)` : "Sem idade"
                      }`
                    : member.address || "Sem endereço"}
                </p>
              </div>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                member.kind === "child"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-sky-50 text-sky-800"
              }`}
            >
              {member.kind === "child" ? "Cadastro infantil" : "Cadastro de responsável"}
            </span>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailPanel label="Telefone" value={member.phone || "Sem telefone"} />
          <DetailPanel label="Endereço" value={member.address || "Sem endereço"} />
          <DetailPanel
            label="Data de nascimento"
            value={formatMemberDate(member.birthDate)}
          />
          <DetailPanel
            label="Congrega conosco desde"
            value={formatMemberDate(member.congregatesSince)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TagPanel
            title={member.kind === "child" ? "Responsáveis vinculados" : "Crianças vinculadas"}
            emptyText={
              member.kind === "child"
                ? "Nenhum responsável vinculado."
                : "Nenhuma criança vinculada."
            }
            values={linkedNames}
            tone={member.kind === "child" ? "sky" : "emerald"}
          />
          <TagPanel
            title="Categorias"
            emptyText="Sem categorias vinculadas."
            values={member.categoryNames}
            tone="amber"
          />
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-zinc-900">Observações</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
            {member.notes || "Sem observações registradas."}
          </p>
        </section>
      </div>
    </Modal>
  );
}

function DetailPanel({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-zinc-900">
        {value}
      </p>
    </section>
  );
}

function TagPanel({
  title,
  values,
  emptyText,
  tone,
}: {
  title: string;
  values: string[];
  emptyText: string;
  tone: "emerald" | "sky" | "amber";
}) {
  const toneClasses = {
    emerald: "bg-emerald-50 text-emerald-800",
    sky: "bg-sky-50 text-sky-800",
    amber: "bg-amber-50 text-amber-800",
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      {values.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className={`rounded-full px-3 py-1 text-xs font-bold ${toneClasses[tone]}`}
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-zinc-500">{emptyText}</p>
      )}
    </section>
  );
}

function MemberStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Baby;
  label: string;
  value: number;
  tone: "emerald" | "sky" | "amber" | "rose";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-800",
    sky: "bg-sky-50 text-sky-800",
    amber: "bg-amber-50 text-amber-800",
    rose: "bg-rose-50 text-rose-800",
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-zinc-950">{value}</p>
        </div>
        <div className={`grid size-12 place-items-center rounded-lg ${colors[tone]}`}>
          <Icon size={22} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatMemberDate(value: string) {
  if (!value) return "Não informado";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function handleCardKeyDown(
  event: ReactKeyboardEvent<HTMLElement>,
  onOpen: () => void,
) {
  if (event.target !== event.currentTarget) {
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onOpen();
  }
}
