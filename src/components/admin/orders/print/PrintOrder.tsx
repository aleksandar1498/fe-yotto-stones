"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { get, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import { toList, type Material } from "@/lib/adminData";
import { quoteFor, subscribeDocumentSettings, subscribeOrder, type Order } from "@/lib/orders/ordersData";
import { docNumber, isOffer, type DocumentSettings } from "@/lib/orders/documents";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { ErrorBox, Spinner } from "../../ui";
import ClientDocument from "./ClientDocument";
import InternalDocument from "./InternalDocument";

export type DocType = "client" | "internal";

const PRINT_CSS = `
@page { size: A4; margin: 12mm; }
.doc-label { font-size: 7.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: .2em; color: #7d6741; }
.doc-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: .18em; color: #0A0A0A; }
.doc-sheet, .doc-sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media print {
  html, body { background: #fff !important; }
  .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  thead { display: table-header-group; }
}
`;

const slug = (s: string) => s.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");

export default function PrintOrder() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { user } = useAdminAuth();
  const type: DocType = search.get("type") === "internal" ? "internal" : "client";
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [materialImage, setMaterialImage] = useState<string>();
  const [settings, setSettings] = useState<DocumentSettings>();

  useEffect(() => subscribeOrder(id, setOrder, (e) => setError(e.message)), [id]);
  useEffect(() => subscribeDocumentSettings(setSettings, (e) => setError(e.message)), []);

  const groupKey = order?.material.groupKey;
  const materialId = order?.material.materialId;
  useEffect(() => {
    if (!groupKey || materialId == null) return;
    let cancelled = false;
    get(ref(db, `group_materials/${groupKey}/materials`))
      .then((snap) => {
        const m = toList<Material>(snap.val()).find((x) => x.id === materialId);
        if (!cancelled) setMaterialImage(m?.imageUrl);
        return m;
      })
      .catch(() => undefined); // the image is decorative; the document is complete without it
    return () => {
      cancelled = true;
    };
  }, [groupKey, materialId]);

  const quote = useMemo(() => (order ? quoteFor(order) : null), [order]);

  useEffect(() => {
    if (!order) return;
    const kind = type === "internal" ? "Вътрешен" : isOffer(order.status) ? "Оферта" : "Поръчка";
    document.title = `${kind}-${docNumber(order.number)}-${slug(order.client.name || "клиент")}`;
  }, [order, type]);

  const setType = (t: DocType) => router.replace(`/admin/print/${id}?type=${t}`);
  const tab = (t: DocType, label: string) => (
    <button
      onClick={() => setType(t)}
      className={`rounded-md px-3 py-1.5 text-sm transition ${type === t ? "bg-royalGold text-obsidian" : "text-platinum hover:bg-white/10"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-200 print:bg-white">
      <style>{PRINT_CSS}</style>
      <div className="sticky top-0 z-10 bg-obsidian text-platinum shadow print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin?tab=orders" className="text-sm text-royalGold hover:underline">
            ← Към поръчките
          </Link>
          <div className="flex gap-1 rounded-lg bg-white/5 p-1">
            {tab("client", "За клиента")}
            {tab("internal", "Вътрешен")}
          </div>
          <button
            onClick={() => window.print()}
            disabled={!order || !settings}
            className="rounded-lg bg-royalGold px-4 py-1.5 text-sm font-semibold text-obsidian transition hover:bg-darkGold hover:text-white disabled:opacity-50"
          >
            Изтегли PDF
          </button>
        </div>
        <p className="pb-2 text-center text-xs text-neutral-400">
          В прозореца за печат изберете „Запиши като PDF“, размер A4 и включени „Графики на фона“.
        </p>
      </div>

      <div className="px-4 py-8 print:p-0">
        {error ? (
          <div className="mx-auto max-w-xl">
            <ErrorBox>{error}</ErrorBox>
          </div>
        ) : order === undefined || !settings ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : order === null || !quote ? (
          <div className="mx-auto max-w-xl">
            <ErrorBox>Поръчката не е намерена.</ErrorBox>
          </div>
        ) : (
          <div className="doc-sheet mx-auto w-[210mm] max-w-full bg-white p-[12mm] shadow-xl print:w-auto print:p-0 print:shadow-none">
            {type === "internal" ? (
              <InternalDocument order={order} quote={quote} settings={settings} generatedBy={user?.email ?? undefined} />
            ) : (
              <ClientDocument order={order} quote={quote} settings={settings} materialImage={materialImage} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
