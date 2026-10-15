// Deterministic 2D cutting-stock optimizer for natural-stone slabs.
//
// The engine expands piece quantities into individual rectangles, tries a grid of
// sorting heuristics × packing algorithms (plus bounded seeded restarts), keeps the
// best valid layout and reports every unplaced piece. It never places a piece by any
// means other than the geometry computed here.

import { freeRectangles, inflateRect, isGuillotineCuttable, placementRect } from "./geometry";
import { GuillotineBin, MaxRectsBin, ShelfBin, type BinPacker, type Slot } from "./packers";
import { offcutFitsProduct } from "./standards";
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
  | "bands"
  | "shelf";

type SortId = "area-desc" | "area-asc" | "maxdim-desc" | "maxdim-asc" | "mindim-desc" | "perimeter-desc" | "length-desc";

const SORT_IDS: SortId[] = ["area-desc", "area-asc", "maxdim-desc", "maxdim-asc", "mindim-desc", "perimeter-desc", "length-desc"];

const FREESTYLE_PACKERS: PackerId[] = ["maxrects-bssf", "maxrects-baf", "maxrects-bl"];
const GUILLOTINE_PACKERS: PackerId[] = ["guillotine-shorter", "guillotine-longer"];

const STRATEGY_LABEL: Record<PackerId, string> = {
  "maxrects-bssf": "MaxRects · най-къс остатък",
  "maxrects-baf": "MaxRects · най-малка площ",
  "maxrects-bl": "MaxRects · долу-ляво",
  "guillotine-shorter": "Гилотина · къс остатък",
  "guillotine-longer": "Гилотина · дълъг остатък",
  bands: "Ленти (редове + колони)",
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
    case "bands":
      // Band packing never reaches a BinPacker; provided for exhaustiveness.
      return new ShelfBin(w, h);
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

  let opts: Orientation[] = [];
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

  // Optional orientation preference: pin the piece's length axis along the slab length (natural) or width (rotated).
  const pref = cfg.orientation ?? "auto";
  if (pref !== "auto" && L !== W) {
    const wanted = pref === "width";
    const filtered = opts.filter((o) => o.rotated === wanted);
    if (filtered.length === 0) {
      return { opts: [], grainRequired, reason: "orientation", detail: "Изискваната ориентация е невъзможна (завъртането е забранено)." };
    }
    opts = filtered;
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

/** A piece fits a slab only if at least one allowed orientation fits within it. */
function fitsSlab(inst: Instance, slabLength: number, slabWidth: number): boolean {
  return inst.opts.some((o) => o.w <= slabLength && o.h <= slabWidth);
}

type PoolEntry = { slabLength: number; slabWidth: number; binW: number; binH: number; qty: number; used: number };

/** Normalises the available-slab pool (priority order preserved). Falls back to the single `slab`. */
function buildPool(cfg: OptimizeConfig, k: number): PoolEntry[] {
  const source =
    cfg.slabPool && cfg.slabPool.length
      ? cfg.slabPool
      : [{ lengthMm: cfg.slab.lengthMm, widthMm: cfg.slab.widthMm, qty: Number.POSITIVE_INFINITY }];
  return source.map((e) => {
    const slabLength = Math.round(e.lengthMm);
    const slabWidth = Math.round(e.widthMm);
    return {
      slabLength,
      slabWidth,
      binW: slabLength + k,
      binH: slabWidth + k,
      qty: Number.isFinite(e.qty) ? Math.max(0, Math.floor(e.qty)) : Number.POSITIVE_INFINITY,
      used: 0,
    };
  });
}

/** A piece is placeable if it fits at least one still-available pool size. */
function fitsPool(inst: Instance, pool: PoolEntry[]): boolean {
  return pool.some((p) => p.qty > 0 && fitsSlab(inst, p.slabLength, p.slabWidth));
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
    case "maxdim-asc":
      return -Math.max(L, W);
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
    if (jitter) key *= 1 + (jitter() - 0.5) * 0.5;
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

type BinState = { bin: BinPacker; items: { inst: Instance; slot: Slot; orient: Orientation }[]; slabLength: number; slabWidth: number };

type Outcome = {
  slabs: SlabResult[];
  unplaced: Instance[];
  placedPieces: number;
  usedAreaMm2: number;
  wasteAreaMm2: number;
  reusableOffcutAreaMm2: number;
  largestOffcutAreaMm2: number;
  usableOffcutAreaMm2: number;
  largestUsableOffcutAreaMm2: number;
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

function buildSlabResult(
  placements: Placement[],
  slabLength: number,
  slabWidth: number,
  cfg: OptimizeConfig,
  idx: number,
  cutInfo: { count: number; lengthMm: number } | null
): SlabResult {
  const k = Math.max(0, Math.round(cfg.kerfMm));
  const minReusable = Math.max(0, Math.round(cfg.minReusableMm ?? DEFAULT_MIN_REUSABLE_MM));
  const minOffcutLength = Math.max(0, Math.round(cfg.minOffcutLengthMm ?? 0));
  const minOffcutWidth = Math.max(0, Math.round(cfg.minOffcutWidthMm ?? 0));

  const usedAreaMm2 = placements.reduce((a, p) => a + p.lengthMm * p.widthMm, 0);
  const slabAreaMm2 = slabLength * slabWidth;
  // Offcuts come from an independent complement of the kerf-inflated pieces.
  const occupied = placements.map((p) => inflateRect(placementRect(p), k));
  const free = freeRectangles({ x: 0, y: 0, w: slabLength, h: slabWidth }, occupied);
  const freeArea = free.reduce((a, r) => a + r.w * r.h, 0);
  const offcuts: Offcut[] = free
    .filter((r) => Math.floor(r.w) >= minReusable && Math.floor(r.h) >= minReusable)
    .map((r) => ({ xMm: Math.round(r.x), yMm: Math.round(r.y), lengthMm: Math.round(r.w), widthMm: Math.round(r.h) }));
  const reusableOffcutAreaMm2 = offcuts.reduce((a, o) => a + o.lengthMm * o.widthMm, 0);
  const largestOffcutAreaMm2 = offcuts.reduce((a, o) => Math.max(a, o.lengthMm * o.widthMm), 0);
  const usableOffcuts = offcuts.filter((o) => offcutFitsProduct(o, minOffcutLength, minOffcutWidth));
  const usableOffcutAreaMm2 = usableOffcuts.reduce((a, o) => a + o.lengthMm * o.widthMm, 0);
  const largestUsableOffcutAreaMm2 = usableOffcuts.reduce((a, o) => Math.max(a, o.lengthMm * o.widthMm), 0);
  const kerfLossAreaMm2 = Math.max(0, slabAreaMm2 - usedAreaMm2 - freeArea);
  const cutCount = cutInfo ? cutInfo.count : placements.length;
  const cutLengthMm = cutInfo ? cutInfo.lengthMm : placements.reduce((a, p) => a + p.lengthMm + p.widthMm, 0);

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
    largestOffcutAreaMm2,
    usableOffcutAreaMm2,
    largestUsableOffcutAreaMm2,
    kerfLossAreaMm2,
    cutCount,
    cutLengthMm,
  };
}

function packOne(packable: Instance[], cfg: OptimizeConfig, packerId: PackerId, sortId: SortId, jitter?: () => number): Outcome {
  if (packerId === "bands") return packBands(packable, cfg);
  const k = Math.max(0, Math.round(cfg.kerfMm));
  const pool = buildPool(cfg, k);

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

    // Open a new slab from the pool, honouring priority order (first size that fits and has stock).
    // The bin is inflated by one kerf so a piece may sit flush against the slab edge.
    let opened = false;
    for (const entry of pool) {
      if (entry.used >= entry.qty) continue;
      const nb = makePacker(packerId, entry.binW, entry.binH);
      let chosen: { slot: Slot; o: Orientation } | null = null;
      for (const o of inst.opts) {
        const slot = nb.find({ w: o.w + k, h: o.h + k });
        if (slot) {
          chosen = { slot, o };
          break;
        }
      }
      if (!chosen) continue;
      entry.used++;
      nb.commit(chosen.slot);
      bins.push({ bin: nb, items: [{ inst, slot: chosen.slot, orient: chosen.o }], slabLength: entry.slabLength, slabWidth: entry.slabWidth });
      opened = true;
      break;
    }
    if (!opened) unplaced.push(inst);
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
    const cutInfo = state.bin.cutMetrics();
    if (!cutInfo) cutMetricsEstimated = true;
    return buildSlabResult(placements, state.slabLength, state.slabWidth, cfg, idx, cutInfo);
  });

  const placedPieces = slabs.reduce((a, s) => a + s.placements.length, 0);
  const usedAreaMm2 = slabs.reduce((a, s) => a + s.usedAreaMm2, 0);
  const totalSlabArea = slabs.reduce((a, s) => a + s.lengthMm * s.widthMm, 0);
  const kerfLossAreaMm2 = slabs.reduce((a, s) => a + s.kerfLossAreaMm2, 0);
  const reusableOffcutAreaMm2 = slabs.reduce((a, s) => a + s.reusableOffcutAreaMm2, 0);
  const largestOffcutAreaMm2 = slabs.reduce((a, s) => Math.max(a, s.largestOffcutAreaMm2), 0);
  const usableOffcutAreaMm2 = slabs.reduce((a, s) => a + s.usableOffcutAreaMm2, 0);
  const largestUsableOffcutAreaMm2 = slabs.reduce((a, s) => Math.max(a, s.largestUsableOffcutAreaMm2), 0);
  return {
    slabs,
    unplaced,
    placedPieces,
    usedAreaMm2,
    wasteAreaMm2: totalSlabArea - usedAreaMm2,
    reusableOffcutAreaMm2,
    largestOffcutAreaMm2,
    usableOffcutAreaMm2,
    largestUsableOffcutAreaMm2,
    kerfLossAreaMm2,
    cutMetricsEstimated,
  };
}

function toPlacement(inst: Instance, orient: Orientation, xMm: number, yMm: number): Placement {
  return {
    pieceId: inst.piece.pieceId,
    instanceIndex: inst.instanceIndex,
    orderId: inst.piece.orderId,
    orderNumber: inst.piece.orderNumber,
    label: inst.piece.label,
    xMm: Math.round(xMm),
    yMm: Math.round(yMm),
    lengthMm: Math.round(orient.w),
    widthMm: Math.round(orient.h),
    rotated: orient.rotated,
    grainRequired: inst.grainRequired,
  };
}

type BandPlacement = { inst: Instance; orient: Orientation; xMm: number; yMm: number };

/**
 * Row + column band layout for one slab (guillotine-friendly, like the reference tools):
 * the longest pieces go as horizontal rows (length along the slab length), the rest as
 * vertical columns side-by-side along the bottom (length along the slab width), leaving
 * one clean rectangular band at the top when possible.
 */
function bandPackSlab(
  pieces: Instance[],
  L: number,
  W: number,
  k: number,
  cfg: OptimizeConfig
): { placements: BandPlacement[]; rest: Instance[] } {
  const naturalOf = (inst: Instance) => inst.opts.find((o) => !o.rotated);
  const rotatedOf = (inst: Instance) => inst.opts.find((o) => o.rotated);
  const sorted = [...pieces].sort(
    (a, b) =>
      b.piece.lengthMm - a.piece.lengthMm ||
      b.piece.widthMm - a.piece.widthMm ||
      a.piece.pieceId.localeCompare(b.piece.pieceId)
  );

  type Candidate = { rows: BandPlacement[]; cols: BandPlacement[]; rest: Instance[]; largestUsable: number };
  let best: Candidate | null = null;

  for (let s = 0; s <= sorted.length; s++) {
    const rowsCand = sorted.slice(0, s);
    const colsCand = sorted.slice(s);
    if (rowsCand.some((i) => !naturalOf(i))) continue;
    if (colsCand.some((i) => !rotatedOf(i))) continue;

    const rest: Instance[] = [];

    // Columns: side by side from x = 0, sitting on the bottom edge.
    let x = 0;
    let colTop = W;
    const cols: BandPlacement[] = [];
    for (const inst of colsCand) {
      const o = rotatedOf(inst)!;
      const wExt = o.w;
      const hExt = o.h;
      if (hExt > W || x + (x > 0 ? k : 0) + wExt > L) {
        rest.push(inst);
        continue;
      }
      x += x > 0 ? k : 0;
      const y = W - hExt;
      cols.push({ inst, orient: o, xMm: x, yMm: y });
      colTop = Math.min(colTop, y);
      x += wExt;
    }
    const colsHeight = cols.length ? W - colTop : 0;

    // Rows: shelves stacked above the columns, filled side-by-side (several pieces per row).
    const rowsBottom = W - colsHeight - (cols.length ? k : 0);
    const shelves: { y: number; h: number; usedW: number }[] = [];
    const rows: BandPlacement[] = [];
    for (const inst of rowsCand) {
      const o = naturalOf(inst)!;
      const lExt = o.w;
      const wExt = o.h;
      if (lExt > L) {
        rest.push(inst);
        continue;
      }
      let placed = false;
      for (const sh of shelves) {
        if (wExt <= sh.h && sh.usedW + (sh.usedW > 0 ? k : 0) + lExt <= L) {
          const x = sh.usedW + (sh.usedW > 0 ? k : 0);
          rows.push({ inst, orient: o, xMm: x, yMm: sh.y });
          sh.usedW = x + lExt;
          placed = true;
          break;
        }
      }
      if (placed) continue;
      const prev = shelves[shelves.length - 1];
      const y = prev ? prev.y - k - wExt : rowsBottom - wExt;
      if (y < 0) {
        rest.push(inst);
        continue;
      }
      shelves.push({ y, h: wExt, usedW: lExt });
      rows.push({ inst, orient: o, xMm: 0, yMm: y });
    }

    const placements = [...rows, ...cols];
    if (placements.length === 0) continue;
    const pb = placements.map((p) => toPlacement(p.inst, p.orient, p.xMm, p.yMm));
    const slabRes = buildSlabResult(pb, L, W, cfg, 0, null);

    const better =
      !best ||
      rest.length < best.rest.length ||
      (rest.length === best.rest.length && slabRes.largestUsableOffcutAreaMm2 > best.largestUsable &&
        slabRes.largestUsableOffcutAreaMm2 > 0);
    if (better) best = { rows, cols, rest, largestUsable: slabRes.largestUsableOffcutAreaMm2 };
  }

  if (!best) return { placements: [], rest: pieces };
  return { placements: [...best.rows, ...best.cols], rest: best.rest };
}

/** Packs the whole material using the row/column band strategy across the slab pool. */
function packBands(packable: Instance[], cfg: OptimizeConfig): Outcome {
  const k = Math.max(0, Math.round(cfg.kerfMm));
  const pool = buildPool(cfg, k);
  const slabs: SlabResult[] = [];
  const unplaced: Instance[] = [];
  let remaining = [...packable];
  let idx = 0;
  let guard = 0;

  while (remaining.length > 0 && guard++ < 1000) {
    const entry = pool.find((p) => p.used < p.qty);
    if (!entry) {
      unplaced.push(...remaining);
      break;
    }

    // The band structure often fits better when the slab is used the other way round
    // (long side vertical), so evaluate both orientations when grain allows it.
    const orientations: [number, number][] =
      cfg.grainMode === "none" && entry.slabLength !== entry.slabWidth
        ? [
            [entry.slabLength, entry.slabWidth],
            [entry.slabWidth, entry.slabLength],
          ]
        : [[entry.slabLength, entry.slabWidth]];

    let chosen: { L: number; W: number; placements: BandPlacement[]; rest: Instance[] } | null = null;
    let chosenUsable = -1;
    for (const [L, W] of orientations) {
      const r = bandPackSlab(remaining, L, W, k, cfg);
      if (r.placements.length === 0) continue;
      const use = r.placements.map((p) => toPlacement(p.inst, p.orient, p.xMm, p.yMm));
      const usable = buildSlabResult(use, L, W, cfg, 0, null).largestUsableOffcutAreaMm2;
      const better =
        !chosen || r.rest.length < chosen.rest.length || (r.rest.length === chosen.rest.length && usable > chosenUsable);
      if (better) {
        chosen = { L, W, placements: r.placements, rest: r.rest };
        chosenUsable = usable;
      }
    }

    if (!chosen || chosen.placements.length === 0) {
      unplaced.push(...remaining);
      break;
    }
    entry.used++;
    const pb = chosen.placements.map((p) => toPlacement(p.inst, p.orient, p.xMm, p.yMm));
    slabs.push(buildSlabResult(pb, chosen.L, chosen.W, cfg, idx++, null));
    remaining = chosen.rest;
  }

  const placedPieces = slabs.reduce((a, s) => a + s.placements.length, 0);
  const usedAreaMm2 = slabs.reduce((a, s) => a + s.usedAreaMm2, 0);
  const totalSlabArea = slabs.reduce((a, s) => a + s.lengthMm * s.widthMm, 0);
  return {
    slabs,
    unplaced,
    placedPieces,
    usedAreaMm2,
    wasteAreaMm2: totalSlabArea - usedAreaMm2,
    reusableOffcutAreaMm2: slabs.reduce((a, s) => a + s.reusableOffcutAreaMm2, 0),
    largestOffcutAreaMm2: slabs.reduce((a, s) => Math.max(a, s.largestOffcutAreaMm2), 0),
    usableOffcutAreaMm2: slabs.reduce((a, s) => a + s.usableOffcutAreaMm2, 0),
    largestUsableOffcutAreaMm2: slabs.reduce((a, s) => Math.max(a, s.largestUsableOffcutAreaMm2), 0),
    kerfLossAreaMm2: slabs.reduce((a, s) => a + s.kerfLossAreaMm2, 0),
    cutMetricsEstimated: true,
  };
}

/** Priority: fewest slabs → least waste → biggest single usable offcut → most usable → most reusable → least kerf. */
function isBetter(a: Outcome, b: Outcome | null): boolean {
  if (!b) return true;
  if (a.slabs.length !== b.slabs.length) return a.slabs.length < b.slabs.length;
  if (Math.abs(a.wasteAreaMm2 - b.wasteAreaMm2) > 1e-6) return a.wasteAreaMm2 < b.wasteAreaMm2;
  // A single large sellable offcut matters more than plenty of scrap, so this comes first.
  if (Math.abs(a.largestUsableOffcutAreaMm2 - b.largestUsableOffcutAreaMm2) > 1e-6)
    return a.largestUsableOffcutAreaMm2 > b.largestUsableOffcutAreaMm2;
  if (Math.abs(a.usableOffcutAreaMm2 - b.usableOffcutAreaMm2) > 1e-6) return a.usableOffcutAreaMm2 > b.usableOffcutAreaMm2;
  if (Math.abs(a.reusableOffcutAreaMm2 - b.reusableOffcutAreaMm2) > 1e-6) return a.reusableOffcutAreaMm2 > b.reusableOffcutAreaMm2;
  if (Math.abs(a.largestOffcutAreaMm2 - b.largestOffcutAreaMm2) > 1e-6) return a.largestOffcutAreaMm2 > b.largestOffcutAreaMm2;
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
  const totalSlabAreaMm2 = outcome.slabs.reduce((a, s) => a + s.lengthMm * s.widthMm, 0);
  const unplacedPieces = groupUnplaced(outcome.unplaced, input.materialId, input.materialName);
  const totalCutCount = outcome.slabs.reduce((a, s) => a + s.cutCount, 0);
  const totalCutLengthMm = outcome.slabs.reduce((a, s) => a + s.cutLengthMm, 0);

  // Per-size usage so the UI can show how many slabs of each available size were consumed.
  const usageMap = new Map<string, { lengthMm: number; widthMm: number; used: number; available: number }>();
  const usageKey = (a: number, b: number) => `${Math.min(a, b)}x${Math.max(a, b)}`;
  for (const e of cfg.slabPool ?? []) {
    const L = Math.round(e.lengthMm);
    const W = Math.round(e.widthMm);
    const key = usageKey(L, W);
    const available = Math.max(0, Math.floor(e.qty));
    const cur = usageMap.get(key);
    if (cur) cur.available += available;
    else usageMap.set(key, { lengthMm: L, widthMm: W, used: 0, available });
  }
  for (const s of outcome.slabs) {
    const key = usageKey(s.lengthMm, s.widthMm);
    const cur = usageMap.get(key) ?? { lengthMm: s.lengthMm, widthMm: s.widthMm, used: 0, available: 0 };
    cur.used += 1;
    usageMap.set(key, cur);
  }
  const slabUsage = [...usageMap.values()];
  // Executability on a 2-axis bridge saw: every slab must be decomposable by straight through cuts.
  const guillotineCuttable = outcome.slabs.every((s) =>
    isGuillotineCuttable({ lengthMm: s.lengthMm, widthMm: s.widthMm }, s.placements)
  );

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
    largestOffcutAreaMm2: outcome.largestOffcutAreaMm2,
    usableOffcutAreaMm2: outcome.usableOffcutAreaMm2,
    largestUsableOffcutAreaMm2: outcome.largestUsableOffcutAreaMm2,
    totalUtilizationPercent: totalSlabAreaMm2 > 0 ? (outcome.usedAreaMm2 / totalSlabAreaMm2) * 100 : 0,
    totalCutCount,
    totalCutLengthMm,
    cutMetricsEstimated: outcome.cutMetricsEstimated,
    kerfMm: Math.max(0, Math.round(cfg.kerfMm)),
    slabSpec: { ...cfg.slab, lengthMm: slabLength, widthMm: slabWidth, grainAxis: cfg.slab.grainAxis ?? "length" },
    slabUsage,
    guillotineCuttable,
    config: cfg,
    seed,
    candidatesEvaluated,
    durationMs,
  };
}

