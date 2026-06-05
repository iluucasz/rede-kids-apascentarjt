"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Edit2,
  Minus,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  adjustInventoryItemQuantity,
  createInventoryItem,
  deleteInventoryItem,
  updateInventoryItem,
} from "@/app/actions";
import {
  ConfirmModal,
  EmptyState,
  Heading,
  InputField,
  Modal,
  SubmitButton,
  TextareaField,
} from "@/components/ui";
import type { AppData, InventoryItem } from "@/lib/types";
import type { ActionFn, RunAction } from "../../types";

type InventoryFilter = "all" | "low" | "ok";

const filters: { id: InventoryFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "low", label: "Estoque baixo" },
  { id: "ok", label: "Em dia" },
];

export function InventoryModule({
  data,
  runAction,
  isPending,
}: {
  data: AppData;
  runAction: RunAction;
  isPending: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<InventoryFilter>("all");
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  const lowStock = data.inventory.filter(isLowStock);
  const visibleItems = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return data.inventory.filter((item) => {
      const itemIsLow = isLowStock(item);
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "low" && itemIsLow) ||
        (activeFilter === "ok" && !itemIsLow);

      const matchesSearch =
        !normalizedSearch ||
        [item.name, item.unit, item.notes]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, data.inventory, search]);

  function openNewItem() {
    setEditingItem(undefined);
    setModalOpen(true);
  }

  function openEditItem(item: InventoryItem) {
    setEditingItem(item);
    setModalOpen(true);
  }

  function submitInventoryItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const action: ActionFn = editingItem ? updateInventoryItem : createInventoryItem;

    runAction(action, formData, editingItem ? "Material atualizado." : "Material adicionado.", () => {
      form.reset();
      setModalOpen(false);
      setEditingItem(undefined);
    });
  }

  function adjustQuantity(item: InventoryItem, delta: number) {
    const formData = new FormData();
    formData.set("itemId", item.id);
    formData.set("delta", String(delta));

    runAction(
      adjustInventoryItemQuantity,
      formData,
      delta > 0 ? "Quantidade aumentada." : "Quantidade reduzida.",
    );
  }

  function confirmDeleteItem() {
    if (!deletingItem) return;

    const formData = new FormData();
    formData.set("itemId", deletingItem.id);

    runAction(deleteInventoryItem, formData, "Material excluído.", () => {
      setDeletingItem(null);
    });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <Heading
          title="Estoque"
          subtitle="Acompanhe materiais, mínimos desejados e alertas de reposição"
        />
        <button
          type="button"
          onClick={openNewItem}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
        >
          <Plus size={17} aria-hidden="true" />
          Novo material
        </button>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InventoryStat icon={Boxes} label="Materiais" value={data.inventory.length} tone="emerald" />
        <InventoryStat icon={AlertTriangle} label="Estoque baixo" value={lowStock.length} tone="rose" />
        <InventoryStat icon={CheckCircle2} label="Em dia" value={data.inventory.length - lowStock.length} tone="sky" />
        <InventoryStat icon={PackagePlus} label="Unidades" value={countUnits(data.inventory)} tone="amber" />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <Heading
            title="Materiais cadastrados"
            subtitle={`${visibleItems.length} de ${data.inventory.length} material(is)`}
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

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
            <Search size={16} className="text-zinc-500" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar material"
              className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-zinc-500"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setActiveFilter("all");
            }}
            disabled={!search && activeFilter === "all"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} aria-hidden="true" />
            Limpar
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.length ? (
            visibleItems.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                isPending={isPending}
                onEdit={openEditItem}
                onDelete={setDeletingItem}
                onAdjustQuantity={adjustQuantity}
              />
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState text="Nenhum material encontrado." />
            </div>
          )}
        </div>
      </section>

      <InventoryFormModal
        item={editingItem}
        open={modalOpen}
        pending={isPending}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(undefined);
        }}
        onSubmit={submitInventoryItem}
      />
      <ConfirmModal
        title="Excluir material"
        description={`O material "${deletingItem?.name ?? "selecionado"}" será removido do estoque.`}
        confirmLabel="Excluir material"
        open={Boolean(deletingItem)}
        pending={isPending}
        destructive
        onClose={() => setDeletingItem(null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
}

function InventoryFormModal({
  item,
  open,
  pending,
  onClose,
  onSubmit,
}: {
  item?: InventoryItem;
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal title={item ? "Editar material" : "Novo material"} open={open} onClose={onClose}>
      <form className="grid gap-4" onSubmit={onSubmit}>
        {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
        <InputField
          name="name"
          label="Material"
          placeholder="Lápis"
          defaultValue={item?.name}
          required
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <InputField
            name="quantity"
            label="Quantidade"
            type="number"
            min="0"
            step="0.01"
            defaultValue={item?.quantity}
            required
          />
          <InputField
            name="unit"
            label="Unidade"
            placeholder="un"
            defaultValue={item?.unit || "un"}
          />
          <InputField
            name="minQuantity"
            label="Mínimo"
            type="number"
            min="0"
            step="0.01"
            defaultValue={item?.minQuantity}
          />
        </div>
        <TextareaField
          name="notes"
          label="Observações"
          rows={4}
          defaultValue={item?.notes}
        />
        <SubmitButton label={item ? "Salvar alterações" : "Adicionar material"} pending={pending} />
      </form>
    </Modal>
  );
}

function InventoryCard({
  item,
  isPending,
  onEdit,
  onDelete,
  onAdjustQuantity,
}: {
  item: InventoryItem;
  isPending: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onAdjustQuantity: (item: InventoryItem, delta: number) => void;
}) {
  const low = isLowStock(item);
  const percent = item.minQuantity > 0 ? Math.min(100, (item.quantity / item.minQuantity) * 100) : 100;

  return (
    <article
      className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-sm ${
        low ? "border-rose-200 bg-rose-50/30" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-950">{item.name}</h3>
          <p className="mt-1 text-sm text-zinc-600">
            Mínimo: {formatQuantity(item.minQuantity, item.unit)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            low ? "bg-rose-100 text-rose-800" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {low ? "Baixo" : "Em dia"}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-end justify-between gap-3">
          <p className="text-3xl font-bold text-zinc-950">
            {formatQuantity(item.quantity, item.unit)}
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Atual
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full ${low ? "bg-rose-600" : "bg-emerald-700"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onAdjustQuantity(item, -1)}
          disabled={isPending || item.quantity <= 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
        >
          <Minus size={15} aria-hidden="true" />
          Diminuir
        </button>
        <button
          type="button"
          onClick={() => onAdjustQuantity(item, 1)}
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
        >
          <Plus size={15} aria-hidden="true" />
          Aumentar
        </button>
        <button
          type="button"
          onClick={() => onEdit(item)}
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
        >
          <Edit2 size={15} aria-hidden="true" />
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
        >
          <Trash2 size={15} aria-hidden="true" />
          Excluir
        </button>
      </div>

      {item.notes ? (
        <p className="mt-4 text-sm leading-6 text-zinc-700">{item.notes}</p>
      ) : null}
    </article>
  );
}

function InventoryStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Boxes;
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

function isLowStock(item: InventoryItem) {
  return item.quantity <= item.minQuantity;
}

function countUnits(items: InventoryItem[]) {
  return Math.round(items.reduce((total, item) => total + item.quantity, 0));
}

function formatQuantity(value: number, unit: string) {
  return `${new Intl.NumberFormat("pt-BR").format(value)} ${unit || "un"}`;
}
