// Shared (client + server) contract for the public price calculator. Pure – no Firebase imports.
import {
  PRODUCT_TYPES,
  SIDES,
  stoneKeyForGroup,
  type OrderService,
  type Position,
  type PricingSettings,
  type ProductType,
  type ServiceUnit,
  type Side,
} from "./pricing";

export const PUBLIC_LIMITS = {
  maxPositions: 10,
  maxLengthCm: 400,
  maxDepthCm: 200,
  minSizeCm: 5,
  maxQty: 50,
  maxCutoutsPerPiece: 10,
  thicknesses: [2, 3, 4],
  nameMax: 80,
  phoneMax: 30,
  emailMax: 120,
  noteMax: 1000,
};

export const PUBLIC_DISCLAIMER = "Ориентировъчна цена – окончателната се потвърждава след замерване.";

// Admin-only RTDB flag; the API routes read it with firebase-admin.
export const CALCULATOR_FLAG_PATH = "settings/priceCalculator";

export type PublicPosition = {
  type: ProductType;
  lengthCm: number;
  depthCm: number;
  thicknessCm: number;
  qty: number;
  edges: Partial<Record<Side, string>>; // side → profile key ("" = raw edge)
  cutouts: Record<string, number>;
};

export type PublicQuoteInput = {
  groupId: number;
  materialId: number;
  positions: PublicPosition[];
  services: string[];
};

export type PublicQuoteResult = { gross: number; areaM2: number; currency: string };

export type PublicOptions = {
  productTypes: { key: ProductType; label: string }[];
  sides: { key: Side; label: string; short: string }[];
  profiles: { key: string; label: string }[];
  cutouts: { key: string; label: string }[];
  services: { key: string; label: string; unit: ServiceUnit }[];
  thicknesses: number[];
  limits: typeof PUBLIC_LIMITS;
  disclaimer: string;
};

export type RequestContact = { name: string; phone: string; email?: string; note?: string };

export type RequestStatus = "new" | "contacted" | "approved" | "rejected";

export const REQUEST_STATUSES: { key: RequestStatus; label: string; color: string }[] = [
  { key: "new", label: "Нова", color: "bg-sky-100 text-sky-800" },
  { key: "contacted", label: "Свързан", color: "bg-amber-100 text-amber-800" },
  { key: "approved", label: "Одобрена", color: "bg-emerald-100 text-emerald-800" },
  { key: "rejected", label: "Отказана", color: "bg-gray-200 text-gray-700" },
];

export type OrderRequest = {
  id: string;
  status: RequestStatus;
  createdAt: number;
  updatedAt: number;
  seenAt?: number;
  client: { name: string; phone: string; email?: string };
  note?: string;
  consentAt: number;
  material: { groupKey: string; groupId: number; materialId: number; label: string };
  stoneKey: string;
  materialPriceM2: number | null;
  positions: Position[];
  serviceKeys: string[];
  quote: { gross: number; net: number; vat: number; areaM2: number; currency: string };
  orderId?: string;
  rejectReason?: string;
  closedAt?: number;
};

export const REJECTED_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const int = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : NaN);

