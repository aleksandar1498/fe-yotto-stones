// Deterministic 2D cutting-stock optimizer for natural-stone slabs.
//
// The engine expands piece quantities into individual rectangles, tries a grid of
// sorting heuristics × packing algorithms (plus bounded seeded restarts), keeps the
// best valid layout and reports every unplaced piece. It never places a piece by any
// means other than the geometry computed here.

import { freeRectangles, inflateRect, placementRect } from "./geometry";
import { GuillotineBin, MaxRectsBin, ShelfBin, type BinPacker, type Slot } from "./packers";
import {
  DEFAULT_MIN_REUSABLE_MM,
  type Offcut,
  type OptimizeConfig,
  type OptimizeInput,
  type OptimizeResult,
  type Placement,
  type PieceSpec,
  type SlabResult,
  type UnplacedPiece,
  type UnplacedReason,
} from "./types";

type Orientation = { w: number; h: number; rotated: boolean };

type Instance = {
  piece: PieceSpec;
  instanceIndex: number;
  grainRequired: boolean;
  opts: Orientation[];
  reason: UnplacedReason | null;
  detail: string;
};

type PackerId =
  | "maxrects-bssf"
  | "maxrects-baf"
  | "maxrects-bl"
  | "guillotine-shorter"
  | "guillotine-longer"
  | "shelf";

type SortId = "area-desc" | "area-asc" | "maxdim-desc" | "mindim-desc" | "perimeter-desc" | "length-desc";

const SORT_IDS: SortId[] = ["area-desc", "area-asc", "maxdim-desc", "mindim-desc", "perimeter-desc", "length-desc"];

const FREESTYLE_PACKERS: PackerId[] = ["maxrects-bssf", "maxrects-baf", "maxrects-bl"];
const GUILLOTINE_PACKERS: PackerId[] = ["guillotine-shorter", "guillotine-longer"];

const STRATEGY_LABEL: Record<PackerId, string> = {
  "maxrects-bssf": "MaxRects · най-къс остатък",
  "maxrects-baf": "MaxRects · най-малка площ",
  "maxrects-bl": "MaxRects · долу-ляво",
  "guillotine-shorter": "Гилотина · къс остатък",
  "guillotine-longer": "Гилотина · дълъг остатък",
  shelf: "Рафтове (baseline)",
};

function makePacker(id: PackerId, w: number, h: number): BinPacker {
  switch (id) {
    case "maxrects-bssf":
      return new MaxRectsBin(w, h, "bssf");
    case "maxrects-baf":
      return new MaxRectsBin(w, h, "baf");
    case "maxrects-bl":
      return new MaxRectsBin(w, h, "bl");
    case "guillotine-shorter":
      return new GuillotineBin(w, h, "shorter");
    case "guillotine-longer":
      return new GuillotineBin(w, h, "longer");
    case "shelf":
      return new ShelfBin(w, h);
  }
}

/** Mulberry32 — tiny, fast, fully reproducible PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function orientationsFor(piece: PieceSpec, cfg: OptimizeConfig): { opts: Orientation[]; grainRequired: boolean; reason: UnplacedReason | null; detail: string } {
  const L = Math.round(piece.lengthMm);
  const W = Math.round(piece.widthMm);
  const grainRequired = cfg.grainMode === "directional" ? true : cfg.grainMode === "per-piece" ? !!piece.grainRequired : false;
  const canRotate = cfg.allowRotation && piece.rotationAllowed !== false;
  const grainAxis = cfg.slab.grainAxis ?? "length";

  if (L <= 0 || W <= 0) {
    return { opts: [], grainRequired, reason: "invalid", detail: "Липсват или са невалидни размери." };
  }

  const opts: Orientation[] = [];
  if (grainRequired) {
    if (grainAxis === "length") opts.push({ w: L, h: W, rotated: false });
    else if (canRotate) opts.push({ w: W, h: L, rotated: true });
  } else {
    opts.push({ w: L, h: W, rotated: false });
    if (canRotate && L !== W) opts.push({ w: W, h: L, rotated: true });
  }

  if (opts.length === 0) {
    return {
      opts,
      grainRequired,
      reason: "grain",
      detail: grainAxis === "width" ? "Текстурата изисква завъртане, но то е забранено." : "Няма допустима ориентация според текстурата.",
    };
  }
  return { opts, grainRequired, reason: null, detail: "" };
}

function expandInstances(pieces: PieceSpec[], cfg: OptimizeConfig): Instance[] {
  const out: Instance[] = [];
  for (const piece of pieces) {
    const qty = Math.max(0, Math.floor(piece.quantity));
    if (qty === 0) continue;
    const { opts, grainRequired, reason, detail } = orientationsFor(piece, cfg);
    for (let i = 1; i <= qty; i++) {
      out.push({ piece, instanceIndex: i, grainRequired, opts, reason, detail });
    }
  }
  return out;
}

/** A piece fits an empty slab only if at least one allowed orientation fits within the slab. */
function fitsEmpty(inst: Instance, slabLength: number, slabWidth: number): boolean {
  return inst.opts.some((o) => o.w <= slabLength && o.h <= slabWidth);
}

