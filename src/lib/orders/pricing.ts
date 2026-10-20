// Pure pricing engine for stone fabrication orders. No Firebase imports, so it is safe to unit-test or reuse server-side.

export type ProductType = "windowsill" | "countertop" | "threshold";
export type Side = "l1" | "l2" | "s1" | "s2";
export type ServiceUnit = "flat" | "m" | "pcs" | "m2";

export const PRODUCT_TYPES: { key: ProductType; label: string }[] = [
  { key: "windowsill", label: "Перваз" },
  { key: "countertop", label: "Плот" },
  { key: "threshold", label: "Праг" },
];

export const SIDES: { key: Side; label: string; short: string; long: boolean }[] = [
  { key: "l1", label: "Дълга страна 1 (предна)", short: "Д1", long: true },
  { key: "l2", label: "Дълга страна 2 (задна)", short: "Д2", long: true },
  { key: "s1", label: "Къса страна 1 (лява)", short: "К1", long: false },
  { key: "s2", label: "Къса страна 2 (дясна)", short: "К2", long: false },
];

export const UNIT_LABELS: Record<ServiceUnit, string> = { flat: "бр.", m: "м", pcs: "бр.", m2: "м²" };

export type StonePricing = {
  label: string;
  groupIds: number[]; // catalogue groups that map to this stone type
  materialM2: number; // € per m² of billable slab
  cuttingM: number; // € per linear metre of sawing
  sealM2: number; // € per m² of finished (net) surface
  sealEdgeM: number; // € per linear metre of finished edge
  check?: boolean; // seeded value that the owner still has to confirm
};

export type ProfilePricing = { label: string; prices: Record<string, number>; check?: boolean };
export type PricedItem = { label: string; price: number; check?: boolean };
export type ServicePricing = PricedItem & { unit: ServiceUnit };

export type PricingSettings = {
  currency: string;
  vatPct: number;
  minOrderNet: number; // minimum order value (net, after discount)
  minPieceAreaM2: number; // small offcuts still cost a minimum slab area
  buildUpMultiplier: number; // profile price multiplier on sides with a glued build-up (подлепка)
  defaultBuildUpCm: number;
  dripGrooveM: number;
  wastePct: Record<ProductType, number>;
  thicknessFactors: Record<string, number>; // "2" | "3" | "4" cm → material price multiplier
  stones: Record<string, StonePricing>;
  profiles: Record<string, ProfilePricing>;
  cutouts: Record<string, PricedItem>;
  services: Record<string, ServicePricing>;
  updatedAt?: number;
  customizedAt?: number; // set when an order's own snapshot was edited by hand (per-order price overrides)
};

export type EdgeConfig = { profile: string; buildUp?: boolean };
export type PositionExtra = { label: string; amount: number };

export type Position = {
  id: string;
  sort: number;
  sectionId?: string; // material section the piece is cut from; falls back to the first/only section
  type: ProductType;
  label?: string;
  lengthCm: number;
  depthCm: number;
  thicknessCm: number;
  qty: number;
  buildUpCm?: number;
  edges?: Partial<Record<Side, EdgeConfig>>;
  drip?: Partial<Record<Side, boolean>>;
  cutouts?: Record<string, number>;
  extras?: PositionExtra[];
  notes?: string;
  // Impregnation / edge sealing for this piece. Undefined = legacy order that was
  // priced automatically; false/true is an explicit admin choice.
  impregnated?: boolean;
};

export type OrderService = { id: string; key: string; label: string; unit: ServiceUnit; unitPrice: number; qty: number };

export type PriceLine = {
  key: string;
  label: string;
  qty: number;
  unit: string;
  unitPrice: number;
  amount: number;
};

export type PositionQuote = {
  positionId: string;
  netAreaM2: number;
  billableAreaM2: number;
  edgeM: number;
  lines: PriceLine[];
  total: number;
  warnings: string[];
};

export type SectionQuote = { sectionId: string; total: number; netAreaM2: number; billableAreaM2: number; positions: number };

export type OrderQuote = {
  positions: PositionQuote[];
  sections: SectionQuote[];
  serviceLines: PriceLine[];
  positionsTotal: number;
  servicesTotal: number;
  subtotal: number;
  discountPct: number;
  discount: number;
  minimumTopUp: number;
  net: number;
  vatPct: number;
  vat: number;
  gross: number;
  netAreaM2: number;
  currency: string;
};

export type QuoteSection = { id: string; stoneKey: string; materialPriceM2?: number | null };

export type QuoteInput = {
  positions: Position[];
  services: OrderService[];
  stoneKey: string;
  materialPriceM2?: number | null;
  sections?: QuoteSection[]; // multi-material orders; when absent every position uses stoneKey/materialPriceM2
  discountPct?: number;
  pricing: PricingSettings;
  // false = price the same order without any impregnation/edge-sealing lines (the "without" variant).
  includeSeal?: boolean;
};

