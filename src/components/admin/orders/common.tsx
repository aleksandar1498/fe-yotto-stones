"use client";

import { statusInfo } from "@/lib/orders/ordersData";

export function StatusBadge({ status }: { status: string }) {
  const s = statusInfo(status);
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.color}`}>{s.label}</span>;
}

export const formatDate = (ts?: number) =>
  ts ? new Intl.DateTimeFormat("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric" }).format(ts) : "—";

export const formatDateTime = (ts?: number) =>
  ts
    ? new Intl.DateTimeFormat("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(ts)
    : "—";

export const orderNo = (n?: number) => (n ? `№ ${String(n).padStart(4, "0")}` : "Нова");
