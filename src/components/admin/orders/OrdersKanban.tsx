"use client";

import { memo, useCallback, useEffect, useMemo, useState, type DragEvent, type KeyboardEvent } from "react";
import {
  ORDER_STATUSES,
  subscribeActive,
  updateOrderStatus,
  type OrderStatus,
  type OrderSummary,
} from "@/lib/orders/ordersData";
import { formatMoney, type PricingSettings } from "@/lib/orders/pricing";
import { phoneMatches } from "@/lib/orders/search";
import { ErrorBox, Spinner, inputClass } from "../ui";
import { formatDate, orderNo } from "./common";

type Props = {
  pricing: PricingSettings;
  onOpen: (id: string) => void;
  onDelete: (order: OrderSummary) => void;
  selection?: { selected: Set<string>; onToggle: (id: string) => void };
};

const COLUMNS = ORDER_STATUSES.filter((s) => s.active);

const DOT: Record<string, string> = {
  quoted: "bg-indigo-500",
  confirmed: "bg-amber-500",
  production: "bg-orange-500",
  ready: "bg-lime-500",
};

const startOfDay = (d: string) => new Date(`${d}T00:00:00`).getTime();
const endOfDay = (d: string) => new Date(`${d}T23:59:59.999`).getTime();

type CardProps = {
  order: OrderSummary;
  stoneLabel: (k: string) => string;
  selected?: boolean;
  selectable: boolean;
  dragging: boolean;
  saving: boolean;
  onOpen: (id: string) => void;
  onToggle?: (id: string) => void;
  onDelete: (order: OrderSummary) => void;
  onMove: (id: string, status: OrderStatus) => void;
  onDragStart: (e: DragEvent<HTMLElement>, id: string) => void;
  onDragEnd: () => void;
};