function sortKeyValue(inst: Instance, id: SortId): number {
  const p = inst.piece;
  const L = Math.round(p.lengthMm);
  const W = Math.round(p.widthMm);
  switch (id) {
    case "area-desc":
      return L * W;
    case "area-asc":
      return -(L * W);
    case "maxdim-desc":
      return Math.max(L, W);
    case "mindim-desc":
      return Math.min(L, W);
    case "perimeter-desc":
      return L + W;
    case "length-desc":
      return L;
    default:
      return L * W;
  }
}

function sortedInstances(list: Instance[], id: SortId, jitter?: () => number): Instance[] {
  const keyed = list.map((inst) => {
    let key = sortKeyValue(inst, id);
    if (jitter) key *= 1 + (jitter() - 0.5) * 0.3;
    return { inst, key };
  });
  keyed.sort(
    (a, b) =>
      b.key - a.key ||
      a.inst.piece.pieceId.localeCompare(b.inst.piece.pieceId) ||
      a.inst.instanceIndex - b.inst.instanceIndex
  );
  return keyed.map((k) => k.inst);
}

type BinState = { bin: BinPacker; items: { inst: Instance; slot: Slot; orient: Orientation }[] };

type Outcome = {
  slabs: SlabResult[];
  unplaced: Instance[];
  placedPieces: number;
  usedAreaMm2: number;
  wasteAreaMm2: number;
  reusableOffcutAreaMm2: number;
  kerfLossAreaMm2: number;
  cutMetricsEstimated: boolean;
};

function lexLess(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return true;
    if (a[i] > b[i]) return false;
  }
  return false;
}

