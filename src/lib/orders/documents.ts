// Shared content for the printable order documents (client offer/contract and internal traceability sheet).
import { PRODUCT_TYPES, SIDES, type OrderQuote, type Position, type PositionQuote, type PricingSettings } from "./pricing";
import type { Order, OrderStatus } from "./ordersData";

export type Company = {
  name: string;
  tagline: string;
  phones: string[];
  email: string;
  website: string;
  address: string;
  // Legal entity & bank details printed on the client document.
  legalName: string;
  legalAddress: string;
  eik: string;
  vatNumber: string;
  mol: string;
  paymentMethod: string;
  bankName: string;
  iban: string;
  bic: string;
};

export type TermScope = "all" | "offer" | "contract";
export const TERM_SCOPES: { key: TermScope; label: string }[] = [
  { key: "all", label: "Всички документи" },
  { key: "offer", label: "Само оферти" },
  { key: "contract", label: "Само договор-поръчки" },
];
export type Term = { text: string; scope: TermScope };

export type DocumentSettings = {
  company: Company;
  offerValidityDays: number;
  advancePct: number;
  freeStorageDays: number;
  warrantyMonths: number;
  terms: Term[];
  updatedAt?: number;
};

// Values usable inside term texts as {key}; kept in sync with the numeric settings above.
export const TERM_PLACEHOLDERS = [
  { key: "offerValidityDays", label: "Валидност на офертата, дни" },
  { key: "advancePct", label: "Аванс, %" },
  { key: "freeStorageDays", label: "Безплатно съхранение, дни" },
  { key: "warrantyMonths", label: "Гаранция, месеци" },
] as const;

export const DEFAULT_DOCUMENT_SETTINGS: DocumentSettings = {
  company: {
    name: "Yotto Stones",
    tagline: "Естествен камък · изработка и монтаж",
    phones: ["+359 895 19 8805", "+359 885 05 3680"],
    email: "yottostones@gmail.com",
    website: "www.yottostones-bg.com",
    address: "ул. „Владимир Зограф“ 121, 1229 София, България",
    legalName: "Ц-М ЙОТТО ЕООД",
    legalAddress: "ул. „Владимир Зограф“ №121, София, България",
    eik: "207239186",
    vatNumber: "BG207239186",
    mol: "Силвия Александрова",
    paymentMethod: "по банков път",
    bankName: "Юробанк България АД",
    iban: "BG64BPBI79421027443401",
    bic: "BPBIBGSF",
  },
  offerValidityDays: 14,
  advancePct: 50,
  freeStorageDays: 14,
  warrantyMonths: 24,
  terms: [
    { scope: "offer", text: "Офертата е валидна {offerValidityDays} дни от датата на издаване. След този срок цените и наличността на материала подлежат на потвърждение." },
    { scope: "all", text: "Поръчката се счита за потвърдена след подписване на настоящия документ и заплащане на аванс в размер на {advancePct}% от общата стойност. Остатъкът се заплаща при издаване или доставка, преди монтажа." },
    { scope: "all", text: "Срокът за изработка тече от датата на окончателното замерване и получаването на аванса. Посочената дата на готовност е ориентировъчна до потвърждаване на поръчката." },
    { scope: "all", text: "При размери, предоставени от Възложителя, отговорността за тяхната точност е негова. При замерване от екипа на Yotto Stones отговорността е на Изпълнителя." },
    { scope: "all", text: "Естественият камък е природен материал. Разлики в цвета, шарката, жилките, порите и включенията спрямо мостри, снимки и предишни доставки са естествени и не представляват дефект." },
    { scope: "all", text: "Площта на материала се изчислява по технологичния разкрой на плочата и включва неизбежния отпадък при рязане." },
    { scope: "all", text: "Промени по размерите или обработката след стартиране на производството се заплащат допълнително. При отказ след началото на производството авансът не се възстановява." },
    { scope: "all", text: "Готовите изделия се съхраняват безплатно до {freeStorageDays} дни след уведомяване за готовност. След този срок може да бъде начислена такса за съхранение." },
    { scope: "all", text: "Видимите несъответствия се отбелязват при приемане на изделията. Рекламации за скрити дефекти се приемат в писмен вид." },
    { scope: "all", text: "Гаранцията за изработка и монтаж е {warrantyMonths} месеца при правилна експлоатация и поддръжка. Не се покриват механични удари, термичен шок и петна от агресивни препарати." },
    { scope: "all", text: "Монтажът изисква подготвена, равна и суха основа. Допълнителни работи (демонтаж, къртене, изравняване) се заплащат отделно." },
    { scope: "all", text: "Собствеността върху изделията преминава към Възложителя след пълното им заплащане." },
  ],
};

const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : []);