// Material price is € per m² of slab. Text (legacy "При запитване") or empty → fall back to the stone type.
export function materialPriceM2(price: unknown): number | null {
  const n = typeof price === "number" ? price : typeof price === "string" ? Number(price.trim().replace(",", ".")) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function resolveStone(pricing: PricingSettings, groupId: number, price: unknown) {
  const stoneKey = stoneKeyForGroup(pricing, groupId);
  return stoneKey ? { stoneKey, materialPriceM2: materialPriceM2(price) } : null;
}

// Only offer edge profiles that actually have a price for this stone – an unpriced profile would silently quote 0.
export function buildOptions(pricing: PricingSettings, stoneKey: string): PublicOptions {
  return {
    productTypes: PRODUCT_TYPES,
    sides: SIDES.map(({ key, label, short }) => ({ key, label, short })),
    profiles: Object.entries(pricing.profiles)
      .filter(([, p]) => Number(p.prices?.[stoneKey]) > 0)
      .map(([key, p]) => ({ key, label: p.label })),
    cutouts: Object.entries(pricing.cutouts).map(([key, c]) => ({ key, label: c.label })),
    services: Object.entries(pricing.services).map(([key, s]) => ({ key, label: s.label, unit: s.unit })),
    thicknesses: PUBLIC_LIMITS.thicknesses,
    limits: PUBLIC_LIMITS,
    disclaimer: PUBLIC_DISCLAIMER,
  };
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

// Strict whitelist parse of untrusted calculator input; unknown keys are dropped, bad values rejected.
export function parseQuoteInput(raw: unknown, pricing: PricingSettings, stoneKey?: string): Parsed<PublicQuoteInput> {
  if (!isObj(raw)) return { ok: false, error: "Невалидни данни." };
  const groupId = int(raw.groupId);
  const materialId = int(raw.materialId);
  if (!Number.isFinite(groupId) || !Number.isFinite(materialId)) return { ok: false, error: "Невалиден материал." };
  if (!Array.isArray(raw.positions) || raw.positions.length === 0) return { ok: false, error: "Добавете поне един елемент." };
  if (raw.positions.length > PUBLIC_LIMITS.maxPositions) return { ok: false, error: `Максимум ${PUBLIC_LIMITS.maxPositions} елемента.` };

  const L = PUBLIC_LIMITS;
  const positions: PublicPosition[] = [];
  for (const [i, rp] of raw.positions.entries()) {
    const n = i + 1;
    if (!isObj(rp)) return { ok: false, error: `Елемент ${n}: невалидни данни.` };
    const type = rp.type as ProductType;
    if (!PRODUCT_TYPES.some((t) => t.key === type)) return { ok: false, error: `Елемент ${n}: невалиден вид.` };
    const lengthCm = int(rp.lengthCm);
    const depthCm = int(rp.depthCm);
    const thicknessCm = int(rp.thicknessCm);
    const qty = int(rp.qty);
    if (!(lengthCm >= L.minSizeCm && lengthCm <= L.maxLengthCm)) return { ok: false, error: `Елемент ${n}: дължина ${L.minSizeCm}–${L.maxLengthCm} см.` };
    if (!(depthCm >= L.minSizeCm && depthCm <= L.maxDepthCm)) return { ok: false, error: `Елемент ${n}: дълбочина ${L.minSizeCm}–${L.maxDepthCm} см.` };
    if (!L.thicknesses.includes(thicknessCm)) return { ok: false, error: `Елемент ${n}: невалидна дебелина.` };
    if (!(qty >= 1 && qty <= L.maxQty)) return { ok: false, error: `Елемент ${n}: брой 1–${L.maxQty}.` };

    const edges: Partial<Record<Side, string>> = {};
    const rawEdges = isObj(rp.edges) ? rp.edges : {};
    for (const s of SIDES) {
      const profile = rawEdges[s.key];
      if (profile == null || profile === "") continue;
      if (typeof profile !== "string" || !pricing.profiles[profile]) return { ok: false, error: `Елемент ${n}: невалиден профил.` };
      if (stoneKey && !(Number(pricing.profiles[profile].prices?.[stoneKey]) > 0)) return { ok: false, error: `Елемент ${n}: профилът не е наличен за този камък.` };
      edges[s.key] = profile;
    }

    const cutouts: Record<string, number> = {};
    const rawCutouts = isObj(rp.cutouts) ? rp.cutouts : {};
    for (const [key, v] of Object.entries(rawCutouts)) {
      const c = int(v);
      if (!c) continue;
      if (!pricing.cutouts[key]) return { ok: false, error: `Елемент ${n}: невалиден отвор.` };
      if (!(c >= 0 && c <= L.maxCutoutsPerPiece)) return { ok: false, error: `Елемент ${n}: до ${L.maxCutoutsPerPiece} отвора от вид.` };
      cutouts[key] = c;
    }
    positions.push({ type, lengthCm, depthCm, thicknessCm, qty, edges, cutouts });
  }

  const services = Array.isArray(raw.services) ? [...new Set(raw.services)] : [];
  for (const key of services) if (typeof key !== "string" || !pricing.services[key]) return { ok: false, error: "Невалидна услуга." };

  return { ok: true, value: { groupId, materialId, positions, services: services as string[] } };
}

export function toPositions(list: PublicPosition[], makeId: (i: number) => string): Position[] {
  return list.map((p, i) => ({
    id: makeId(i),
    sort: i,
    type: p.type,
    lengthCm: p.lengthCm,
    depthCm: p.depthCm,
    thicknessCm: p.thicknessCm,
    qty: p.qty,
    edges: Object.fromEntries(Object.entries(p.edges).map(([side, profile]) => [side, { profile }])),
    drip: {},
    cutouts: { ...p.cutouts },
    extras: [],
  }));
}

// Client only ticks services; quantities follow from the pieces so the total can't be gamed or forgotten.
export function deriveServices(keys: string[], positions: Position[], pricing: PricingSettings, makeId: (key: string) => string): OrderService[] {
  const lengthM = positions.reduce((a, p) => a + (p.lengthCm / 100) * p.qty, 0);
  const pieces = positions.reduce((a, p) => a + p.qty, 0);
  const areaM2 = positions.reduce((a, p) => a + ((p.lengthCm * p.depthCm) / 10000) * p.qty, 0);
  return keys
    .filter((k) => pricing.services[k])
    .map((key) => {
      const s = pricing.services[key];
      const qty = s.unit === "m" ? lengthM : s.unit === "pcs" ? pieces : s.unit === "m2" ? areaM2 : 1;
      return { id: makeId(key), key, label: s.label, unit: s.unit, unitPrice: s.price, qty: Math.round(qty * 100) / 100 };
    });
}

export function parseContact(raw: unknown): Parsed<RequestContact> {
  if (!isObj(raw)) return { ok: false, error: "Невалидни данни за контакт." };
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = str(raw.name, PUBLIC_LIMITS.nameMax);
  const phone = str(raw.phone, PUBLIC_LIMITS.phoneMax);
  const email = str(raw.email, PUBLIC_LIMITS.emailMax);
  const note = str(raw.note, PUBLIC_LIMITS.noteMax);
  if (name.length < 2) return { ok: false, error: "Въведете име." };
  if (!/^[+\d][\d\s()/-]{5,}$/.test(phone) || phone.replace(/\D/g, "").length < 6) return { ok: false, error: "Въведете валиден телефон." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Невалиден имейл." };
  return { ok: true, value: { name, phone, email: email || undefined, note: note || undefined } };
}
