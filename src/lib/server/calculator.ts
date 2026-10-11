import { createHash } from "node:crypto";
import { adminDb } from "./firebaseAdmin";
import { quoteOrder, withDefaults, type OrderQuote, type PricingSettings } from "@/lib/orders/pricing";
import { CALCULATOR_FLAG_PATH, deriveServices, resolveStone, toPositions, type PublicQuoteInput } from "@/lib/orders/publicQuote";

const FLAG_PATH = CALCULATOR_FLAG_PATH;

type Group = { id: number; name?: string; materials?: unknown };
type Material = { id: number; name?: string; displayName?: string; price?: unknown };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const CACHE_MS = 60_000;
let cache: { at: number; pricing: PricingSettings; groups: Record<string, Group> } | null = null;

// TEMPORARY local preview without a service account: public catalogue + default price list, nothing is saved.
// Never active in production builds. Remove once FIREBASE_SERVICE_ACCOUNT is configured.
export const previewMode = () => process.env.NODE_ENV !== "production" && process.env.PRICE_CALCULATOR_PREVIEW === "1";

async function loadCatalogue() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;
  if (previewMode()) {
    const url = process.env.FIREBASE_DATABASE_URL || "https://yotto-stones-default-rtdb.europe-west1.firebasedatabase.app";
    const res = await fetch(`${url}/group_materials.json`, { cache: "no-store" });
    if (!res.ok) throw new ApiError(503, "Каталогът не е достъпен.");
    cache = { at: Date.now(), pricing: withDefaults(null), groups: ((await res.json()) ?? {}) as Record<string, Group> };
    return cache;
  }
  const db = adminDb();
  if (!db) throw new ApiError(503, "Калкулаторът не е наличен.");
  const [pricing, groups] = await Promise.all([db.ref("pricing").get(), db.ref("group_materials").get()]);
  cache = { at: Date.now(), pricing: withDefaults(pricing.val()), groups: (groups.val() ?? {}) as Record<string, Group> };
  return cache;
}

// Env kill switch wins over the admin toggle so the feature can be cut without touching the DB.
export async function calculatorEnabled(): Promise<boolean> {
  if (process.env.PRICE_CALCULATOR_DISABLED === "1") return false;
  if (previewMode()) return true;
  const db = adminDb();
  if (!db) return false;
  return (await db.ref(FLAG_PATH).get()).val() === true;
}

export async function assertEnabled() {
  if (!(await calculatorEnabled())) throw new ApiError(404, "Калкулаторът не е активен.");
}

const list = <T,>(v: unknown): T[] => (v ? (Array.isArray(v) ? v : Object.values(v as object)).filter(Boolean) : []) as T[];

export async function materialContext(groupId: number, materialId: number) {
  const { pricing, groups } = await loadCatalogue();
  const entry = Object.entries(groups).find(([, g]) => g && Number(g.id) === groupId);
  if (!entry) throw new ApiError(404, "Материалът не е намерен.");
  const [groupKey, group] = entry;
  const material = list<Material>(group.materials).find((m) => Number(m.id) === materialId);
  if (!material) throw new ApiError(404, "Материалът не е намерен.");
  const stone = resolveStone(pricing, groupId, material.price);
  if (!stone) throw new ApiError(404, "Няма цени за този материал.");
  return {
    pricing,
    ...stone,
    material: { groupKey, groupId, materialId, label: material.displayName || material.name || `#${materialId}` },
  };
}

export async function computeQuote(input: PublicQuoteInput, ctx: Awaited<ReturnType<typeof materialContext>>) {
  const positions = toPositions(input.positions, (i) => `p${i + 1}`);
  const services = deriveServices(input.services, positions, ctx.pricing, (key) => `s_${key}`);
  const quote: OrderQuote = quoteOrder({
    positions,
    services,
    stoneKey: ctx.stoneKey,
    materialPriceM2: ctx.materialPriceM2,
    pricing: ctx.pricing,
  });
  return { positions, services, quote };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}

export function ipHash(ip: string): string {
  return createHash("sha256")
    .update(`${process.env.REQUEST_IP_SALT || "yotto-stones"}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

// Fixed-window counter per hashed IP, kept in RTDB so it holds across serverless instances.
export async function rateLimit(kind: "quote" | "request", hash: string, max: number, windowMs: number) {
  if (previewMode()) return;
  const db = adminDb();
  if (!db) throw new ApiError(503, "Калкулаторът не е наличен.");
  const now = Date.now();
  let allowed = false;
  await db.ref(`rate_limits/${kind}/${hash}`).transaction((cur: { start: number; count: number } | null) => {
    if (!cur || now - cur.start > windowMs) {
      allowed = true;
      return { start: now, count: 1 };
    }
    allowed = cur.count < max;
    return allowed ? { start: cur.start, count: cur.count + 1 } : cur;
  });
  if (!allowed) throw new ApiError(429, "Твърде много заявки. Опитайте отново по-късно.");
}

export function errorResponse(e: unknown) {
  if (e instanceof ApiError) return Response.json({ error: e.message }, { status: e.status });
  console.error(e);
  return Response.json({ error: "Възникна грешка. Опитайте отново." }, { status: 500 });
}