// Memoised so dragging one card does not re-render the whole board.
const KanbanCard = memo(function KanbanCard({
  order,
  stoneLabel,
  selected,
  selectable,
  dragging,
  saving,
  onOpen,
  onToggle,
  onDelete,
  onMove,
  onDragStart,
  onDragEnd,
}: CardProps) {
  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, order.id)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(order.id)}
      onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(order.id);
        }
      }}
      role="button"
      tabIndex={0}
      className={`group cursor-grab rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm outline-none transition hover:border-darkGold/50 hover:shadow-md focus-visible:ring-2 focus-visible:ring-darkGold active:cursor-grabbing ${
        dragging ? "opacity-40" : ""
      } ${saving ? "ring-1 ring-darkGold/50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs text-gray-500">{orderNo(order.number)}</span>
        <div className="flex items-center gap-1">
          {selectable && (
            <input
              type="checkbox"
              className="h-4 w-4 accent-darkGold"
              checked={!!selected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggle?.(order.id)}
              aria-label={`Избери поръчка ${orderNo(order.number)}`}
            />
          )}
          <button
            type="button"
            title="Изтрий завинаги"
            aria-label={`Изтрий завинаги поръчка ${orderNo(order.number)}`}
            className="rounded px-1 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(order);
            }}
          >
            🗑
          </button>
        </div>
      </div>

      <p className="mt-1 truncate font-semibold text-obsidian">{order.clientName || "—"}</p>
      <p className="truncate text-xs text-gray-500">{order.materialLabel || stoneLabel(order.stoneKey)}</p>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>{order.positions} поз.</span>
        <span className="font-semibold text-obsidian">{formatMoney(order.gross, order.currency)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
        <span className="text-[11px] text-gray-400">{formatDate(order.createdAt)}</span>
        <select
          className="max-w-[130px] rounded border border-transparent bg-transparent py-0.5 text-[11px] font-semibold text-gray-500 outline-none transition hover:border-gray-300 focus:border-darkGold"
          value={order.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onMove(order.id, e.target.value as OrderStatus)}
          aria-label={`Статус на поръчка ${orderNo(order.number)}`}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
});

export default function OrdersKanban({ pricing, onOpen, onDelete, selection }: Props) {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [material, setMaterial] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<OrderStatus | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => subscribeActive(setOrders, (e) => setError(e.message)), []);

  const stoneLabel = useCallback((k: string) => pricing.stones[k]?.label ?? k, [pricing]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    const q = search.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return orders
      .filter((o) => {
        if (material && o.stoneKey !== material) return false;
        if (from && o.createdAt < startOfDay(from)) return false;
        if (to && o.createdAt > endOfDay(to)) return false;
        if (!q) return true;
        return (
          o.clientName?.toLowerCase().includes(q) ||
          o.materialLabel?.toLowerCase().includes(q) ||
          (digits.length > 0 && (String(o.number).includes(digits) || phoneMatches(o.clientPhone, digits)))
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [orders, search, material, from, to]);

  const byStatus = useMemo(() => {
    const map = new Map<OrderStatus, OrderSummary[]>();
    for (const c of COLUMNS) map.set(c.key, []);
    for (const o of filtered) map.get(o.status)?.push(o);
    return map;
  }, [filtered]);

  const move = useCallback(
    async (id: string, status: OrderStatus) => {
      const current = orders?.find((o) => o.id === id);
      if (!current || current.status === status) return;
      // Optimistic update; the subscription will confirm it.
      setOrders((prev) => prev?.map((o) => (o.id === id ? { ...o, status } : o)) ?? prev);
      setSavingId(id);
      try {
        await updateOrderStatus(id, status);
      } catch (e) {
        setOrders((prev) => prev?.map((o) => (o.id === id ? { ...o, status: current.status } : o)) ?? prev);
        setError(e instanceof Error ? e.message : "Грешка при смяна на статуса.");
      } finally {
        setSavingId(null);
      }
    },
    [orders]
  );

  const onDragStart = useCallback((e: DragEvent<HTMLElement>, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, []);

  const onDragEnd = useCallback(() => {
    setDragId(null);
    setOverStatus(null);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLElement>, status: OrderStatus) => {
      e.preventDefault();
      const id = dragId ?? e.dataTransfer.getData("text/plain");
      setOverStatus(null);
      setDragId(null);
      if (id) void move(id, status);
    },
    [dragId, move]
  );

  if (error) return <ErrorBox>Грешка: {error}</ErrorBox>;
  if (!orders) return <Spinner />;

  const hasFilters = !!(search || material || from || to);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <input
          className={`${inputClass} lg:col-span-2`}
          placeholder="Търси клиент, телефон, № или материал…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Търсене"
        />
        <select className={inputClass} value={material} onChange={(e) => setMaterial(e.target.value)} aria-label="Материал">
          <option value="">Всички материали</option>
          {Object.entries(pricing.stones).map(([k, s]) => (
            <option key={k} value={k}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="От дата" />
          <span className="text-gray-400">–</span>
          <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} aria-label="До дата" />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {filtered.length} от {orders.length} поръчки · плъзнете карта между колоните, за да смените статуса
        </span>
        {hasFilters && (
          <button
            className="font-semibold text-darkGold hover:underline"
            onClick={() => {
              setSearch("");
              setMaterial("");
              setFrom("");
              setTo("");
            }}
          >
            Изчисти филтрите
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-start gap-4">
          {COLUMNS.map((col) => {
            const list = byStatus.get(col.key) ?? [];
            const isOver = overStatus === col.key;
            return (
              <section
                key={col.key}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (overStatus !== col.key) setOverStatus(col.key);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                  setOverStatus((s) => (s === col.key ? null : s));
                }}
                onDrop={(e) => onDrop(e, col.key)}
                className={`flex w-[280px] shrink-0 flex-col rounded-xl border transition ${
                  isOver ? "border-darkGold bg-royalGold/10 shadow-md" : "border-gray-200 bg-gray-50"
                }`}
              >
                <header className="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${DOT[col.key] ?? "bg-gray-400"}`} />
                    <h3 className="text-sm font-semibold text-obsidian">{col.label}</h3>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-600">{list.length}</span>
                </header>
                <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 340px)" }}>
                  {list.map((o) => (
                    <KanbanCard
                      key={o.id}
                      order={o}
                      stoneLabel={stoneLabel}
                      selected={selection?.selected.has(o.id)}
                      selectable={!!selection}
                      dragging={dragId === o.id}
                      saving={savingId === o.id}
                      onOpen={onOpen}
                      onToggle={selection?.onToggle}
                      onDelete={onDelete}
                      onMove={move}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                  {list.length === 0 && <p className="py-8 text-center text-xs text-gray-400">Няма поръчки</p>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