function packOne(packable: Instance[], cfg: OptimizeConfig, packerId: PackerId, sortId: SortId, jitter?: () => number): Outcome {
  const k = Math.max(0, Math.round(cfg.kerfMm));
  const slabLength = Math.round(cfg.slab.lengthMm);
  const slabWidth = Math.round(cfg.slab.widthMm);
  const minReusable = Math.max(0, Math.round(cfg.minReusableMm ?? DEFAULT_MIN_REUSABLE_MM));

  const order = sortedInstances(packable, sortId, jitter);
  const bins: BinState[] = [];
  const unplaced: Instance[] = [];

  for (const inst of order) {
    let best: { bi: number; slot: Slot; o: Orientation; score: number[] } | null = null;
    for (let bi = 0; bi < bins.length; bi++) {
      for (const o of inst.opts) {
        const slot = bins[bi].bin.find({ w: o.w + k, h: o.h + k });
        if (!slot) continue;
        // Prefer the slab where the piece sits lowest/leftmost; keep natural orientation on ties.
        const score = [slot.y + slot.h, slot.x + slot.w, o.rotated ? 1 : 0, bi];
        if (!best || lexLess(score, best.score)) best = { bi, slot, o, score };
      }
    }

    if (best) {
      bins[best.bi].bin.commit(best.slot);
      bins[best.bi].items.push({ inst, slot: best.slot, orient: best.o });
      continue;
    }

    // Open a new slab and use the first (natural) orientation that fits.
    // The bin is inflated by one kerf so a piece may sit flush against the slab edge;
    // the kerf is only required *between* pieces.
    const nb = makePacker(packerId, slabLength + k, slabWidth + k);
    let chosen: { slot: Slot; o: Orientation } | null = null;
    for (const o of inst.opts) {
      const slot = nb.find({ w: o.w + k, h: o.h + k });
      if (slot) {
        chosen = { slot, o };
        break;
      }
    }
    if (!chosen) {
      unplaced.push(inst);
      continue;
    }
    nb.commit(chosen.slot);
    bins.push({ bin: nb, items: [{ inst, slot: chosen.slot, orient: chosen.o }] });
  }

  let cutMetricsEstimated = false;
  const slabs: SlabResult[] = bins.map((state, idx) => {
    const placements: Placement[] = state.items.map(({ inst, slot, orient }) => ({
      pieceId: inst.piece.pieceId,
      instanceIndex: inst.instanceIndex,
      orderId: inst.piece.orderId,
      orderNumber: inst.piece.orderNumber,
      label: inst.piece.label,
      xMm: Math.round(slot.x),
      yMm: Math.round(slot.y),
      lengthMm: Math.round(orient.w),
      widthMm: Math.round(orient.h),
      rotated: orient.rotated,
      grainRequired: inst.grainRequired,
    }));
    const usedAreaMm2 = placements.reduce((a, p) => a + p.lengthMm * p.widthMm, 0);
    const slabAreaMm2 = slabLength * slabWidth;
    // Offcuts are computed from an independent complement of the kerf-inflated piece
    // rectangles, so the accounting does not rely on a packer's internal free list.
    const occupied = placements.map((p) => inflateRect(placementRect(p), k));
    const free = freeRectangles({ x: 0, y: 0, w: slabLength, h: slabWidth }, occupied);
    const freeArea = free.reduce((a, r) => a + r.w * r.h, 0);
    const offcuts: Offcut[] = free
      .filter((r) => Math.floor(r.w) >= minReusable && Math.floor(r.h) >= minReusable)
      .map((r) => ({ xMm: Math.round(r.x), yMm: Math.round(r.y), lengthMm: Math.round(r.w), widthMm: Math.round(r.h) }));
    const reusableOffcutAreaMm2 = offcuts.reduce((a, o) => a + o.lengthMm * o.widthMm, 0);
    const kerfLossAreaMm2 = Math.max(0, slabAreaMm2 - usedAreaMm2 - freeArea);
    const metrics = state.bin.cutMetrics();
    let cutCount: number;
    let cutLengthMm: number;
    if (metrics) {
      cutCount = metrics.count;
      cutLengthMm = metrics.lengthMm;
    } else {
      cutMetricsEstimated = true;
      cutCount = placements.length;
      cutLengthMm = placements.reduce((a, p) => a + p.lengthMm + p.widthMm, 0);
    }
    return {
      slabIndex: idx + 1,
      lengthMm: slabLength,
      widthMm: slabWidth,
      placements,
      usedAreaMm2,
      slabAreaMm2,
      utilizationPercent: slabAreaMm2 > 0 ? (usedAreaMm2 / slabAreaMm2) * 100 : 0,
      offcuts,
      reusableOffcutAreaMm2,
      kerfLossAreaMm2,
      cutCount,
      cutLengthMm,
    };
  });

  const placedPieces = slabs.reduce((a, s) => a + s.placements.length, 0);
  const usedAreaMm2 = slabs.reduce((a, s) => a + s.usedAreaMm2, 0);
  const totalSlabArea = slabs.length * slabLength * slabWidth;
  const kerfLossAreaMm2 = slabs.reduce((a, s) => a + s.kerfLossAreaMm2, 0);
  const reusableOffcutAreaMm2 = slabs.reduce((a, s) => a + s.reusableOffcutAreaMm2, 0);
  return {
    slabs,
    unplaced,
    placedPieces,
    usedAreaMm2,
    wasteAreaMm2: totalSlabArea - usedAreaMm2,
    reusableOffcutAreaMm2,
    kerfLossAreaMm2,
    cutMetricsEstimated,
  };
}

