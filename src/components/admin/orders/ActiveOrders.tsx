"use client";

import { useEffect, useMemo, useState } from "react";
import { ORDER_STATUSES, subscribeActive, type OrderSummary } from "@/lib/orders/ordersData";
import { formatMoney, type PricingSettings } from "@/lib/orders/pricing";
import { ErrorBox, Spinner, inputClass } from "../ui";
import { StatusBadge, formatDate, orderNo } from "./common";

type Props = {
  pricing: PricingSettings;
  onOpen: (id: string) => void;
  selection?: { selected: Set<string>; onToggle: (id: string) => void };
};

const startOfDay = (d: string) => new Date(`${d}T00:00:00`).getTime();
const endOfDay = (d: string) => new Date(`${d}T23:59:59.999`).getTime();

export default function ActiveOrders({ pricing, onOpen, selection }: Props) {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [material, setMaterial] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => subscribeActive(setOrders, (e) => setError(e.message)), []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    const q = search.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return orders
      .filter((o) => {
        if (status && o.status !== status) return false;
        if (material && o.stoneKey !== material) return false;
        if (from && o.createdAt < startOfDay(from)) return false;
        if (to && o.createdAt > endOfDay(to)) return false;
        if (!q) return true;
        return (
          o.clientName?.toLowerCase().includes(q) ||
          o.materialLabel?.toLowerCase().includes(q) ||
          (digits.length > 0 && (String(o.number).includes(digits) || o.clientPhone?.replace(/\D/g, "").includes(digits)))
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, search, status, material, from, to]);

  if (error) return <ErrorBox>Грешка: {error}</ErrorBox>;
  if (!orders) return <Spinner />;

  const hasFilters = !!(search || status || material || from || to);
  const stoneLabel = (k: string) => pricing.stones[k]?.label ?? k;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <input
          className={`${inputClass} lg:col-span-2`}
          placeholder="Търси клиент, телефон, № или материал…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Търсене"
        />
        <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Статус">
          <option value="">Всички статуси</option>
          {ORDER_STATUSES.filter((s) => s.active).map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
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
          {filtered.length} от {orders.length} поръчки
        </span>
        {hasFilters && (
          <button
            className="font-semibold text-darkGold hover:underline"
            onClick={() => {
              setSearch("");
              setStatus("");
              setMaterial("");
              setFrom("");
              setTo("");
            }}
          >
            Изчисти филтрите
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center text-gray-500 shadow-sm">
          {orders.length === 0 ? "Няма текущи поръчки. Създайте първата с „+ Нова поръчка“." : "Няма поръчки по тези критерии."}
        </div>
      ) : (
        <OrderList
          orders={filtered}
          onOpen={onOpen}
          stoneLabel={stoneLabel}
          dateOf={(o) => o.createdAt}
          dateLabel="Създадена"
          selection={selection}
        />
      )}
    </div>
  );
}

export function OrderList({
  orders,
  onOpen,
  stoneLabel,
  dateOf,
  dateLabel,
  selection,
}: {
  orders: OrderSummary[];
  onOpen: (id: string) => void;
  stoneLabel: (k: string) => string;
  dateOf: (o: OrderSummary) => number | undefined;
  dateLabel: string;
  selection?: { selected: Set<string>; onToggle: (id: string) => void };
}) {
  const allSelected = !!selection && orders.length > 0 && orders.every((o) => selection.selected.has(o.id));
  const toggleAll = () => {
    if (!selection) return;
    orders.forEach((o) => {
      const has = selection.selected.has(o.id);
      if (allSelected ? has : !has) selection.onToggle(o.id);
    });
  };

  return (
    <>
      {/* Cards on mobile */}
      <ul className="space-y-3 md:hidden">
        {orders.map((o) => (
          <li key={o.id} className="flex items-stretch gap-2">
            {selection && (
              <label className="flex items-center rounded-xl bg-white px-3 shadow-sm" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selection.selected.has(o.id)}
                  onChange={() => selection.onToggle(o.id)}
                  aria-label={`Избери поръчка ${orderNo(o.number)}`}
                />
              </label>
            )}
            <button onClick={() => onOpen(o.id)} className="w-full rounded-xl bg-white p-4 text-left shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-gray-500">{orderNo(o.number)}</span>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-1 font-semibold text-obsidian">{o.clientName}</p>
              <p className="text-sm text-gray-500">{o.materialLabel || stoneLabel(o.stoneKey)}</p>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-500">{formatDate(dateOf(o))}</span>
                <span className="font-semibold text-obsidian">{formatMoney(o.gross, o.currency)}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {/* Table on desktop */}
      <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              {selection && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Избери всички показани поръчки"
                  />
                </th>
              )}
              <th className="px-4 py-3">№</th>
              <th className="px-4 py-3">Клиент</th>
              <th className="px-4 py-3">Материал</th>
              <th className="px-4 py-3 text-center">Позиции</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">{dateLabel}</th>
              <th className="px-4 py-3 text-right">Сума с ДДС</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr key={o.id} onClick={() => onOpen(o.id)} className="cursor-pointer transition hover:bg-royalGold/10">
                {selection && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selection.selected.has(o.id)}
                      onChange={() => selection.onToggle(o.id)}
                      aria-label={`Избери поръчка ${orderNo(o.number)}`}
                    />
                  </td>
                )}
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{orderNo(o.number)}</td>
                <td className="px-4 py-3">
                  <button className="text-left font-semibold text-obsidian hover:text-darkGold"                   onClick={(e) => {
                                        e.stopPropagation();
                                        onOpen(o.id);
                                      }}
                                    >
                                      {o.clientName}
                  </button>
                  <div className="text-xs text-gray-500">{o.clientPhone}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{o.materialLabel || "—"}</div>
                  <div className="text-xs text-gray-500">{stoneLabel(o.stoneKey)}</div>
                </td>
                <td className="px-4 py-3 text-center">{o.positions}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDate(dateOf(o))}</td>
                <td className="px-4 py-3 text-right font-semibold text-obsidian">{formatMoney(o.gross, o.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
