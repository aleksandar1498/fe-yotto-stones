// Independent geometric validation and small rectangle helpers.
//
// These checks are deliberately separate from the packing algorithms so that a
// test (or a paranoid caller) can confirm a produced layout is physically valid
// without trusting the optimizer itself.

import type { GrainMode, OptimizeResult, Placement, PieceSpec, SlabSpec } from "./types";

export type Rect = { x: number; y: number; w: number; h: number };

export const rectArea = (r: Rect): number => Math.max(0, r.w) * Math.max(0, r.h);

/** Strict overlap test — touching edges are not an overlap. */
export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function rectInside(r: Rect, outer: Rect, tol = 0): boolean {
  return (
    r.x >= outer.x - tol &&
    r.y >= outer.y - tol &&
    r.x + r.w <= outer.x + outer.w + tol &&
    r.y + r.h <= outer.y + outer.h + tol
  );
}

export const placementRect = (p: Placement): Rect => ({ x: p.xMm, y: p.yMm, w: p.lengthMm, h: p.widthMm });

export const inflateRect = (r: Rect, by: number): Rect => ({ x: r.x, y: r.y, w: r.w + by, h: r.h + by });

function clipRect(r: Rect, bounds: Rect): Rect {
  const x = Math.max(r.x, bounds.x);
  const y = Math.max(r.y, bounds.y);
  const right = Math.min(r.x + r.w, bounds.x + bounds.w);
  const bottom = Math.min(r.y + r.h, bounds.y + bounds.h);
  return { x, y, w: Math.max(0, right - x), h: Math.max(0, bottom - y) };
}

function mergeCells(cells: Rect[]): Rect[] {
  if (cells.length === 0) return [];
  const horizontal = [...cells].sort((a, b) => a.y - b.y || a.x - b.x);
  const byRow: Rect[] = [];
  for (const c of horizontal) {
    const prev = byRow[byRow.length - 1];
    if (prev && prev.y === c.y && prev.h === c.h && Math.abs(prev.x + prev.w - c.x) < 1e-9) prev.w += c.w;
    else byRow.push({ ...c });
  }
  const vertical = byRow.sort((a, b) => a.x - b.x || a.y - b.y);
  const out: Rect[] = [];
  for (const c of vertical) {
    const prev = out[out.length - 1];
    if (prev && prev.x === c.x && prev.w === c.w && Math.abs(prev.y + prev.h - c.y) < 1e-9) prev.h += c.h;
    else out.push({ ...c });
  }
  return out;
}

/**
 * Exact, disjoint decomposition of the free space inside `bounds` after removing
 * `occupied`. Used for offcut accounting so metrics never depend on the internal
 * (partly overlapping) free-rect lists of a particular packer.
 */
export function freeRectangles(bounds: Rect, occupied: Rect[]): Rect[] {
  const clipped = occupied
    .filter((o) => o.w > 0 && o.h > 0)
    .map((o) => clipRect(o, bounds))
    .filter((r) => r.w > 0 && r.h > 0);

  const xsSet = new Set<number>([bounds.x, bounds.x + bounds.w]);
  const ysSet = new Set<number>([bounds.y, bounds.y + bounds.h]);
  for (const r of clipped) {
    xsSet.add(r.x);
    xsSet.add(r.x + r.w);
    ysSet.add(r.y);
    ysSet.add(r.y + r.h);
  }
  const xs = [...xsSet].sort((a, b) => a - b);
  const ys = [...ysSet].sort((a, b) => a - b);

  const cells: Rect[] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      const cell: Rect = { x: xs[i], y: ys[j], w: xs[i + 1] - xs[i], h: ys[j + 1] - ys[j] };
      if (cell.w <= 0 || cell.h <= 0) continue;
      if (clipped.some((r) => overlaps(cell, r))) continue;
      cells.push(cell);
    }
  }
  return mergeCells(cells);
}

export type LayoutIssue = {
  code: "bounds" | "overlap" | "kerf" | "grain" | "count" | "dimension";
  message: string;
  slabIndex?: number;
  pieceId?: string;
};