/** Priority order: fewest slabs → least waste → most reusable offcut → least kerf loss. */
function isBetter(a: Outcome, b: Outcome | null): boolean {
  if (!b) return true;
  if (a.slabs.length !== b.slabs.length) return a.slabs.length < b.slabs.length;
  if (Math.abs(a.wasteAreaMm2 - b.wasteAreaMm2) > 1e-6) return a.wasteAreaMm2 < b.wasteAreaMm2;
  if (Math.abs(a.reusableOffcutAreaMm2 - b.reusableOffcutAreaMm2) > 1e-6) return a.reusableOffcutAreaMm2 > b.reusableOffcutAreaMm2;
  if (Math.abs(a.kerfLossAreaMm2 - b.kerfLossAreaMm2) > 1e-6) return a.kerfLossAreaMm2 < b.kerfLossAreaMm2;
  return false;
}

function groupUnplaced(instances: Instance[], materialId: string, materialName?: string): UnplacedPiece[] {
  const map = new Map<string, UnplacedPiece>();
  for (const inst of instances) {
    if (!inst.reason) continue;
    const existing = map.get(inst.piece.pieceId);
    if (existing) {
      existing.quantity += 1;
      continue;
    }
    map.set(inst.piece.pieceId, {
      pieceId: inst.piece.pieceId,
      orderId: inst.piece.orderId,
      orderNumber: inst.piece.orderNumber,
      label: inst.piece.label,
      materialId,
      materialName,
      lengthMm: Math.round(inst.piece.lengthMm),
      widthMm: Math.round(inst.piece.widthMm),
      quantity: 1,
      reason: inst.reason,
      detail: inst.detail || undefined,
    });
  }
  return [...map.values()];
}

function finalize(input: OptimizeInput, outcome: Outcome, strategy: string, seed: number, candidatesEvaluated: number, durationMs: number): OptimizeResult {
  const cfg = input.config;
  const slabLength = Math.round(cfg.slab.lengthMm);
  const slabWidth = Math.round(cfg.slab.widthMm);
  const totalPieces = outcome.placedPieces + outcome.unplaced.length;
  const totalSlabAreaMm2 = outcome.slabs.length * slabLength * slabWidth;
  const unplacedPieces = groupUnplaced(outcome.unplaced, input.materialId, input.materialName);
  const totalCutCount = outcome.slabs.reduce((a, s) => a + s.cutCount, 0);
  const totalCutLengthMm = outcome.slabs.reduce((a, s) => a + s.cutLengthMm, 0);

  return {
    materialId: input.materialId,
    materialName: input.materialName,
    status: outcome.unplaced.length === 0 ? "complete" : "partial",
    strategy,
    slabs: outcome.slabs,
    slabsUsed: outcome.slabs.length,
    unplacedPieces,
    totalPieces,
    placedPieces: outcome.placedPieces,
    unplacedCount: outcome.unplaced.length,
    totalSlabAreaMm2,
    usedAreaMm2: outcome.usedAreaMm2,
    wasteAreaMm2: totalSlabAreaMm2 - outcome.usedAreaMm2,
    kerfLossAreaMm2: outcome.kerfLossAreaMm2,
    reusableOffcutAreaMm2: outcome.reusableOffcutAreaMm2,
    totalUtilizationPercent: totalSlabAreaMm2 > 0 ? (outcome.usedAreaMm2 / totalSlabAreaMm2) * 100 : 0,
    totalCutCount,
    totalCutLengthMm,
    cutMetricsEstimated: outcome.cutMetricsEstimated,
    kerfMm: Math.max(0, Math.round(cfg.kerfMm)),
    slabSpec: { ...cfg.slab, lengthMm: slabLength, widthMm: slabWidth, grainAxis: cfg.slab.grainAxis ?? "length" },
    config: cfg,
    seed,
    candidatesEvaluated,
    durationMs,
  };
}

