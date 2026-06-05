"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Baby,
  ClipboardList,
  Search,
  ShieldCheck,
  Tags,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  InputField,
  Modal,
  SelectField,
  SubmitButton,
  TextareaField,
} from "@/components/ui";
import type { AppData, Member } from "@/lib/types";

type LinkedMemberOption = {
  id: string;
  label: string;
  meta: string;
};

export function MemberFormModal({
  data,
  member,
  defaultKind = "child",
  open,
  pending,
  onClose,
  onSubmit,
}: {
  data: AppData;
  member?: Member;
  defaultKind?: Member["kind"];
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isEditing = Boolean(member);
  const initialKind = member?.kind ?? defaultKind;

  return (
    <Modal
      title={isEditing ? "Editar membro" : "Cadastrar membro"}
      open={open}
      onClose={onClose}
      panelClassName="max-w-4xl"
    >
      <MemberForm
        key={`${member?.id ?? "new"}-${initialKind}`}
        data={data}
        member={member}
        initialKind={initialKind}
        pending={pending}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}

function MemberForm({
  data,
  member,
  initialKind,
  pending,
  onSubmit,
}: {
  data: AppData;
  member?: Member;
  initialKind: Member["kind"];
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [kind, setKind] = useState<Member["kind"]>(initialKind);
  const [selectedGuardianIds, setSelectedGuardianIds] = useState<string[]>(
    member?.guardianIds ?? [],
  );
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(
    member?.childIds ?? [],
  );
  const isEditing = Boolean(member);
  const guardians = data.members.filter(
    (item) => item.kind === "guardian" && item.id !== member?.id,
  );
  const children = data.members.filter(
    (item) => item.kind === "child" && item.id !== member?.id,
  );
  const kindContent =
    kind === "child"
      ? {
          eyebrow: isEditing ? "Atualizar criança" : "Nova criança",
          title: "Cadastro da criança",
          description:
            "Organize dados principais, turma e responsáveis em uma única ficha mais clara.",
          footer:
            "Os responsáveis, turma e categorias selecionados serão vinculados após salvar.",
        }
      : {
          eyebrow: isEditing ? "Atualizar responsável" : "Novo responsável",
          title: "Cadastro do responsável",
          description:
            "Registre contato, crianças vinculadas e observações úteis para o acompanhamento.",
          footer:
            "As crianças marcadas e categorias escolhidas serão vinculadas quando o cadastro for salvo.",
        };
  const guardianOptions = useMemo(
    () =>
      guardians.map((guardian) => ({
        id: guardian.id,
        label: guardian.fullName,
        meta: guardian.phone || guardian.address || "Sem telefone ou endereço",
      })),
    [guardians],
  );
  const childOptions = useMemo(
    () =>
      children.map((child) => ({
        id: child.id,
        label: child.fullName,
        meta: formatChildLinkMeta(child),
      })),
    [children],
  );
  const categoryOptions = data.categories.map((category) => ({
    id: category.id,
    label: category.name,
  }));

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      {member && <input type="hidden" name="memberId" value={member.id} />}
      <div className="rounded-2xl border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_50%,#eff6ff_100%)] p-5">
        <input type="hidden" name="kind" value={kind} />
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {kindContent.eyebrow}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-zinc-950">
              {kindContent.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {kindContent.description}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-85">
            <MemberKindButton
              icon={Baby}
              label="Criança"
              description="Turma, responsáveis e acompanhamento"
              selected={kind === "child"}
              onClick={() => setKind("child")}
            />
            <MemberKindButton
              icon={ShieldCheck}
              label="Responsável"
              description="Contato e crianças vinculadas"
              selected={kind === "guardian"}
              onClick={() => setKind("guardian")}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div className="grid gap-5">
          <FormSection
            icon={UserRound}
            title="Dados principais"
            description="Informações básicas para localizar e identificar esse cadastro rapidamente."
          >
            <InputField
              name="fullName"
              label="Nome completo"
              defaultValue={member?.fullName ?? ""}
              required
            />
            <div className="grid gap-4">
              <InputField
                name="phone"
                label="Telefone"
                defaultValue={member?.phone ?? ""}
              />
              <InputField
                name="address"
                label="Endereço"
                defaultValue={member?.address ?? ""}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                name="birthDate"
                label="Data de nascimento"
                type="date"
                defaultValue={member?.birthDate ?? ""}
              />
              <InputField
                name="congregatesSince"
                label="Congrega conosco desde"
                type="date"
                defaultValue={member?.congregatesSince ?? ""}
              />
            </div>
            {kind === "child" ? (
              <SelectField
                name="classId"
                label="Turma da criança"
                defaultValue={member?.classId ?? ""}
              >
                <option value="">Sem turma</option>
                {data.classes.map((classRoom) => (
                  <option key={classRoom.id} value={classRoom.id}>
                    {classRoom.name}
                  </option>
                ))}
              </SelectField>
            ) : null}
          </FormSection>

          <FormSection
            icon={kind === "child" ? ShieldCheck : Users}
            title={kind === "child" ? "Responsáveis vinculados" : "Crianças vinculadas"}
            description={
              kind === "child"
                ? "Escolha quem acompanha a criança para deixar os vínculos organizados no cadastro."
                : "Marque as crianças ligadas a este responsável para facilitar contato e acompanhamento."
            }
          >
            {kind === "child" ? (
              <LinkedMembersField
                name="guardianIds"
                summaryLabel="Responsáveis vinculados"
                actionLabel="Vincular responsável"
                pickerTitle="Vincular responsáveis"
                pickerDescription="Abra a lista, use o filtro e a busca para localizar quem acompanha esta criança."
                searchPlaceholder="Buscar responsável"
                emptySelectionText="Nenhum responsável vinculado ainda."
                emptyPickerText="Nenhum responsável cadastrado ainda."
                selectedIds={selectedGuardianIds}
                onSelectedIdsChange={setSelectedGuardianIds}
                options={guardianOptions}
                tone="sky"
              />
            ) : (
              <LinkedMembersField
                name="childIds"
                summaryLabel="Crianças vinculadas"
                actionLabel="Vincular criança"
                pickerTitle="Vincular crianças"
                pickerDescription="Abra a lista de crianças, filtre por selecionadas quando precisar e use a busca para encontrar mais rápido."
                searchPlaceholder="Buscar criança"
                emptySelectionText="Nenhuma criança vinculada ainda."
                emptyPickerText="Nenhuma criança cadastrada ainda."
                selectedIds={selectedChildIds}
                onSelectedIdsChange={setSelectedChildIds}
                options={childOptions}
                tone="emerald"
              />
            )}
          </FormSection>
        </div>

        <div className="grid gap-5">
          <FormSection
            icon={Tags}
            title="Categorias"
            description="Marque as classificações que ajudam a equipe a identificar esse cadastro mais rápido."
          >
            <OptionChecklist
              name="categoryIds"
              label="Categorias do cadastro"
              description="Essas marcações aparecem nas listas e ajudam na organização da equipe."
              defaultValue={member?.categoryIds ?? []}
              emptyText="Nenhuma categoria cadastrada ainda."
              options={categoryOptions}
              tone="amber"
              columns={1}
            />
          </FormSection>

          <FormSection
            icon={ClipboardList}
            title="Observações"
            description="Registre detalhes importantes para o acompanhamento desse membro."
          >
            <TextareaField
              name="notes"
              label="Anotações internas"
              rows={6}
              defaultValue={member?.notes ?? ""}
            />
          </FormSection>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-zinc-500">{kindContent.footer}</p>
        <SubmitButton
          label={isEditing ? "Salvar alterações" : "Cadastrar membro"}
          pending={pending}
        />
      </div>
    </form>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white text-emerald-700 shadow-sm">
          <Icon size={18} aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

function MemberKindButton({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-left transition ${
        selected
          ? "border-emerald-300 bg-white text-zinc-950 shadow-sm ring-2 ring-emerald-100"
          : "border-zinc-200 bg-white/70 text-zinc-700 hover:border-emerald-200 hover:bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl ${
            selected ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
          }`}
        >
          <Icon size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
        </div>
      </div>
    </button>
  );
}

function OptionChecklist({
  name,
  label,
  options,
  defaultValue,
  emptyText,
  description,
  tone = "emerald",
  columns = 2,
}: {
  name: string;
  label: string;
  options: { id: string; label: string }[];
  defaultValue: string[];
  emptyText: string;
  description?: string;
  tone?: "emerald" | "sky" | "amber";
  columns?: 1 | 2;
}) {
  const toneClasses = {
    emerald: {
      input: "accent-emerald-600",
      card: "hover:border-emerald-200 hover:bg-emerald-50/60",
    },
    sky: {
      input: "accent-sky-600",
      card: "hover:border-sky-200 hover:bg-sky-50/60",
    },
    amber: {
      input: "accent-amber-500",
      card: "hover:border-amber-200 hover:bg-amber-50/60",
    },
  };

  return (
    <div className="grid gap-3">
      <div>
        <p className="text-sm font-semibold text-zinc-900">{label}</p>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
        ) : null}
      </div>

      {options.length ? (
        <div className={`grid gap-2 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
          {options.map((option) => (
            <label
              key={option.id}
              className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm transition ${toneClasses[tone].card}`}
            >
              <input
                type="checkbox"
                name={name}
                value={option.id}
                defaultChecked={defaultValue.includes(option.id)}
                className={`mt-0.5 size-5 shrink-0 rounded-md border-zinc-300 ${toneClasses[tone].input}`}
              />
              <span className="font-semibold leading-5 text-zinc-800">{option.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-4 text-sm text-zinc-500">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function LinkedMembersField({
  name,
  summaryLabel,
  actionLabel,
  pickerTitle,
  pickerDescription,
  searchPlaceholder,
  options,
  selectedIds,
  onSelectedIdsChange,
  emptySelectionText,
  emptyPickerText,
  tone,
}: {
  name: string;
  summaryLabel: string;
  actionLabel: string;
  pickerTitle: string;
  pickerDescription: string;
  searchPlaceholder: string;
  options: LinkedMemberOption[];
  selectedIds: string[];
  onSelectedIdsChange: Dispatch<SetStateAction<string[]>>;
  emptySelectionText: string;
  emptyPickerText: string;
  tone: "emerald" | "sky";
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSession, setPickerSession] = useState(0);
  const selectedOptions = useMemo(
    () =>
      selectedIds
        .map((selectedId) => options.find((option) => option.id === selectedId) ?? null)
        .filter((option): option is LinkedMemberOption => Boolean(option)),
    [options, selectedIds],
  );

  function openPicker() {
    setPickerSession((current) => current + 1);
    setIsPickerOpen(true);
  }

  function removeSelection(optionId: string) {
    onSelectedIdsChange((current) => current.filter((item) => item !== optionId));
  }

  return (
    <div className="grid gap-3">
      {selectedIds.map((selectedId) => (
        <input key={`${name}-${selectedId}`} type="hidden" name={name} value={selectedId} />
      ))}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900">{summaryLabel}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {selectedIds.length
                ? `${selectedIds.length} vínculo(s) selecionado(s).`
                : emptySelectionText}
            </p>
          </div>

          <button
            type="button"
            onClick={openPicker}
            className={`inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md px-4 text-sm font-semibold sm:self-start ${
              tone === "emerald"
                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                : "bg-sky-700 text-white hover:bg-sky-800"
            }`}
          >
            {actionLabel}
          </button>
        </div>

        {selectedOptions.length ? (
          <div className="mt-4 max-h-36 overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-2">
              {selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    tone === "emerald"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-sky-50 text-sky-800"
                  }`}
                >
                  <span>{option.label}</span>
                  <button
                    type="button"
                    onClick={() => removeSelection(option.id)}
                    className="inline-flex size-4 items-center justify-center rounded-full hover:bg-white/70"
                    aria-label={`Remover ${option.label}`}
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-sm text-zinc-500">
            {emptySelectionText}
          </div>
        )}
      </div>

      <LinkedMembersPickerModal
        key={`${name}-${pickerSession}`}
        title={pickerTitle}
        description={pickerDescription}
        searchPlaceholder={searchPlaceholder}
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        options={options}
        selectedIds={selectedIds}
        onSelectedIdsChange={onSelectedIdsChange}
        emptyText={emptyPickerText}
        tone={tone}
      />
    </div>
  );
}

function LinkedMembersPickerModal({
  title,
  description,
  searchPlaceholder,
  open,
  onClose,
  options,
  selectedIds,
  onSelectedIdsChange,
  emptyText,
  tone,
}: {
  title: string;
  description: string;
  searchPlaceholder: string;
  open: boolean;
  onClose: () => void;
  options: LinkedMemberOption[];
  selectedIds: string[];
  onSelectedIdsChange: Dispatch<SetStateAction<string[]>>;
  emptyText: string;
  tone: "emerald" | "sky";
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "selected">("all");

  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return options.filter((option) => {
      const matchesFilter = filter === "all" || selectedIds.includes(option.id);
      const matchesSearch =
        !normalizedSearch ||
        [option.label, option.meta].join(" ").toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [filter, options, search, selectedIds]);

  function toggleSelection(optionId: string) {
    onSelectedIdsChange((current) =>
      current.includes(optionId)
        ? current.filter((item) => item !== optionId)
        : [...current, optionId],
    );
  }

  return (
    <Modal title={title} open={open} onClose={onClose} panelClassName="max-w-2xl">
      <div className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-zinc-600">{description}</p>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
            {selectedIds.length} selecionado(s)
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
            <Search size={16} className="text-zinc-500" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                }
              }}
              placeholder={searchPlaceholder}
              className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-zinc-500"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <PickerFilterButton
              active={filter === "all"}
              label="Todos"
              onClick={() => setFilter("all")}
            />
            <PickerFilterButton
              active={filter === "selected"}
              label="Selecionados"
              onClick={() => setFilter("selected")}
            />
          </div>
        </div>

        {filteredOptions.length ? (
          <div className="grid max-h-[50vh] gap-2 overflow-y-auto pr-1">
            {filteredOptions.map((option) => {
              const checked = selectedIds.includes(option.id);

              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                    checked
                      ? tone === "emerald"
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-sky-300 bg-sky-50"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelection(option.id)}
                    className={`mt-0.5 size-5 shrink-0 rounded-md border-zinc-300 ${
                      tone === "emerald" ? "accent-emerald-600" : "accent-sky-600"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900">{option.label}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">{option.meta}</p>
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
            {options.length ? "Nenhum resultado para o filtro aplicado." : emptyText}
          </div>
        )}

        <div className="flex justify-end border-t border-zinc-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Concluir
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PickerFilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-md px-3 text-sm font-semibold transition ${
        active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}

function formatChildLinkMeta(child: Member) {
  const ageLabel = child.age !== null ? `${child.age} ano(s)` : "Sem idade";

  return `${child.className || "Sem turma"} · ${ageLabel}`;
}
