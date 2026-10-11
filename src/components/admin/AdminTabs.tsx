"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminDashboard from "./AdminDashboard";
import OrdersPanel from "./orders/OrdersPanel";
import RequestsPanel from "./orders/RequestsPanel";
import { isUnread, subscribeRequests } from "@/lib/orders/requestsData";

const TABS = [
  { key: "catalogue", label: "Каталог" },
  { key: "orders", label: "Поръчки" },
  { key: "requests", label: "Запитвания" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminTabs() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("tab");
  const tab: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : "catalogue";
  const [unread, setUnread] = useState(0);

  useEffect(
    () =>
      subscribeRequests(
        (list) => setUnread(list.filter(isUnread).length),
        () => setUnread(0)
      ),
    []
  );

  return (
    <div className="space-y-6">
      <nav className="flex gap-1 border-b border-gray-200" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => router.push(t.key === "catalogue" ? pathname : `${pathname}?tab=${t.key}`)}
            className={`-mb-px border-b-2 px-5 py-3 text-sm font-semibold uppercase tracking-wider transition ${
              tab === t.key ? "border-darkGold text-darkGold" : "border-transparent text-gray-500 hover:text-obsidian"
            }`}
          >
            {t.label}
            {t.key === "requests" && unread > 0 && (
              <span className="ml-2 rounded-full bg-sky-600 px-2 py-0.5 text-xs font-bold text-white" aria-label={`${unread} нови`}>
                {unread}
              </span>
            )}
          </button>
        ))}
      </nav>
      {tab === "orders" ? <OrdersPanel /> : tab === "requests" ? <RequestsPanel /> : <AdminDashboard />}
    </div>
  );
}
