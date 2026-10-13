"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { onValue, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import { toGroupEntries, type GroupEntry } from "@/lib/adminData";
import { subscribeDocumentSettings, subscribePricing, type OrderDraft } from "@/lib/orders/ordersData";
import { type DocumentSettings } from "@/lib/orders/documents";
import { type PricingSettings } from "@/lib/orders/pricing";
import { ErrorBox, Spinner, Toast, primaryButton, secondaryButton } from "../ui";
import ActiveOrders from "./ActiveOrders";
import DocumentSettingsForm from "./DocumentSettingsForm";
import OrderHistory from "./OrderHistory";
import OrderEditor from "./OrderEditor";
import PricingSettingsForm from "./PricingSettingsForm";
import CutlistPanel from "./CutlistPanel";

export default function OrdersPanel() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const view = params.get("view") === "history" ? "history" : "active";
  const orderId = params.get("order");

  const [pricing, setPricing] = useState<PricingSettings | null>(null);
  const [pricingStored, setPricingStored] = useState(true);
  const [groups, setGroups] = useState<GroupEntry[] | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showPricing, setShowPricing] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [docSettings, setDocSettings] = useState<DocumentSettings | null>(null);
  const [template, setTemplate] = useState<OrderDraft | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => subscribeDocumentSettings(setDocSettings, (e) => setError(e.message)), []);

  useEffect(
    () =>
      subscribePricing(
        (p, stored) => {
          setPricing(p);
          setPricingStored(stored);
        },
        (e) => setError(e.message)
      ),
    []
  );
  useEffect(
    () =>
      onValue(
        ref(db, "group_materials"),
        (snap) => setGroups(toGroupEntries(snap.val())),
        (e) => setError(e.message)
      ),
    []
  );

  const navigate = useCallback(
    (next: { view?: string; order?: string | null }) => {
      const sp = new URLSearchParams(params.toString());
      sp.set("tab", "orders");
      if (next.view !== undefined) {
        if (next.view === "history") sp.set("view", "history");
        else sp.delete("view");
      }
      if (next.order === null) sp.delete("order");
      else if (next.order) sp.set("order", next.order);
      router.push(`${pathname}?${sp.toString()}`);
    },
    [params, pathname, router]
  );

  const clearToast = useCallback(() => setToast(""), []);

  const toggleSelected = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const startCutlist = useCallback(() => {
    const sp = new URLSearchParams(params.toString());
    sp.set("tab", "orders");
    sp.delete("view");
    sp.delete("order");
    sp.set("cutlist", "1");
    sp.set("orders", [...selected].join(","));
    router.push(`${pathname}?${sp.toString()}`);
  }, [params, pathname, router, selected]);

  if (error) return <ErrorBox>Грешка при зареждане: {error}</ErrorBox>;
  if (!pricing || !groups) return <Spinner label="Зареждане на поръчките…" />;

  const cutlistOrderIds = (params.get("orders") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const showCutlist = params.get("cutlist") === "1" && cutlistOrderIds.length > 0;

  const closeCutlist = () => {
    const sp = new URLSearchParams(params.toString());
    sp.delete("cutlist");
    sp.delete("orders");
    router.push(`${pathname}?${sp.toString()}`);
  };

  const content = showCutlist ? (
    <CutlistPanel
      orderIds={cutlistOrderIds}
      pricing={pricing}
      groups={groups}
      onClose={closeCutlist}
      onToast={setToast}
    />
  ) : orderId ? (
    <OrderEditor
      key={orderId + (template ? ":tpl" : "")}
      orderId={orderId === "new" ? null : orderId}
      template={orderId === "new" ? template : null}
      pricing={pricing}
      groups={groups}
      onClose={() => {
        setTemplate(null);
        navigate({ order: null });
      }}
      onSaved={(id, msg) => {
        setToast(msg);
        setTemplate(null);
        navigate({ order: id });
      }}
      onDuplicate={(draft) => {
        setTemplate(draft);
        navigate({ view: "active", order: "new" });
        setToast("Копие е създадено – прегледайте и запазете.");
      }}
      onToast={setToast}
    />
  ) : (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-darkGold">Поръчки</p>
          <h1 className="text-3xl font-bold text-obsidian">{view === "history" ? "История" : "Текущи поръчки"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex overflow-hidden rounded-lg border border-darkGold text-sm font-semibold">
            {(["active", "history"] as const).map((v) => (
              <button
                key={v}
                onClick={() => navigate({ view: v })}
                className={`px-4 py-2 transition ${view === v ? "bg-darkGold text-white" : "text-darkGold hover:bg-darkGold/10"}`}
              >
                {v === "active" ? "Текущи" : "История"}
              </button>
            ))}
          </div>
          <button className={secondaryButton} onClick={() => setShowPricing(true)}>
            ⚙ Ценоразпис
          </button>
          <button className={secondaryButton} onClick={() => setShowDocs(true)} disabled={!docSettings}>
            ⚙ Документи и условия
          </button>
          {selected.size > 0 && (
            <button className={primaryButton} onClick={startCutlist}>
              ✂ Създай разкрой ({selected.size})
            </button>
          )}
          <button
            className={primaryButton}
            onClick={() => {
              setTemplate(null);
              navigate({ order: "new" });
            }}
          >
            + Нова поръчка
          </button>
        </div>
      </div>
      {!pricingStored && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Ценоразписът още не е записан в базата – използват се примерните цени.{" "}
          <button className="font-semibold underline" onClick={() => setShowPricing(true)}>
            Прегледай и запази
          </button>
        </p>
      )}
      {view === "history" ? (
        <OrderHistory pricing={pricing} onOpen={(id) => navigate({ order: id })} />
      ) : (
        <ActiveOrders
          pricing={pricing}
          onOpen={(id) => navigate({ order: id })}
          selection={{ selected, onToggle: toggleSelected }}
        />
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {content}
      {showPricing && (
        <PricingSettingsForm
          pricing={pricing}
          groups={groups}
          onClose={() => setShowPricing(false)}
          onSaved={() => {
            setShowPricing(false);
            setToast("Ценоразписът е запазен.");
          }}
        />
      )}
      {showDocs && docSettings && (
        <DocumentSettingsForm
          settings={docSettings}
          onClose={() => setShowDocs(false)}
          onSaved={() => {
            setShowDocs(false);
            setToast("Документите и условията са запазени.");
          }}
        />
      )}
      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}
