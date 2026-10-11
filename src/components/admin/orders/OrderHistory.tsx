"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchHistoryPage, type OrderSummary } from "@/lib/orders/ordersData";
import { type PricingSettings } from "@/lib/orders/pricing";
import { ErrorBox, Spinner, inputClass, secondaryButton } from "../ui";
import { OrderList } from "./ActiveOrders";

type Props = { pricing: PricingSettings; onOpen: (id: string) => void };

// History is fetched page by page (never a full-tree subscription); search filters the pages loaded so far.
export default function OrderHistory({ pricing, onOpen }: Props) {
  const [items, setItems] = useState<OrderSummary[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async (cursor?: OrderSummary) => {
    setError("");
    try {
      const page = await fetchHistoryPage(cursor?.closedAt ? { closedAt: cursor.closedAt, id: cursor.id } : undefined);
      setItems((prev) => {
        const seen = new Set((cursor ? prev ?? [] : []).map((o) => o.id));
        return [...(cursor ? prev ?? [] : []), ...page.items.filter((o) => !seen.has(o.id))];
      });
      setHasMore(page.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setItems((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!items && !error) return <Spinner />;

  const q = search.trim().toLowerCase();
  const digits = q.replace(/\D/g, "");
  const visible = (items ?? []).filter(
    (o) =>
      (!status || o.status === status) &&
      (!q ||
        o.clientName?.toLowerCase().includes(q) ||
        o.materialLabel?.toLowerCase().includes(q) ||
        (digits.length > 0 && (String(o.number).includes(digits) || o.clientPhone?.replace(/\D/g, "").includes(digits))))
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3">
        <input
          className={`${inputClass} sm:col-span-2`}
          placeholder="Търси в заредените поръчки…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Търсене в историята"
        />
        <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Статус">
          <option value="">Всички приключени</option>
          <option value="issued">Издадени</option>
          <option value="delivered">Доставени</option>
          <option value="installed">Монтирани</option>
          <option value="cancelled">Отказани</option>
        </select>
      </div>
      {error && <ErrorBox>Грешка при зареждане на историята: {error}</ErrorBox>}
      {visible.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center text-gray-500 shadow-sm">
          {items?.length ? "Няма поръчки по тези критерии в заредените страници." : "Още няма приключени поръчки."}
        </div>
      ) : (
        <OrderList
          orders={visible}
          onOpen={onOpen}
          stoneLabel={(k) => pricing.stones[k]?.label ?? k}
          dateOf={(o) => o.closedAt}
          dateLabel="Приключена"
        />
      )}
      {hasMore && (
        <div className="text-center">
          <button
            className={secondaryButton}
            disabled={loadingMore}
            onClick={async () => {
              setLoadingMore(true);
              await load(items?.[items.length - 1]);
              setLoadingMore(false);
            }}
          >
            {loadingMore ? "Зареждане…" : "Зареди още"}
          </button>
        </div>
      )}
    </div>
  );
}