// RTDB may hold a partial/old shape (and drops empty arrays); merge onto defaults so documents never see holes.
export function withDocumentDefaults(stored: unknown): DocumentSettings {
  const d = DEFAULT_DOCUMENT_SETTINGS;
  if (!stored || typeof stored !== "object") return structuredClone(d);
  const s = stored as Record<string, unknown>;
  const c = (s.company ?? {}) as Record<string, unknown>;
  const terms = s.terms === undefined ? d.terms : list(s.terms);
  return {
    company: {
      name: str(c.name, d.company.name),
      tagline: str(c.tagline, d.company.tagline),
      phones: c.phones === undefined ? [...d.company.phones] : list(c.phones).filter((p): p is string => typeof p === "string"),
      email: str(c.email, d.company.email),
      website: str(c.website, d.company.website),
      address: str(c.address, d.company.address),
      legalName: str(c.legalName, d.company.legalName),
      legalAddress: str(c.legalAddress, d.company.legalAddress),
      eik: str(c.eik, d.company.eik),
      vatNumber: str(c.vatNumber, d.company.vatNumber),
      mol: str(c.mol, d.company.mol),
      paymentMethod: str(c.paymentMethod, d.company.paymentMethod),
      bankName: str(c.bankName, d.company.bankName),
      iban: str(c.iban, d.company.iban),
      bic: str(c.bic, d.company.bic),
    },
    offerValidityDays: num(s.offerValidityDays, d.offerValidityDays),
    advancePct: num(s.advancePct, d.advancePct),
    freeStorageDays: num(s.freeStorageDays, d.freeStorageDays),
    warrantyMonths: num(s.warrantyMonths, d.warrantyMonths),
    terms: terms
      .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
      .map((t) => ({
        text: str(t.text, ""),
        scope: (TERM_SCOPES.some((x) => x.key === t.scope) ? t.scope : "all") as TermScope,
      })),
    updatedAt: typeof s.updatedAt === "number" ? s.updatedAt : undefined,
  };
}

const OFFER_STATUSES: OrderStatus[] = ["request", "quoted"];
export const isOffer = (status: OrderStatus) => OFFER_STATUSES.includes(status);

export function fillPlaceholders(text: string, s: DocumentSettings): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => {
    const v = (s as unknown as Record<string, unknown>)[k];
    return TERM_PLACEHOLDERS.some((p) => p.key === k) && typeof v === "number" ? String(v) : m;
  });
}

export function contractTerms(s: DocumentSettings, offer: boolean): string[] {
  return s.terms
    .filter((t) => t.text.trim() && (t.scope === "all" || t.scope === (offer ? "offer" : "contract")))
    .map((t) => fillPlaceholders(t.text.trim(), s));
}

export const productLabel = (t: Position["type"]) => PRODUCT_TYPES.find((x) => x.key === t)?.label ?? t;

export const dimensions = (p: Position) => `${p.lengthCm} × ${p.depthCm} × ${p.thicknessCm} см`;

// Human description of the processing on a position – no prices and no area/waste details.
export function positionSpecs(p: Position, pricing: PricingSettings): string[] {
  const specs: string[] = [];
  const byProfile = new Map<string, string[]>();
  for (const s of SIDES) {
    const cfg = p.edges?.[s.key];
    if (!cfg?.profile) continue;
    const label = `${pricing.profiles[cfg.profile]?.label ?? cfg.profile}${cfg.buildUp ? ` с подлепка ${p.buildUpCm ?? pricing.defaultBuildUpCm} см` : ""}`;
    byProfile.set(label, [...(byProfile.get(label) ?? []), s.short]);
  }
  for (const [label, sides] of byProfile) specs.push(`${label}: ${sides.join(", ")}`);
  const drip = SIDES.filter((s) => p.drip?.[s.key]).map((s) => s.short);
  if (drip.length) specs.push(`Водооткапващ канал: ${drip.join(", ")}`);
  for (const [key, count] of Object.entries(p.cutouts ?? {})) {
    if (Number(count) > 0) specs.push(`${pricing.cutouts[key]?.label ?? key} × ${count}`);
  }
  for (const x of p.extras ?? []) if (x?.label) specs.push(x.label);
  return specs;
}

// "What's included" list for the client, derived from what is actually priced in the order.
type IncludedSource = Pick<Order, "material"> & { sections?: Order["sections"] };

export function includedWork(order: IncludedSource, quotes: PositionQuote[]): string[] {
  const keys = new Set(quotes.flatMap((q) => q.lines.map((l) => l.key.split(":")[0])));
  const labels = (order.sections?.length ? order.sections.map((s) => s.material.label) : [order.material.label]).filter(Boolean);
  const out = [
    `${labels.length > 1 ? "Материали" : "Материал"} ${labels.join(", ")}`.trim() + " – подбор и технологичен разкрой",
    "Прецизно рязане по размер",
  ];
  if (keys.has("edge")) out.push("Обработка и полиране на видимите чела по избран профил");
  if (keys.has("drip")) out.push("Фрезоване на водооткапващ канал");
  if (keys.has("cutout")) out.push("Изрязване на отвори (мивка, котлон, смесител и др.)");
  if (keys.has("seal_m2") || keys.has("seal_edge")) out.push("Импрегниране (защитна запечатка)");
  out.push("Почистване, проверка на качеството и опаковане");
  return out;
}

// Generated client-document texts; the editor shows them as placeholders and per-order overrides replace them.
export const defaultLeadTime = (dueDate?: string) =>
  dueDate ? `Готовност до ${formatLongDate(dueDate)}` : "По договаряне след окончателно замерване";
export const DEFAULT_LEAD_TIME_NOTE = "Срокът тече от окончателното замерване и получаването на аванса.";

export function includedList(order: IncludedSource & { doc?: Order["doc"] }, quote: Pick<OrderQuote, "positions" | "serviceLines">) {
  if (order.doc?.included?.length) return order.doc.included;
  return [...includedWork(order, quote.positions), ...quote.serviceLines.map((l) => l.label)];
}

export const SIDE_LEGEND = SIDES.map((s) => `${s.short} – ${s.label.toLowerCase()}`).join(" · ");

export const formatLongDate = (v?: number | string) => {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(`${v}T00:00:00`) : new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric" });
};

export const docNumber = (n?: number) => String(n ?? 0).padStart(4, "0");
