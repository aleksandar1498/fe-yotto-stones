// Pure normalisation of saved cutlists.
//
// Firebase RTDB never stores `undefined` and collapses empty arrays, so a saved
// cutlist read back can have missing `placements`, `offcuts`, `unplacedPieces`
// or even `slabs`. Every consumer goes through here so no view ever calls
// `.length`/`.map` on undefined.

import type { Offcut, OptimizeConfig, OptimizeResult, Placement, SlabResult, SlabSpec, UnplacedPiece } from "./types";

export type CutlistOrderRef = { id: string; number: number; clientName: string };

export type SavedCutlist = {
  id: string;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  name: string;
  status: "complete" | "partial";
  materialId: string;
  materialName: string;
  thicknessMm: number;
  orders: CutlistOrderRef[];
  warnings?: string[];
  result: OptimizeResult;
};

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";

const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);

// RTDB may hand back a dense array, a map keyed by index, or nothing at all.
const asArray = <T>(v: unknown): T[] =>
  Array.isArray(v) ? (v as T[]) : v && typeof v === "object" ? (Object.values(v) as T[]) : [];

function normalizeSlabSpec(raw: unknown): SlabSpec {
  const s = (isObj(raw) ? raw : {}) as Record<string, unknown>;
  return {
    lengthMm: num(s.lengthMm),
    widthMm: num(s.widthMm),
    grainAxis: s.grainAxis === "width" ? "width" : "length",
  };
}

function normalizeSlab(raw: unknown, index: number): SlabResult {
  const s = (isObj(raw) ? raw : {}) as Record<string, unknown>;
  const placements = asArray<Placement>(s.placements);
  const offcuts = asArray<Offcut>(s.offcuts);
  const usedAreaMm2 = num(s.usedAreaMm2);
  const slabAreaMm2 = num(s.slabAreaMm2);
  // Older cutlists predate the cut metrics; backfill a reasonable estimate.
  const hasCutCount = "cutCount" in s;
  const cutCount = hasCutCount ? num(s.cutCount) : placements.length;
  const cutLengthMm = "cutLengthMm" in s ? num(s.cutLengthMm) : placements.reduce((a, p) => a + num(p.lengthMm) + num(p.widthMm), 0);
  return {
    slabIndex: num(s.slabIndex, index + 1),
    lengthMm: num(s.lengthMm),
    widthMm: num(s.widthMm),
    placements,
    usedAreaMm2,
    slabAreaMm2,
    utilizationPercent: num(s.utilizationPercent, slabAreaMm2 > 0 ? (usedAreaMm2 / slabAreaMm2) * 100 : 0),
    offcuts,
    reusableOffcutAreaMm2: num(s.reusableOffcutAreaMm2, offcuts.reduce((a, o) => a + o.lengthMm * o.widthMm, 0)),
    largestOffcutAreaMm2: num(s.largestOffcutAreaMm2, offcuts.reduce((a, o) => Math.max(a, o.lengthMm * o.widthMm), 0)),
    usableOffcutAreaMm2: num(s.usableOffcutAreaMm2, 0),
    largestUsableOffcutAreaMm2: num(s.largestUsableOffcutAreaMm2, 0),
    kerfLossAreaMm2: num(s.kerfLossAreaMm2),
    cutCount,
    cutLengthMm,
  };
}

