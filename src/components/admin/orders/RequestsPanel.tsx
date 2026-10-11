"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { subscribePricing } from "@/lib/orders/ordersData";
import { formatMoney, formatNum, PRODUCT_TYPES, SIDES, type PricingSettings } from "@/lib/orders/pricing";
import { REQUEST_STATUSES, type OrderRequest } from "@/lib/orders/publicQuote";
import {
  approveRequest,
  deleteRequest,
  isUnread,
  markSeen,
  purgeExpired,
  rejectRequest,
  setCalculatorFlag,
  setRequestStatus,
  subscribeCalculatorFlag,
  subscribeRequests,
} from "@/lib/orders/requestsData";
import { ErrorBox, Modal, Spinner, Toast, dangerButton, inputClass, primaryButton, secondaryButton } from "../ui";

const statusOf = (s: string) => REQUEST_STATUSES.find((x) => x.key === s) ?? REQUEST_STATUSES[0];
const dateTime = (ms: number) => new Date(ms).toLocaleString("bg-BG", { dateStyle: "short", timeStyle: "short" });

export default function RequestsPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [requests, setRequests] = useState<OrderRequest[] | null>(null);
  const [pricing, setPricing] = useState<PricingSettings | null>(null);
  const [flag, setFlag] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const purged = useRef(false);

  useEffect(() => subscribeRequests(setRequests, (e) => setError(e.message)), []);
  useEffect(() => subscribePricing((p) => setPricing(p), (e) => setError(e.message)), []);
  useEffect(() => subscribeCalculatorFlag(setFlag, (e) => setError(e.message)), []);

  useEffect(() => {
    if (!requests || purged.current) return;
    purged.current = true;
    purgeExpired(requests).catch((e) => console.warn("purge failed", e));
  }, [requests]);

  const visible = useMemo(
    () => (requests ?? []).filter((r) => filter === "all" || r.status === "new" || r.status === "contacted"),
    [requests, filter]
  );
  const open = requests?.find((r) => r.id === openId) ?? null;

  const toggleFlag = async () => {
    try {
      await setCalculatorFlag(!flag);
      setToast(!flag ? "Калкулаторът е включен на сайта." : "Калкулаторът е изключен.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-obsidian">Запитвания от сайта</h2>
          <p className="text-sm text-gray-500">Заявки за оферта, изпратени от калкулатора на страницата на материала.</p>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm">
          <span className="text-gray-600">Калкулатор с цени на сайта (тест)</span>
          <button
            type="button"
            role="switch"
            aria-checked={!!flag}
            disabled={flag === null}
            onClick={toggleFlag}
            className={`relative h-6 w-11 rounded-full transition ${flag ? "bg-darkGold" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${flag ? "left-[22px]" : "left-0.5"}`} />
          </button>
          <span className={`font-semibold ${flag ? "text-darkGold" : "text-gray-400"}`}>{flag ? "Вкл." : "Изкл."}</span>
        </label>
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="flex gap-2">
        {(
          [
            ["open", "Отворени"],
            ["all", "Всички"],
          ] as const
        ).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={filter === k ? primaryButton : secondaryButton}>
            {l}
          </button>
        ))}
      </div>

      {!requests ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">Няма запитвания.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Клиент</th>
                <th className="px-4 py-3">Материал</th>
                <th className="px-4 py-3 text-right">Ориент. цена</th>
                <th className="px-4 py-3">Статус</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const st = statusOf(r.status);
                return (
                  <tr
                    key={r.id}
                    onClick={() => {
                      setOpenId(r.id);
                      markSeen(r).catch(() => undefined);
                    }}
                    className={`cursor-pointer border-t border-gray-100 hover:bg-amber-50 ${isUnread(r) ? "font-semibold" : ""}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      {isUnread(r) && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-sky-500" aria-label="Непрочетено" />}
                      {dateTime(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {r.client.name}
                      <span className="block text-xs font-normal text-gray-500">{r.client.phone}</span>
                    </td>
                    <td className="px-4 py-3">{r.material.label}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">{formatMoney(r.quote.gross, r.quote.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <RequestDetail
          request={open}
          pricing={pricing}
          onClose={() => setOpenId(null)}
          onToast={setToast}
          onOpenOrder={(id) => router.push(`${pathname}?tab=orders&order=${id}`)}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}

function RequestDetail({
  request: r,
  pricing,
  onClose,
  onToast,
  onOpenOrder,
}: {
  request: OrderRequest;
  pricing: PricingSettings | null;
  onClose: () => void;
  onToast: (m: string) => void;
  onOpenOrder: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка.");
    } finally {
      setBusy(false);
    }
  };

  const typeLabel = (k: string) => PRODUCT_TYPES.find((t) => t.key === k)?.label ?? k;
  const profileLabel = (k: string) => pricing?.profiles[k]?.label ?? k;
  const cutoutLabel = (k: string) => pricing?.cutouts[k]?.label ?? k;
  const serviceLabel = (k: string) => pricing?.services[k]?.label ?? k;
  const st = statusOf(r.status);
  const closed = r.status === "approved" || r.status === "rejected";

  const footer =
    r.status === "approved" && r.orderId ? (
        <button className={primaryButton} onClick={() => onOpenOrder(r.orderId!)}>
          Отвори поръчката
        </button>
      ) : r.status === "rejected" ? (
        <>
          <button className={dangerButton} disabled={busy} onClick={() => (confirmDelete ? run(async () => (await deleteRequest(r), onClose())) : setConfirmDelete(true))}>
            {confirmDelete ? "Потвърди изтриване" : "Изтрий"}
          </button>
          <button className={secondaryButton} disabled={busy} onClick={() => run(async () => (await setRequestStatus(r, "new"), onToast("Запитването е отворено отново.")))}>
            Отвори отново
          </button>
        </>
      ) : rejecting ? (
        <>
          <button className={secondaryButton} disabled={busy} onClick={() => setRejecting(false)}>
            Назад
          </button>
          <button className={dangerButton} disabled={busy} onClick={() => run(async () => (await rejectRequest(r, reason), onToast("Запитването е отказано."), onClose()))}>
            Потвърди отказ
          </button>
        </>
      ) : (
        <>
          <button className={dangerButton} disabled={busy} onClick={() => setRejecting(true)}>
            Откажи
          </button>
          {r.status === "new" && (
            <button className={secondaryButton} disabled={busy} onClick={() => run(async () => (await setRequestStatus(r, "contacted"), onToast("Отбелязано като свързан.")))}>
              Свързах се
            </button>
          )}
          <button
            className={primaryButton}
            disabled={busy || !pricing}
            onClick={() =>
              run(async () => {
                const id = await approveRequest(r, pricing!);
                onToast("Създадена е поръчка в статус „Запитване“.");
                onOpenOrder(id);
              })
            }
          >
            {busy ? "Обработка…" : "Одобри → поръчка"}
          </button>
        </>
      );

  return (
    <Modal wide title={`Запитване от ${r.client.name}`} onClose={onClose} footer={footer}>
      <div className="space-y-5 text-sm">
        {error && <ErrorBox>{error}</ErrorBox>}
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
          <span className="text-gray-500">Получено {dateTime(r.createdAt)}</span>
          {closed && r.closedAt && <span className="text-gray-500">· Затворено {dateTime(r.closedAt)}</span>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">Клиент</p>
            <p className="font-semibold text-obsidian">{r.client.name}</p>
            <a href={`tel:${r.client.phone.replace(/[^\d+]/g, "")}`} className="block text-darkGold hover:underline">
              {r.client.phone}
            </a>
            {r.client.email && (
              <a href={`mailto:${r.client.email}`} className="block text-darkGold hover:underline">
                {r.client.email}
              </a>
            )}
            <p className="mt-2 text-xs text-gray-400">Съгласие за лични данни: {dateTime(r.consentAt)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">Ориентировъчна цена (показана на клиента)</p>
            <p className="text-2xl font-semibold text-obsidian">{formatMoney(r.quote.gross, r.quote.currency)}</p>
            <p className="text-xs text-gray-500">
              без ДДС {formatMoney(r.quote.net, r.quote.currency)} · {formatNum(r.quote.areaM2, 3)} м² · {r.material.label}
              {r.materialPriceM2 ? ` (${r.materialPriceM2} €/м²)` : " (цена по вид камък)"}
            </p>
          </div>
        </div>

        {r.note && (
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">Бележка</p>
            <p className="whitespace-pre-wrap rounded-lg border border-gray-200 p-3">{r.note}</p>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">Елементи</p>
          <ol className="space-y-2">
            {r.positions.map((p, i) => {
              const edges = SIDES.filter((s) => p.edges?.[s.key]?.profile).map((s) => `${s.short}: ${profileLabel(p.edges![s.key]!.profile)}`);
              const cutouts = Object.entries(p.cutouts ?? {})
                .filter(([, c]) => c > 0)
                .map(([k, c]) => `${cutoutLabel(k)} ×${c}`);
              return (
                <li key={p.id ?? i} className="rounded-lg border border-gray-200 p-3">
                  <p className="font-semibold text-obsidian">
                    {i + 1}. {typeLabel(p.type)} {p.lengthCm}×{p.depthCm} см, {p.thicknessCm} см – {p.qty} бр.
                  </p>
                  {edges.length > 0 && <p className="text-xs text-gray-600">Обработка: {edges.join("; ")}</p>}
                  {cutouts.length > 0 && <p className="text-xs text-gray-600">Отвори: {cutouts.join("; ")}</p>}
                </li>
              );
            })}
          </ol>
        </div>

        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">Услуги</p>
          <p>{r.serviceKeys.length ? r.serviceKeys.map(serviceLabel).join(", ") : "—"}</p>
        </div>

        {r.status === "rejected" && r.rejectReason && <p className="text-gray-600">Причина за отказ: {r.rejectReason}</p>}

        {rejecting && (
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">Причина (по желание)</p>
            <textarea className={inputClass} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            <p className="mt-1 text-xs text-gray-400">Отказаните запитвания се изтриват автоматично след 90 дни.</p>
          </div>
        )}

        {!closed && (
          <p className="text-xs text-gray-400">
            „Одобри“ създава поръчка в статус „Запитване“ по текущия ценоразпис – прегледайте я и я превърнете в оферта.
          </p>
        )}
      </div>
    </Modal>
  );
}
