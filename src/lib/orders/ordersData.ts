import {
  endBefore,
  get,
  limitToLast,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  runTransaction,
  update,
  type Unsubscribe,
} from "firebase/database";
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { slugify } from "@/lib/adminData";
import {
  quoteOrder,
  withDefaults,
  type OrderQuote,
  type OrderService,
  type Position,
  type PricingSettings,
} from "./pricing";
import { withDocumentDefaults, type DocumentSettings } from "./documents";

export const ORDER_STATUSES = [
  { key: "quoted", label: "Оферта", active: true, color: "bg-indigo-100 text-indigo-800" },
  { key: "confirmed", label: "Потвърдена", active: true, color: "bg-amber-100 text-amber-800" },
  { key: "production", label: "В производство", active: true, color: "bg-orange-100 text-orange-800" },
  { key: "ready", label: "Готова", active: true, color: "bg-lime-100 text-lime-800" },
  { key: "issued", label: "Издадена", active: false, color: "bg-emerald-100 text-emerald-800" },
  { key: "delivered", label: "Доставена", active: false, color: "bg-emerald-100 text-emerald-800" },
  { key: "installed", label: "Монтирана", active: false, color: "bg-emerald-100 text-emerald-800" },
  { key: "cancelled", label: "Отказана", active: false, color: "bg-gray-200 text-gray-700" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["key"];

export const statusInfo = (s: string) => ORDER_STATUSES.find((x) => x.key === s) ?? ORDER_STATUSES[0];
export const isActiveStatus = (s: string) => statusInfo(s).active;

// Forward path of the workflow; any active order may also be cancelled, and steps can be undone.
const FLOW: OrderStatus[] = ["quoted", "confirmed", "production", "ready"];
export function nextStatuses(s: OrderStatus): OrderStatus[] {
  if (s === "ready") return ["issued", "delivered", "installed", "cancelled"];
  const i = FLOW.indexOf(s);
  if (i === -1) return [];
  return [FLOW[i + 1], "cancelled"];
}
export function previousStatus(s: OrderStatus): OrderStatus | undefined {
  const i = FLOW.indexOf(s);
  return i > 0 ? FLOW[i - 1] : undefined;
}

export type Client = { name: string; phone: string; email?: string; address?: string };
export type MaterialRef = { groupKey?: string; groupId?: number; materialId?: number; label: string };

// One material in the order with its own price category / €/m²; positions point to it through sectionId.
export type MaterialSection = { id: string; sort: number; material: MaterialRef; stoneKey: string; materialPriceM2?: number | null };

// Per-order wording of the client document; empty/undefined fields fall back to the generated defaults.
export type DocOverrides = { leadTime?: string; leadTimeNote?: string; included?: string[] };

export type Attachment = {
  id: string;
  name: string;
  path: string;
  url: string;
  contentType: string;
  size: number;
  positionId?: string;
  uploadedAt: number;
};

export type StatusLogEntry = { status: OrderStatus; at: number; by?: string };

export type OrderTotals = { net: number; vat: number; gross: number; areaM2: number; currency: string };

export type Order = {
  id: string;
  number: number;
  status: OrderStatus;
  client: Client;
  material: MaterialRef; // mirrors sections[0] (legacy single-material shape, summaries, filters)
  stoneKey: string;
  materialPriceM2?: number | null;
  sections: MaterialSection[];
  positions: Position[];
  services: OrderService[];
  discountPct: number;
  notes?: string;
  dueDate?: string;
  doc?: DocOverrides;
  pricing: PricingSettings;
  totals: OrderTotals;
  attachments: Attachment[];
  statusLog: StatusLogEntry[];
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
};

export type OrderSummary = {
  id: string;
  number: number;
  status: OrderStatus;
  clientName: string;
  clientPhone: string;
  materialLabel: string;
  stoneKey: string;
  materialGroupId?: number;
  materialId?: number;
  positions: number;
  gross: number;
  currency: string;
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
};

export type OrderDraft = Omit<Order, "id" | "number" | "attachments" | "statusLog" | "createdAt" | "updatedAt" | "totals" | "sections"> & {
  id?: string;
  number?: number;
  createdAt?: number;
  sections?: MaterialSection[];
};

const LEGACY_SECTION_ID = "main";

// Old orders / request conversions have no sections – derive one from the top-level material fields.
export function ensureSections(d: Pick<OrderDraft, "sections" | "material" | "stoneKey" | "materialPriceM2">): MaterialSection[] {
  if (d.sections?.length) return [...d.sections].sort((a, b) => a.sort - b.sort);
  return [{ id: LEGACY_SECTION_ID, sort: 0, material: d.material ?? { label: "" }, stoneKey: d.stoneKey, materialPriceM2: d.materialPriceM2 ?? null }];
}

export const sectionLabel = (s: MaterialSection, pricing: PricingSettings) =>
  s.material.label || pricing.stones[s.stoneKey]?.label || "Материал";

export const materialsLabel = (sections: MaterialSection[], pricing: PricingSettings) =>
  sections.map((s) => sectionLabel(s, pricing)).join(" + ");

export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
export const HISTORY_PAGE = 20;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";

// Strip undefined recursively – RTDB rejects it.
function prune<T>(value: T): T {
  if (Array.isArray(value)) return value.map(prune) as T;
  if (!isObj(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = prune(v);
  return out as T;
}

// Positions/services are stored as maps keyed by id (stable under concurrent edits); UI works with sorted arrays.
function mapToList<T extends { id: string }>(value: unknown): T[] {
  if (!isObj(value)) return [];
  return Object.entries(value)
    .filter(([, v]) => isObj(v))
    .map(([id, v]) => ({ ...(v as object), id }) as T);
}
const listToMap = <T extends { id: string }>(list: T[]) =>
  Object.fromEntries(list.map(({ id, ...rest }) => [id, prune(rest)]));

function normalizePosition(p: Position): Position {
  return {
    ...p,
    edges: p.edges ?? {},
    drip: p.drip ?? {},
    cutouts: p.cutouts ?? {},
    extras: Array.isArray(p.extras) ? p.extras.filter(Boolean) : (Object.values((p.extras as unknown as object) ?? {}) as Position["extras"]),
  };
}

export function toOrder(id: string, raw: unknown): Order | null {
  if (!isObj(raw)) return null;
  const r = raw as Record<string, unknown>;
  const material = (r.material as MaterialRef) ?? { label: "" };
  const sections = ensureSections({
    sections: mapToList<MaterialSection>(r.sections).map((s) => ({ ...s, material: s.material ?? { label: "" } })),
    material,
    stoneKey: r.stoneKey as string,
    materialPriceM2: (r.materialPriceM2 as number) ?? null,
  });
  const ids = new Set(sections.map((s) => s.id));
  const doc = isObj(r.doc) ? (r.doc as DocOverrides) : undefined;
  return {
    ...(r as unknown as Order),
    id,
    client: (r.client as Client) ?? { name: "", phone: "" },
    material,
    sections,
    positions: mapToList<Position>(r.positions)
      .map(normalizePosition)
      .map((p) => (p.sectionId && ids.has(p.sectionId) ? p : { ...p, sectionId: sections[0].id }))
      .sort((a, b) => a.sort - b.sort),
    services: mapToList<OrderService>(r.services),
    doc: doc ? { ...doc, included: doc.included ? (Object.values(doc.included) as string[]) : undefined } : undefined,
    pricing: withDefaults(r.pricing as PricingSettings),
    attachments: mapToList<Attachment>(r.attachments).sort((a, b) => a.uploadedAt - b.uploadedAt),
    statusLog: Object.values((r.statusLog as Record<string, StatusLogEntry>) ?? {}).sort((a, b) => a.at - b.at),
    discountPct: Number(r.discountPct) || 0,
  };
}

function toSummaries(value: unknown): OrderSummary[] {
  if (!isObj(value)) return [];
  return Object.entries(value).map(([id, v]) => ({ ...(v as OrderSummary), id }));
}

export function newId(): string {
  return push(ref(db, "orders")).key as string;
}

export function quoteFor(
  o: Pick<OrderDraft, "positions" | "services" | "stoneKey" | "materialPriceM2" | "discountPct" | "pricing" | "sections" | "material">
): OrderQuote {
  return quoteOrder({
    positions: o.positions,
    services: o.services,
    stoneKey: o.stoneKey,
    materialPriceM2: o.materialPriceM2,
    sections: ensureSections(o).map((s) => ({ id: s.id, stoneKey: s.stoneKey, materialPriceM2: s.materialPriceM2 })),
    discountPct: o.discountPct,
    pricing: o.pricing,
  });
}

function summaryOf(o: Order): Omit<OrderSummary, "id"> {
  return prune({
    number: o.number,
    status: o.status,
    clientName: o.client.name,
    clientPhone: o.client.phone,
    materialLabel: o.sections.length > 1 ? materialsLabel(o.sections, o.pricing) : o.material.label,
    stoneKey: o.stoneKey,
    materialGroupId: o.material.groupId,
    materialId: o.material.materialId,
    positions: o.positions.length,
    gross: o.totals.gross,
    currency: o.totals.currency,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    closedAt: o.closedAt,
  });
}

// Summary lives in exactly one of orders_active / orders_history; both paths are written in the same atomic update.
function summaryPaths(o: Order): Record<string, unknown> {
  const active = isActiveStatus(o.status);
  return {
    [`orders_active/${o.id}`]: active ? summaryOf(o) : null,
    [`orders_history/${o.id}`]: active ? null : summaryOf(o),
  };
}

// ---------- pricing settings ----------

export function subscribePricing(cb: (p: PricingSettings, stored: boolean) => void, onError: (e: Error) => void): Unsubscribe {
  return onValue(
    ref(db, "pricing"),
    (snap) => cb(withDefaults(snap.val()), snap.exists()),
    onError
  );
}

export async function savePricing(p: PricingSettings) {
  await update(ref(db), { pricing: prune({ ...p, updatedAt: Date.now() }) });
}

// ---------- document settings (company details + contract terms for the printable documents) ----------

export function subscribeDocumentSettings(
  cb: (s: DocumentSettings, stored: boolean) => void,
  onError: (e: Error) => void
): Unsubscribe {
  return onValue(
    ref(db, "document_settings"),
    (snap) => cb(withDocumentDefaults(snap.val()), snap.exists()),
    onError
  );
}

export async function saveDocumentSettings(s: DocumentSettings) {
  await update(ref(db), { document_settings: prune({ ...s, updatedAt: Date.now() }) });
}

// ---------- orders ----------

export function subscribeActive(cb: (list: OrderSummary[]) => void, onError: (e: Error) => void): Unsubscribe {
  return onValue(ref(db, "orders_active"), (snap) => cb(toSummaries(snap.val())), onError);
}

// History is paged newest-first by closedAt; pass the oldest item of the previous page as cursor.
export async function fetchHistoryPage(cursor?: { closedAt: number; id: string }) {
  const constraints = cursor
    ? [orderByChild("closedAt"), endBefore(cursor.closedAt, cursor.id), limitToLast(HISTORY_PAGE)]
    : [orderByChild("closedAt"), limitToLast(HISTORY_PAGE)];
  const snap = await get(query(ref(db, "orders_history"), ...constraints));
  const items: OrderSummary[] = [];
  snap.forEach((child) => {
    items.push({ ...(child.val() as OrderSummary), id: child.key as string });
  });
  items.reverse();
  return { items, hasMore: items.length === HISTORY_PAGE };
}

export function subscribeOrder(id: string, cb: (o: Order | null) => void, onError: (e: Error) => void): Unsubscribe {
  return onValue(ref(db, `orders/${id}`), (snap) => cb(toOrder(id, snap.val())), onError);
}

async function nextOrderNumber(): Promise<number> {
  const res = await runTransaction(ref(db, "order_counter"), (n) => (Number(n) || 0) + 1);
  if (!res.committed) throw new Error("Неуспешно генериране на номер.");
  return Number(res.snapshot.val());
}

// Writes field-by-field so attachments and statusLog (written elsewhere) are never clobbered by the editor.
function cleanDoc(d?: DocOverrides): DocOverrides | undefined {
  if (!d) return undefined;
  const out: DocOverrides = {
    leadTime: d.leadTime?.trim() || undefined,
    leadTimeNote: d.leadTimeNote?.trim() || undefined,
    included: d.included ? d.included.map((x) => x.trim()).filter(Boolean) : undefined,
  };
  return out.leadTime || out.leadTimeNote || out.included ? out : undefined;
}

export async function saveOrder(draft: OrderDraft, existing?: Order | null): Promise<Order> {
  const now = Date.now();
  const id = draft.id ?? newId();
  const isNew = !existing;
  const number = existing?.number ?? (await nextOrderNumber());
  const sections = ensureSections(draft).map((s, i) => ({ ...s, sort: i }));
  const primary = sections[0];
  const ids = new Set(sections.map((s) => s.id));
  const positions = draft.positions.map((p) => (p.sectionId && ids.has(p.sectionId) ? p : { ...p, sectionId: primary.id }));
  const doc = cleanDoc(draft.doc);
  const q = quoteFor({ ...draft, sections, positions });
  const order: Order = {
    ...draft,
    material: primary.material,
    stoneKey: primary.stoneKey,
    materialPriceM2: primary.materialPriceM2 ?? null,
    sections,
    positions,
    doc,
    id,
    number,
    status: existing?.status ?? draft.status ?? "quoted",
    attachments: existing?.attachments ?? [],
    statusLog: existing?.statusLog ?? [],
    totals: { net: q.net, vat: q.vat, gross: q.gross, areaM2: q.netAreaM2, currency: q.currency },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    closedAt: existing?.closedAt,
  };

  const base = `orders/${id}`;
  const updates: Record<string, unknown> = {
    [`${base}/number`]: order.number,
    [`${base}/status`]: order.status,
    [`${base}/client`]: prune(order.client),
    [`${base}/material`]: prune(order.material),
    [`${base}/stoneKey`]: order.stoneKey,
    [`${base}/materialPriceM2`]: order.materialPriceM2 ?? null,
    [`${base}/sections`]: listToMap(order.sections),
    [`${base}/positions`]: listToMap(order.positions),
    [`${base}/services`]: listToMap(order.services),
    [`${base}/discountPct`]: order.discountPct || 0,
    [`${base}/notes`]: order.notes || null,
    [`${base}/dueDate`]: order.dueDate || null,
    [`${base}/doc`]: order.doc ? prune(order.doc) : null,
    [`${base}/pricing`]: prune(order.pricing),
    [`${base}/totals`]: order.totals,
    [`${base}/createdAt`]: order.createdAt,
    [`${base}/updatedAt`]: order.updatedAt,
    ...summaryPaths(order),
  };
  if (isNew) {
    const logKey = push(ref(db, `${base}/statusLog`)).key as string;
    updates[`${base}/statusLog/${logKey}`] = { status: order.status, at: now };
    order.statusLog = [{ status: order.status, at: now }];
  }
  await update(ref(db), updates);
  return order;
}

export async function changeStatus(order: Order, status: OrderStatus, by?: string) {
  const now = Date.now();
  const next: Order = {
    ...order,
    status,
    updatedAt: now,
    closedAt: isActiveStatus(status) ? undefined : now,
  };
  const base = `orders/${order.id}`;
  const logKey = push(ref(db, `${base}/statusLog`)).key as string;
  await update(ref(db), {
    [`${base}/status`]: status,
    [`${base}/updatedAt`]: now,
    [`${base}/closedAt`]: next.closedAt ?? null,
    [`${base}/statusLog/${logKey}`]: prune({ status, at: now, by }),
    ...summaryPaths(next),
  });
}

export async function deleteOrder(order: Order) {
  await Promise.allSettled(order.attachments.map((a) => deleteObject(storageRef(storage, a.path))));
  await update(ref(db), {
    [`orders/${order.id}`]: null,
    [`orders_active/${order.id}`]: null,
    [`orders_history/${order.id}`]: null,
  });
}

/** Permanently deletes an order by id (records + attachments). Used by the Kanban board. */
export async function deleteOrderById(id: string) {
  let attachments: Attachment[] = [];
  try {
    const snap = await get(ref(db, `orders/${id}`));
    const raw = snap.exists() ? (snap.val() as Record<string, unknown>) : null;
    attachments = mapToList<Attachment>(raw?.attachments);
  } catch {
    // If the order can't be read, still remove the records.
  }
  await Promise.allSettled(attachments.map((a) => deleteObject(storageRef(storage, a.path))));
  await update(ref(db), {
    [`orders/${id}`]: null,
    [`orders_active/${id}`]: null,
    [`orders_history/${id}`]: null,
  });
}

/**
 * Changes an order's status by id (used by the Kanban board). Active targets keep the
 * summary in orders_active; a closed target moves it to orders_history.
 * The board subscribes to orders_active, so a status edited in the order details and
 * saved through changeStatus() is reflected there automatically.
 */
export async function updateOrderStatus(id: string, status: OrderStatus, by?: string) {
  const now = Date.now();
  const active = isActiveStatus(status);
  const base = `orders/${id}`;
  const logKey = push(ref(db, `${base}/statusLog`)).key as string;
  const updates: Record<string, unknown> = {
    [`${base}/status`]: status,
    [`${base}/updatedAt`]: now,
    [`${base}/closedAt`]: active ? null : now,
    [`${base}/statusLog/${logKey}`]: prune({ status, at: now, by }),
  };
  if (active) {
    updates[`orders_active/${id}/status`] = status;
    updates[`orders_active/${id}/updatedAt`] = now;
  } else {
    const snap = await get(ref(db, `orders_active/${id}`));
    if (snap.exists() && isObj(snap.val())) {
      updates[`orders_history/${id}`] = prune({ ...(snap.val() as object), status, closedAt: now, updatedAt: now });
      updates[`orders_active/${id}`] = null;
    }
  }
  await update(ref(db), updates);
}

// ---------- attachments ----------

export const ATTACHMENT_ACCEPT = "image/*,application/pdf";

export function validateAttachment(file: File): string | null {
  if (!(file.type.startsWith("image/") || file.type === "application/pdf")) return `${file.name}: позволени са снимки и PDF.`;
  if (file.size > MAX_ATTACHMENT_BYTES) return `${file.name}: файлът е над 15 MB.`;
  return null;
}

export async function uploadAttachment(orderId: string, file: File, positionId?: string): Promise<Attachment> {
  const err = validateAttachment(file);
  if (err) throw new Error(err);
  const id = push(ref(db, `orders/${orderId}/attachments`)).key as string;
  const dot = file.name.lastIndexOf(".");
  const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : file.type === "application/pdf" ? "pdf" : "jpg";
  const base = slugify(dot > 0 ? file.name.slice(0, dot) : file.name) || "file";
  const path = `orders/${orderId}/${Date.now()}-${base}.${ext}`;
  const snap = await uploadBytes(storageRef(storage, path), file, { contentType: file.type });
  const url = await getDownloadURL(snap.ref);
  const att: Attachment = prune({
    id,
    name: file.name,
    path,
    url,
    contentType: file.type,
    size: file.size,
    positionId: positionId || undefined,
    uploadedAt: Date.now(),
  });
  const { id: _omit, ...stored } = att;
  void _omit;
  await update(ref(db), { [`orders/${orderId}/attachments/${id}`]: stored });
  return att;
}

export async function tagAttachment(orderId: string, attachmentId: string, positionId: string | null) {
  await update(ref(db), { [`orders/${orderId}/attachments/${attachmentId}/positionId`]: positionId || null });
}

export async function deleteAttachment(orderId: string, att: Attachment) {
  try {
    await deleteObject(storageRef(storage, att.path));
  } catch (e) {
    // Already gone in Storage – still drop the dangling metadata.
    if (!(isObj(e) && (e as { code?: string }).code === "storage/object-not-found")) throw e;
  }
  await update(ref(db), { [`orders/${orderId}/attachments/${att.id}`]: null });
}
