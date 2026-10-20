import { get, onValue, ref, update, type Unsubscribe } from "firebase/database";
import { db } from "@/lib/firebase";
import { formatMoney, type Position, type PricingSettings } from "./pricing";
import { newId, saveOrder, type OrderDraft } from "./ordersData";
import { CALCULATOR_FLAG_PATH, deriveServices, REJECTED_RETENTION_MS, type OrderRequest, type RequestStatus } from "./publicQuote";

const FLAG_PATH = CALCULATOR_FLAG_PATH;
const RATE_LIMIT_TTL_MS = 24 * 60 * 60 * 1000;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
const list = <T,>(v: unknown): T[] => (v ? (Array.isArray(v) ? v : Object.values(v as object)).filter(Boolean) : []) as T[];

function toRequest(id: string, raw: unknown): OrderRequest | null {
  if (!isObj(raw)) return null;
  const r = raw as unknown as OrderRequest;
  return {
    ...r,
    id,
    positions: list<Position>(r.positions).map((p) => ({ ...p, edges: p.edges ?? {}, drip: p.drip ?? {}, cutouts: p.cutouts ?? {}, extras: [] })),
    serviceKeys: list<string>(r.serviceKeys),
  };
}

export function subscribeRequests(cb: (list: OrderRequest[]) => void, onError: (e: Error) => void): Unsubscribe {
  return onValue(
    ref(db, "order_requests"),
    (snap) => {
      const out: OrderRequest[] = [];
      snap.forEach((child) => {
        const r = toRequest(child.key as string, child.val());
        if (r) out.push(r);
      });
      cb(out.sort((a, b) => b.createdAt - a.createdAt));
    },
    onError
  );
}

export const isUnread = (r: OrderRequest) => r.status === "new" && !r.seenAt;

export function subscribeCalculatorFlag(cb: (on: boolean) => void, onError: (e: Error) => void): Unsubscribe {
  return onValue(ref(db, FLAG_PATH), (snap) => cb(snap.val() === true), onError);
}

export async function setCalculatorFlag(on: boolean) {
  await update(ref(db), { [FLAG_PATH]: on });
}

export async function markSeen(r: OrderRequest) {
  if (r.seenAt) return;
  await update(ref(db, `order_requests/${r.id}`), { seenAt: Date.now() });
}

export async function setRequestStatus(r: OrderRequest, status: Extract<RequestStatus, "new" | "contacted">) {
  await update(ref(db, `order_requests/${r.id}`), { status, updatedAt: Date.now(), closedAt: null, rejectReason: null });
}

export async function rejectRequest(r: OrderRequest, reason: string) {
  const now = Date.now();
  await update(ref(db, `order_requests/${r.id}`), { status: "rejected", rejectReason: reason.trim() || null, updatedAt: now, closedAt: now });
}

export async function deleteRequest(r: OrderRequest) {
  await update(ref(db), { [`order_requests/${r.id}`]: null });
}

// Turns the request into an order in status "Оферта" using today's price list; the admin then reviews and confirms it.
export async function approveRequest(r: OrderRequest, pricing: PricingSettings): Promise<string> {
  if (r.status === "approved" && r.orderId) return r.orderId;
  const positions: Position[] = r.positions.map((p, i) => ({ ...structuredClone(p), id: newId(), sort: i, impregnated: p.impregnated !== false }));
  const services = deriveServices(r.serviceKeys, positions, pricing, () => newId());
  const created = new Date(r.createdAt).toLocaleString("bg-BG");
  const notes = [
    `Запитване от сайта (${created}). Ориентировъчна цена към клиента: ${formatMoney(r.quote.gross, r.quote.currency)} с ДДС.`,
    r.note ? `Бележка от клиента: ${r.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const draft: OrderDraft = {
    status: "quoted",
    client: { name: r.client.name, phone: r.client.phone, email: r.client.email, address: "" },
    material: { ...r.material },
    stoneKey: r.stoneKey,
    materialPriceM2: r.materialPriceM2 ?? null,
    positions,
    services,
    discountPct: 0,
    notes,
    pricing,
  };
  const order = await saveOrder(draft);
  const now = Date.now();
  await update(ref(db, `order_requests/${r.id}`), { status: "approved", orderId: order.id, updatedAt: now, closedAt: now });
  return order.id;
}

// Housekeeping on panel open: rejected requests expire after 90 days, rate-limit counters after a day.
export async function purgeExpired(requests: OrderRequest[]) {
  const now = Date.now();
  const updates: Record<string, null> = {};
  for (const r of requests) {
    if (r.status === "rejected" && (r.closedAt ?? r.updatedAt) < now - REJECTED_RETENTION_MS) updates[`order_requests/${r.id}`] = null;
  }
  const limits = (await get(ref(db, "rate_limits"))).val() as Record<string, Record<string, { start: number }>> | null;
  for (const [kind, entries] of Object.entries(limits ?? {})) {
    for (const [hash, v] of Object.entries(entries ?? {})) {
      if (!v || now - Number(v.start) > RATE_LIMIT_TTL_MS) updates[`rate_limits/${kind}/${hash}`] = null;
    }
  }
  if (Object.keys(updates).length) await update(ref(db), updates);
}