export type ValidateOptions = {
  kerfMm?: number;
  slab?: SlabSpec;
  pieces?: PieceSpec[];
  grainMode?: GrainMode;
};

/**
 * Validates a finished OptimizeResult against the slab bounds, the kerf gap,
 * grain orientation and piece accounting. Returns every issue found (empty = valid).
 *
 * Pieces are packed as (w + kerf) × (h + kerf) rectangles to reserve the saw cut,
 * so the independent check is: the real rectangle stays inside the slab, and two
 * inflated rectangles on the same slab never overlap.
 */
export function validateResult(result: OptimizeResult, opts: ValidateOptions = {}): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  const kerf = Math.max(0, opts.kerfMm ?? result.kerfMm ?? 0);
  const slab = opts.slab ?? result.slabSpec;
  const slabLength = slab.lengthMm;
  const slabWidth = slab.widthMm;
  const grainAxis = slab.grainAxis ?? "length";
  const grainMode = opts.grainMode ?? result.config?.grainMode ?? "none";

  for (const s of result.slabs) {
    const bounds: Rect = { x: 0, y: 0, w: slabLength, h: slabWidth };
    const inflated: { pid: string; r: Rect; instance: number }[] = [];

    for (const p of s.placements) {
      const r = placementRect(p);
      if (r.w <= 0 || r.h <= 0) {
        issues.push({ code: "dimension", message: `Празен детайл ${p.pieceId}.`, slabIndex: s.slabIndex, pieceId: p.pieceId });
      }
      if (!rectInside(r, bounds, 1e-6)) {
        issues.push({
          code: "bounds",
          message: `Детайл ${p.pieceId} излиза извън плочата.`,
          slabIndex: s.slabIndex,
          pieceId: p.pieceId,
        });
      }
      if (grainMode !== "none" && p.grainRequired) {
        const expectedRotated = grainAxis === "width";
        if (p.rotated !== expectedRotated) {
          issues.push({
            code: "grain",
            message: `Детайл ${p.pieceId} нарушава посоката на текстурата.`,
            slabIndex: s.slabIndex,
            pieceId: p.pieceId,
          });
        }
      }
      inflated.push({ pid: p.pieceId, r: inflateRect(r, kerf), instance: p.instanceIndex });
    }

    for (let i = 0; i < inflated.length; i++) {
      for (let j = i + 1; j < inflated.length; j++) {
        if (overlaps(inflated[i].r, inflated[j].r)) {
          issues.push({
            code: "kerf",
            message: `Детайли ${inflated[i].pid} и ${inflated[j].pid} нямат нужния прорез/се припокриват.`,
            slabIndex: s.slabIndex,
            pieceId: inflated[j].pid,
          });
        }
      }
    }
  }

  const placedCount = result.slabs.reduce((a, s) => a + s.placements.length, 0);
  if (placedCount !== result.placedPieces) {
    issues.push({ code: "count", message: `Отчетени ${result.placedPieces} поставени, но намерени ${placedCount}.` });
  }
  const unplacedCount = result.unplacedPieces.reduce((a, p) => a + p.quantity, 0);
  if (unplacedCount !== result.unplacedCount) {
    issues.push({ code: "count", message: `Отчетени ${result.unplacedCount} непоставени, но намерени ${unplacedCount}.` });
  }
  if (result.placedPieces + result.unplacedCount !== result.totalPieces) {
    issues.push({
      code: "count",
      message: `Поставени + непоставени (${result.placedPieces + result.unplacedCount}) ≠ общо (${result.totalPieces}).`,
    });
  }

  if (opts.pieces) {
    const requested = opts.pieces.reduce((a, p) => a + Math.max(0, Math.floor(p.quantity)), 0);
    if (requested !== result.totalPieces) {
      issues.push({ code: "count", message: `Общо детайли (${result.totalPieces}) ≠ поискани (${requested}).` });
    }
  }

  return issues;
}