export function normalizeResult(raw: unknown): OptimizeResult {
  const r = (isObj(raw) ? raw : {}) as Record<string, unknown>;
  const rawSlabs = asArray<Record<string, unknown>>(r.slabs);
  const slabs = rawSlabs.map((s, i) => normalizeSlab(s, i));
  const unplacedPieces = asArray<UnplacedPiece>(r.unplacedPieces);
  const slabSpec = normalizeSlabSpec(r.slabSpec);
  const totalSlabAreaMm2 = num(r.totalSlabAreaMm2, slabs.reduce((a, s) => a + s.slabAreaMm2, 0));
  const usedAreaMm2 = num(r.usedAreaMm2, slabs.reduce((a, s) => a + s.usedAreaMm2, 0));
  const placedPieces = num(r.placedPieces, slabs.reduce((a, s) => a + s.placements.length, 0));
  const unplacedCount = num(r.unplacedCount, unplacedPieces.reduce((a, p) => a + num(p.quantity), 0));
  // Totals are derived from the (normalised) slabs so they always agree.
  const totalCutCount = slabs.reduce((a, s) => a + s.cutCount, 0);
  const totalCutLengthMm = slabs.reduce((a, s) => a + s.cutLengthMm, 0);
  const backfilledCuts = rawSlabs.some((s) => isObj(s) && !("cutCount" in s) && asArray(s.placements).length > 0);
  const config = (isObj(r.config)
    ? (r.config as unknown as OptimizeConfig)
    : ({ slab: slabSpec, kerfMm: num(r.kerfMm), grainMode: "none", allowRotation: true, cuttingMode: "freestyle" } as OptimizeConfig));
  const slabUsage = asArray<Record<string, unknown>>(r.slabUsage).map((u) => ({
    lengthMm: num(u?.lengthMm),
    widthMm: num(u?.widthMm),
    used: num(u?.used),
    available: num(u?.available),
  }));
  return {
    materialId: String(r.materialId ?? ""),
    materialName: typeof r.materialName === "string" ? r.materialName : undefined,
    status: r.status === "partial" ? "partial" : "complete",
    strategy: String(r.strategy ?? ""),
    slabs,
    slabsUsed: num(r.slabsUsed, slabs.length),
    unplacedPieces,
    totalPieces: num(r.totalPieces, placedPieces + unplacedCount),
    placedPieces,
    unplacedCount,
    totalSlabAreaMm2,
    usedAreaMm2,
    wasteAreaMm2: num(r.wasteAreaMm2, totalSlabAreaMm2 - usedAreaMm2),
    kerfLossAreaMm2: num(r.kerfLossAreaMm2),
    reusableOffcutAreaMm2: num(r.reusableOffcutAreaMm2, slabs.reduce((a, s) => a + s.reusableOffcutAreaMm2, 0)),
    largestOffcutAreaMm2: num(r.largestOffcutAreaMm2, slabs.reduce((a, s) => Math.max(a, s.largestOffcutAreaMm2), 0)),
    usableOffcutAreaMm2: num(r.usableOffcutAreaMm2, slabs.reduce((a, s) => a + s.usableOffcutAreaMm2, 0)),
    largestUsableOffcutAreaMm2: num(r.largestUsableOffcutAreaMm2, slabs.reduce((a, s) => Math.max(a, s.largestUsableOffcutAreaMm2), 0)),
    totalUtilizationPercent: num(r.totalUtilizationPercent, totalSlabAreaMm2 > 0 ? (usedAreaMm2 / totalSlabAreaMm2) * 100 : 0),
    totalCutCount,
    totalCutLengthMm,
    cutMetricsEstimated: !!r.cutMetricsEstimated || backfilledCuts,
    kerfMm: num(r.kerfMm),
    slabSpec,
    slabUsage,
    guillotineCuttable: r.guillotineCuttable !== false,
    config,
    seed: num(r.seed, 1),
    candidatesEvaluated: num(r.candidatesEvaluated),
    durationMs: num(r.durationMs),
  };
}

export function normalizeCutlist(id: string, raw: unknown): SavedCutlist | null {
  if (!isObj(raw)) return null;
  const c = raw as Record<string, unknown>;
  return {
    id,
    createdAt: num(c.createdAt),
    updatedAt: num(c.updatedAt),
    createdBy: typeof c.createdBy === "string" ? c.createdBy : undefined,
    name: String(c.name ?? "Разкрой"),
    status: c.status === "partial" ? "partial" : "complete",
    materialId: String(c.materialId ?? ""),
    materialName: String(c.materialName ?? "Материал"),
    thicknessMm: num(c.thicknessMm),
    orders: asArray<CutlistOrderRef>(c.orders).map((o) => ({
      id: String(o?.id ?? ""),
      number: num(o?.number),
      clientName: String(o?.clientName ?? ""),
    })),
    warnings: Array.isArray(c.warnings) ? (c.warnings as string[]) : undefined,
    result: normalizeResult(c.result),
  };
}