// Seeded from the 2025 xlsx (лв → € at 1.95583), lifted ~8–10 % to 2026 market levels and rounded to friendly numbers.
export const DEFAULT_PRICING: PricingSettings = {
  currency: "EUR",
  vatPct: 20,
  minOrderNet: 80,
  minPieceAreaM2: 0.05,
  buildUpMultiplier: 2,
  defaultBuildUpCm: 5,
  dripGrooveM: 4,
  wastePct: { windowsill: 30, countertop: 25, threshold: 30 },
  thicknessFactors: { "2": 1, "3": 1.4, "4": 1.8 },
  stones: {
    limestone: { label: "Варовик", groupIds: [4], materialM2: 55, cuttingM: 3, sealM2: 13.5, sealEdgeM: 0 },
    marble: { label: "Мрамор", groupIds: [1], materialM2: 89, cuttingM: 4, sealM2: 0, sealEdgeM: 2 },
    granite: { label: "Гранит", groupIds: [2], materialM2: 115, cuttingM: 5.5, sealM2: 0, sealEdgeM: 2 },
    onyx: { label: "Оникс", groupIds: [3], materialM2: 150, cuttingM: 5.5, sealM2: 0, sealEdgeM: 2, check: true },
    travertine: { label: "Травертин", groupIds: [5], materialM2: 85, cuttingM: 3.5, sealM2: 13.5, sealEdgeM: 0, check: true },
  },
  profiles: {
    r_half: {
      label: "Двустранно закръгление ½ R",
      prices: { limestone: 11, marble: 13.5, granite: 15.5, onyx: 15.5, travertine: 11 },
    },
    r_quarter: {
      label: "Едностранно закръгление ¼ R",
      prices: { limestone: 9.5, marble: 11.5, granite: 13.5, onyx: 13.5, travertine: 9.5 },
      check: true,
    },
    chamfer_5: {
      label: "Полиран кант с фаска 5 мм",
      prices: { limestone: 9, marble: 10, granite: 11.5, onyx: 11.5, travertine: 9 },
    },
    chamfer_min: {
      label: "Полиран кант с фаска минимална",
      prices: { limestone: 7, marble: 8, granite: 9.5, onyx: 9.5, travertine: 7 },
      check: true,
    },
    chamfer_single: {
      label: "Едностранна фаска",
      prices: { limestone: 9, marble: 10, granite: 11.5, onyx: 11.5, travertine: 9 },
      check: true,
    },
    polished_chamfer: {
      label: "Полирано чело с едностранна фаска",
      prices: { limestone: 10, marble: 11.5, granite: 13, onyx: 13, travertine: 10 },
      check: true,
    },
    mitre: {
      label: "Чело сработено под герунг",
      prices: { limestone: 18, marble: 21, granite: 24, onyx: 24, travertine: 18 },
      check: true,
    },
  },
  cutouts: {
    sink_under: { label: "Отвор мивка (подлепена)", price: 75 },
    sink_over: { label: "Отвор мивка (горен монтаж)", price: 45 },
    hob: { label: "Отвор плот за котлон", price: 45 },
    tap: { label: "Отвор за смесител", price: 12 },
    socket: { label: "Отвор за контакт", price: 15 },
  },
  services: {
    measuring: { label: "Замерване на обект", unit: "flat", price: 25 },
    transport: { label: "Транспорт (София)", unit: "flat", price: 30 },
    install_m: { label: "Монтаж", unit: "m", price: 12 },
    removal: { label: "Демонтаж на стар елемент", unit: "pcs", price: 15 },
  },
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const round3 = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;
const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

// Settings may be partial in RTDB (old or hand-edited); merge onto defaults so the engine never sees holes.
export function withDefaults(stored: Partial<PricingSettings> | null | undefined): PricingSettings {
  const s = stored ?? {};
  return {
    ...DEFAULT_PRICING,
    ...s,
    wastePct: { ...DEFAULT_PRICING.wastePct, ...(s.wastePct ?? {}) },
    thicknessFactors: s.thicknessFactors ?? DEFAULT_PRICING.thicknessFactors,
    stones: s.stones ?? DEFAULT_PRICING.stones,
    profiles: s.profiles ?? DEFAULT_PRICING.profiles,
    cutouts: s.cutouts ?? DEFAULT_PRICING.cutouts,
    services: s.services ?? DEFAULT_PRICING.services,
  };
}

export function stoneKeyForGroup(pricing: PricingSettings, groupId?: number): string | undefined {
  if (groupId == null) return undefined;
  return Object.entries(pricing.stones).find(([, s]) => (s.groupIds ?? []).includes(groupId))?.[0];
}

// Thickness not in the table → nearest lower configured thickness (never below 1.0).
export function thicknessFactor(pricing: PricingSettings, thicknessCm: number): number {
  const entries = Object.entries(pricing.thicknessFactors)
    .map(([k, v]) => [Number(k), num(v, 1)] as const)
    .filter(([k]) => Number.isFinite(k))
    .sort((a, b) => a[0] - b[0]);
  let factor = 1;
  for (const [cm, f] of entries) if (thicknessCm >= cm) factor = f;
  return factor;
}

function line(key: string, label: string, qty: number, unit: string, unitPrice: number): PriceLine {
  return { key, label, qty: round3(qty), unit, unitPrice: round2(unitPrice), amount: round2(qty * unitPrice) };
}

export function sideLengthM(p: Position, side: Side): number {
  return (side === "l1" || side === "l2" ? num(p.lengthCm) : num(p.depthCm)) / 100;
}

export function quotePosition(p: Position, input: Omit<QuoteInput, "positions" | "services">): PositionQuote {
  const { pricing, stoneKey } = input;
  const stone = pricing.stones[stoneKey];
  const warnings: string[] = [];
  const L = num(p.lengthCm) / 100;
  const D = num(p.depthCm) / 100;
  const qty = Math.max(0, Math.floor(num(p.qty, 1)));
  const lines: PriceLine[] = [];

  if (!stone) warnings.push("Няма ценоразпис за избрания вид камък.");
  if (L <= 0 || D <= 0 || qty <= 0) {
    return { positionId: p.id, netAreaM2: 0, billableAreaM2: 0, edgeM: 0, lines, total: 0, warnings: ["Въведете размери и брой."] };
  }

  const buildUpM = num(p.buildUpCm, pricing.defaultBuildUpCm) / 100;
  const edges = SIDES.map((s) => ({ cfg: p.edges?.[s.key], len: sideLengthM(p, s.key) })).filter((e) => !!e.cfg?.profile);
  const buildUpSides = edges.filter((e) => e.cfg?.buildUp);

  // Material: each piece is billed at least minPieceArea, glued strips are extra slab, then waste on top.
  const pieceArea = L * D;
  const stripArea = buildUpSides.reduce((a, e) => a + e.len * buildUpM, 0);
  const minArea = num(pricing.minPieceAreaM2);
  const billablePiece = Math.max(pieceArea, minArea);
  const waste = num(pricing.wastePct[p.type], 0) / 100;
  const billableArea = (billablePiece + stripArea) * (1 + waste) * qty;
  const tf = thicknessFactor(pricing, num(p.thicknessCm, 2));
  const materialUnit = (input.materialPriceM2 && input.materialPriceM2 > 0 ? input.materialPriceM2 : num(stone?.materialM2)) * tf;
  const parts = [`${num(p.lengthCm)}×${num(p.depthCm)} см`];
  if (stripArea > 0) parts.push("+ подлепка");
  if (pieceArea < minArea) parts.push(`мин. ${minArea} м²/бр.`);
  parts.push(`+${Math.round(waste * 100)}% фира`);
  if (tf !== 1) parts.push(`×${tf} за ${num(p.thicknessCm)} см`);
  lines.push(line("material", `Материал (${parts.join(", ")})`, billableArea, "м²", materialUnit));

  const cutting = (2 * (L + D) + buildUpSides.reduce((a, e) => a + 2 * (e.len + buildUpM), 0)) * qty;
  lines.push(line("cutting", "Рязане", cutting, "м", num(stone?.cuttingM)));

  // Edge work grouped by profile + build-up so repeated sides read as one line.
  const edgeGroups = new Map<string, { label: string; m: number; unit: number }>();
  for (const e of edges) {
    const cfg = e.cfg as EdgeConfig;
    const profile = pricing.profiles[cfg.profile];
    if (!profile) {
      warnings.push(`Непознат профил „${cfg.profile}“.`);
      continue;
    }
    const base = num(profile.prices?.[stoneKey]);
    if (!base) warnings.push(`Профил „${profile.label}“ няма цена за ${stone?.label ?? stoneKey}.`);
    const key = `${cfg.profile}${cfg.buildUp ? "+bu" : ""}`;
    const g = edgeGroups.get(key) ?? {
      label: `${profile.label}${cfg.buildUp ? ` + подлепка ${Math.round(buildUpM * 100)} см` : ""}`,
      m: 0,
      unit: cfg.buildUp ? base * num(pricing.buildUpMultiplier, 1) : base,
    };
    g.m += e.len * qty;
    edgeGroups.set(key, g);
  }
  let edgeM = 0;
  for (const [key, g] of edgeGroups) {
    edgeM += g.m;
    lines.push(line(`edge:${key}`, `Обработка: ${g.label}`, g.m, "м", g.unit));
  }

  const dripM = SIDES.filter((s) => p.drip?.[s.key]).reduce((a, s) => a + sideLengthM(p, s.key), 0) * qty;
  if (dripM > 0) lines.push(line("drip", "Водооткапващ канал", dripM, "м", num(pricing.dripGrooveM)));

  for (const [key, count] of Object.entries(p.cutouts ?? {})) {
    const c = num(count);
    if (c <= 0) continue;
    const item = pricing.cutouts[key];
    if (!item) {
      warnings.push(`Непознат отвор „${key}“.`);
      continue;
    }
    lines.push(line(`cutout:${key}`, item.label, c * qty, "бр.", num(item.price)));
  }

  // Sealing is charged on the finished stone only – never on the waste the client doesn't receive.
  // It is opt-in per position (undefined = legacy order, which was always sealed).
  const sealed = p.impregnated !== false && input.includeSeal !== false;
  if (sealed && num(stone?.sealM2) > 0) {
    lines.push(line("seal_m2", "Импрегниране (запечатка)", (pieceArea + stripArea) * qty, "м²", num(stone?.sealM2)));
  }
  if (sealed && num(stone?.sealEdgeM) > 0 && edgeM > 0) {
    lines.push(line("seal_edge", "Запечатка чело", edgeM, "м", num(stone?.sealEdgeM)));
  }

  (p.extras ?? []).forEach((x, i) => {
    if (!x || (!x.label && !num(x.amount))) return;
    lines.push(line(`extra:${i}`, x.label || "Допълнително", 1, "бр.", num(x.amount)));
  });

  return {
    positionId: p.id,
    netAreaM2: round3(pieceArea * qty),
    billableAreaM2: round3(billableArea),
    edgeM: round3(edgeM),
    lines,
    total: round2(lines.reduce((a, l) => a + l.amount, 0)),
    warnings,
  };
}

export function quoteOrder(input: QuoteInput): OrderQuote {
  const { pricing } = input;
  const sections = input.sections?.length ? input.sections : null;
  const sectionOf = (p: Position) => (sections ? (sections.find((s) => s.id === p.sectionId) ?? sections[0]) : null);
  const sorted = [...input.positions].sort((a, b) => a.sort - b.sort);
  const positions = sorted.map((p) => {
    const s = sectionOf(p);
    return quotePosition(p, s ? { ...input, stoneKey: s.stoneKey, materialPriceM2: s.materialPriceM2 } : input);
  });
  const sectionQuotes: SectionQuote[] = (sections ?? []).map((s) => {
    const own = positions.filter((_, i) => sectionOf(sorted[i])?.id === s.id);
    return {
      sectionId: s.id,
      positions: own.length,
      total: round2(own.reduce((a, q) => a + q.total, 0)),
      netAreaM2: round3(own.reduce((a, q) => a + q.netAreaM2, 0)),
      billableAreaM2: round3(own.reduce((a, q) => a + q.billableAreaM2, 0)),
    };
  });
  const serviceLines = input.services
    .filter((s) => num(s.qty) > 0)
    .map((s) => line(`service:${s.id}`, s.label, num(s.qty), UNIT_LABELS[s.unit] ?? "бр.", num(s.unitPrice)));
  const positionsTotal = round2(positions.reduce((a, p) => a + p.total, 0));
  const servicesTotal = round2(serviceLines.reduce((a, l) => a + l.amount, 0));
  const subtotal = round2(positionsTotal + servicesTotal);
  const discountPct = Math.min(100, Math.max(0, num(input.discountPct)));
  const discount = round2((subtotal * discountPct) / 100);
  const afterDiscount = round2(subtotal - discount);
  const minimumTopUp = afterDiscount > 0 ? round2(Math.max(0, num(pricing.minOrderNet) - afterDiscount)) : 0;
  const net = round2(afterDiscount + minimumTopUp);
  const vatPct = num(pricing.vatPct);
  const vat = round2((net * vatPct) / 100);
  return {
    positions,
    sections: sectionQuotes,
    serviceLines,
    positionsTotal,
    servicesTotal,
    subtotal,
    discountPct,
    discount,
    minimumTopUp,
    net,
    vatPct,
    vat,
    gross: round2(net + vat),
    netAreaM2: round3(positions.reduce((a, p) => a + p.netAreaM2, 0)),
    currency: pricing.currency || "EUR",
  };
}

export function formatMoney(n: number, currency = "EUR") {
  return new Intl.NumberFormat("bg-BG", { style: "currency", currency, minimumFractionDigits: 2 }).format(n || 0);
}

export function formatNum(n: number, digits = 2) {
  return new Intl.NumberFormat("bg-BG", { maximumFractionDigits: digits }).format(n || 0);
}