const MERGE_PACKERS: PackerId[] = ["guillotine-shorter", "guillotine-longer", "bands"];

/**
 * Tries to collapse the last two slabs into one: their pieces are re-packed together
 * (guillotine packers only). The merge is kept only when everything fits on one slab
 * and the result stays guillotine-cuttable.
 */
function mergeLastSlabs(outcome: Outcome, keyToInstance: Map<string, Instance>, cfg: OptimizeConfig): Outcome {
  if (outcome.slabs.length < 2) return outcome;
  const pool =
    cfg.slabPool && cfg.slabPool.length
      ? cfg.slabPool
      : [{ lengthMm: cfg.slab.lengthMm, widthMm: cfg.slab.widthMm, qty: Number.POSITIVE_INFINITY }];
  let slabs = outcome.slabs.map((s) => ({ ...s }));
  let guard = 0;

  while (slabs.length >= 2 && guard++ < 20) {
    const a = slabs[slabs.length - 2];
    const b = slabs[slabs.length - 1];
    const insts: Instance[] = [];
    for (const p of [...a.placements, ...b.placements]) {
      const inst = keyToInstance.get(`${p.pieceId}#${p.instanceIndex}`);
      if (inst) insts.push(inst);
    }
    if (insts.length === 0) break;

    let mergedSlab: SlabResult | null = null;
    for (const e of pool) {
      if (mergedSlab) break;
      const dims = { lengthMm: Math.round(e.lengthMm), widthMm: Math.round(e.widthMm) };
      const subCfg: OptimizeConfig = { ...cfg, slab: { ...cfg.slab, ...dims }, slabPool: [{ ...dims, qty: 1 }] };
      for (const packerId of MERGE_PACKERS) {
        if (mergedSlab) break;
        for (const sortId of SORT_IDS) {
          const o = packOne(insts, subCfg, packerId, sortId);
          if (o.slabs.length !== 1 || o.unplaced.length !== 0 || o.slabs[0].placements.length !== insts.length) continue;
          const sres = buildSlabResult(o.slabs[0].placements, o.slabs[0].lengthMm, o.slabs[0].widthMm, cfg, slabs.length - 2, null);
          if (isGuillotineCuttable({ lengthMm: sres.lengthMm, widthMm: sres.widthMm }, sres.placements)) {
            mergedSlab = sres;
            break;
          }
        }
      }
    }
    if (!mergedSlab) break;
    slabs = [...slabs.slice(0, -2), mergedSlab];
  }

  if (slabs.length === outcome.slabs.length) return outcome;

  const placedPieces = slabs.reduce((a, s) => a + s.placements.length, 0);
  const usedAreaMm2 = slabs.reduce((a, s) => a + s.usedAreaMm2, 0);
  const totalSlabArea = slabs.reduce((a, s) => a + s.lengthMm * s.widthMm, 0);
  return {
    slabs,
    unplaced: outcome.unplaced,
    placedPieces,
    usedAreaMm2,
    wasteAreaMm2: totalSlabArea - usedAreaMm2,
    reusableOffcutAreaMm2: slabs.reduce((a, s) => a + s.reusableOffcutAreaMm2, 0),
    largestOffcutAreaMm2: slabs.reduce((a, s) => Math.max(a, s.largestOffcutAreaMm2), 0),
    usableOffcutAreaMm2: slabs.reduce((a, s) => a + s.usableOffcutAreaMm2, 0),
    largestUsableOffcutAreaMm2: slabs.reduce((a, s) => Math.max(a, s.largestUsableOffcutAreaMm2), 0),
    kerfLossAreaMm2: slabs.reduce((a, s) => a + s.kerfLossAreaMm2, 0),
    cutMetricsEstimated: true,
  };
}