/** Runs many candidate layouts and returns the best one found. */
export function optimize(input: OptimizeInput): OptimizeResult {
  const started = Date.now();
  const cfg = input.config;
  const seed = cfg.seed ?? 1;
  const maxCandidates = Math.max(1, cfg.maxCandidates ?? 60);
  const timeLimitMs = Math.max(1, cfg.timeLimitMs ?? 1500);
  const slabLength = Math.round(cfg.slab.lengthMm);
  const slabWidth = Math.round(cfg.slab.widthMm);

  const instances = expandInstances(input.pieces, cfg);
  // Pieces that cannot fit any empty slab (or violate grain) are unplaceable regardless of strategy.
  const packable = instances.filter((inst) => {
    if (inst.reason) return false;
    if (!fitsEmpty(inst, slabLength, slabWidth)) {
      inst.reason = "exceeds-slab";
      inst.detail = `По-голям от плочата ${slabLength}×${slabWidth} мм.`;
      return false;
    }
    return true;
  });

  const basePackers = cfg.cuttingMode === "guillotine" ? GUILLOTINE_PACKERS : FREESTYLE_PACKERS;
  const packers: PackerId[] = [...basePackers, "shelf"]; // shelf guarantees we never do worse than first-fit

  let best: Outcome | null = null;
  let bestStrategy = "";
  let evaluated = 0;

  const consider = (outcome: Outcome, strategy: string) => {
    if (isBetter(outcome, best)) {
      best = outcome;
      bestStrategy = strategy;
    }
  };

  // Phase 1 — deterministic grid (must be explored before any random restart).
  for (const packerId of packers) {
    for (const sortId of SORT_IDS) {
      if (evaluated >= maxCandidates) break;
      consider(packOne(packable, cfg, packerId, sortId), `${STRATEGY_LABEL[packerId]} · ${sortId}`);
      evaluated++;
    }
  }

  // Phase 2 — bounded seeded restarts with a perturbed sort order.
  let restart = 0;
  while (evaluated < maxCandidates && Date.now() - started < timeLimitMs) {
    const rng = mulberry32(seed + restart * 101);
    const packerId = packers[restart % packers.length];
    const sortId = SORT_IDS[(restart + 3) % SORT_IDS.length];
    consider(packOne(packable, cfg, packerId, sortId, rng), `${STRATEGY_LABEL[packerId]} · ${sortId} · r${restart + 1}`);
    restart++;
    evaluated++;
  }

  // `best` is always set: the deterministic grid always runs at least one candidate.
  const outcome = best as unknown as Outcome;
  // Any piece the winning layout could not place gets an explicit, honest reason.
  for (const inst of outcome.unplaced) {
    if (!inst.reason) {
      inst.reason = "search-exhausted";
      inst.detail = "Не е намерено място в рамките на зададеното търсене.";
    }
  }
  const unplacedInstances = instances.filter((i) => i.reason !== null);
  const finalOutcome: Outcome = { ...outcome, unplaced: unplacedInstances };

  return finalize(input, finalOutcome, bestStrategy, seed, evaluated, Date.now() - started);
}

/** Baseline the optimizer must beat on representative data: shelf packing with area-desc sort. */
export function firstFitBaseline(input: OptimizeInput): OptimizeResult {
  const started = Date.now();
  const cfg = input.config;
  const slabLength = Math.round(cfg.slab.lengthMm);
  const slabWidth = Math.round(cfg.slab.widthMm);
  const instances = expandInstances(input.pieces, cfg);
  const packable = instances.filter((inst) => {
    if (inst.reason) return false;
    if (!fitsEmpty(inst, slabLength, slabWidth)) {
      inst.reason = "exceeds-slab";
      inst.detail = `По-голям от плочата ${slabLength}×${slabWidth} мм.`;
      return false;
    }
    return true;
  });
  const outcome = packOne(packable, cfg, "shelf", "area-desc");
  for (const inst of outcome.unplaced) {
    if (!inst.reason) {
      inst.reason = "search-exhausted";
      inst.detail = "Не е намерено място в рамките на зададеното търсене.";
    }
  }
  const unplacedInstances = instances.filter((i) => i.reason !== null);
  return finalize(
    input,
    { ...outcome, unplaced: unplacedInstances },
    `${STRATEGY_LABEL.shelf} · area-desc`,
    cfg.seed ?? 1,
    1,
    Date.now() - started
  );
}