export type CutlistSearch = {
  /** Evaluates one candidate layout; returns false when the budget is exhausted or stopped. */
  step(): boolean;
  /** Stops early; the best layout found so far is kept. */
  stop(): void;
  readonly evaluated: number;
  readonly total: number;
  readonly done: boolean;
  /** true when the most recent step() improved the best layout. */
  readonly lastImproved: boolean;
  result(): OptimizeResult;
};

/**
 * Anytime optimizer: callers can step() candidate by candidate, watch the best-so-far
 * improve, and stop() as soon as the layout looks good. optimize() runs it to completion.
 * The deterministic grid always runs first, so the very first layout is already valid.
 */
export function createSearch(input: OptimizeInput): CutlistSearch {
  const started = Date.now();
  const cfg = input.config;
  const seed = cfg.seed ?? 1;
  const maxCandidates = Math.max(1, cfg.maxCandidates ?? 60);
  const timeLimitMs = Math.max(1, cfg.timeLimitMs ?? 1500);

  const instances = expandInstances(input.pieces, cfg);
  // Pieces that cannot fit any available slab (or violate grain/orientation) can never be placed.
  const pool0 = buildPool(cfg, Math.max(0, Math.round(cfg.kerfMm)));
  const packable = instances.filter((inst) => {
    if (inst.reason) return false;
    if (!fitsPool(inst, pool0)) {
      inst.reason = "exceeds-slab";
      inst.detail = "По-голям от наличните плочи.";
      return false;
    }
    return true;
  });

  const basePackers = cfg.cuttingMode === "guillotine" ? GUILLOTINE_PACKERS : FREESTYLE_PACKERS;
  const packers: PackerId[] = [...basePackers, "bands", "shelf"]; // bands + shelf guarantee a strong, cuttable baseline
  const gridCount = packers.length * SORT_IDS.length;

  let index = 0;
  let evaluated = 0;
  let best: Outcome | null = null;
  let bestStrategy = "";
  let lastImproved = false;
  let stopped = false;

  const taskAt = (i: number) => {
    if (i < gridCount) {
      const packerId = packers[Math.floor(i / SORT_IDS.length)];
      const sortId = SORT_IDS[i % SORT_IDS.length];
      return { packerId, sortId, jitter: undefined as (() => number) | undefined, label: `${STRATEGY_LABEL[packerId]} · ${sortId}` };
    }
    const r = i - gridCount;
    const packerId = packers[r % packers.length];
    const sortId = SORT_IDS[(r + 3) % SORT_IDS.length];
    return { packerId, sortId, jitter: mulberry32(seed + r * 101), label: `${STRATEGY_LABEL[packerId]} · ${sortId} · r${r + 1}` };
  };

  const isDone = () => stopped || evaluated >= maxCandidates || (evaluated > 0 && Date.now() - started >= timeLimitMs);

  return {
    step() {
      if (isDone()) return false;
      const t = taskAt(index);
      const outcome = packOne(packable, cfg, t.packerId, t.sortId, t.jitter);
      lastImproved = isBetter(outcome, best);
      if (lastImproved) {
        best = outcome;
        bestStrategy = t.label;
      }
      index++;
      evaluated++;
      return true;
    },
    stop() {
      stopped = true;
    },
    get evaluated() {
      return evaluated;
    },
    get total() {
      return maxCandidates;
    },
    get done() {
      return isDone();
    },
    get lastImproved() {
      return lastImproved;
    },
    result() {
      const fallback = taskAt(0);
      const outcome = (best ?? packOne(packable, cfg, fallback.packerId, fallback.sortId)) as Outcome;
      const strategy = best ? bestStrategy : fallback.label;
      // Any piece the winning layout could not place gets an explicit, honest reason.
      for (const inst of outcome.unplaced) {
        if (!inst.reason) {
          inst.reason = "search-exhausted";
          inst.detail = "Не е намерено място в рамките на зададеното търсене.";
        }
      }
      const unplacedInstances = instances.filter((i) => i.reason !== null);
      const keyToInstance = new Map(instances.map((i) => [`${i.piece.pieceId}#${i.instanceIndex}`, i] as const));
      const merged = mergeLastSlabs({ ...outcome, unplaced: unplacedInstances }, keyToInstance, cfg);
      return finalize(input, merged, strategy, seed, evaluated, Date.now() - started);
    },
  };
}

/** Runs the search to completion and returns the best layout found. */
export function optimize(input: OptimizeInput): OptimizeResult {
  const search = createSearch(input);
  while (search.step()) {
    /* evaluate every candidate */
  }
  return search.result();
}

/** Baseline the optimizer must beat on representative data: shelf packing with area-desc sort. */
export function firstFitBaseline(input: OptimizeInput): OptimizeResult {
  const started = Date.now();
  const cfg = input.config;
  const instances = expandInstances(input.pieces, cfg);
  const pool0 = buildPool(cfg, Math.max(0, Math.round(cfg.kerfMm)));
  const packable = instances.filter((inst) => {
    if (inst.reason) return false;
    if (!fitsPool(inst, pool0)) {
      inst.reason = "exceeds-slab";
      inst.detail = "По-голям от наличните плочи.";
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
