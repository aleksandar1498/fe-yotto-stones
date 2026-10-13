// Low-level bin packers used by the optimizer. All are deterministic and operate
// on rectangles that the caller has already inflated by the kerf, so a "slot" here
// is the top-left corner where a piece starts; the kerf is reserved to its right/bottom.

import type { Rect } from "./geometry";
import { overlaps, rectArea } from "./geometry";

export type Dims = { w: number; h: number };
export type Slot = { x: number; y: number; w: number; h: number };
export type CutMetrics = { count: number; lengthMm: number };

export interface BinPacker {
  /** Free, disjoint rectangles still available on this slab. */
  freeRects(): Rect[];
  /** Best slot for the given (kerf-inflated) dimensions, without committing. */
  find(d: Dims): Slot | null;
  /** Commit a slot previously returned by find(). */
  commit(slot: Slot): void;
  readonly placed: Slot[];
  /** Real guillotine cut metrics, or null when the packer cannot express a cut sequence. */
  cutMetrics(): CutMetrics | null;
}

const EPS = 1e-9;

function containedIn(a: Rect, b: Rect): boolean {
  return a.x >= b.x - EPS && a.y >= b.y - EPS && a.x + a.w <= b.x + b.w + EPS && a.y + a.h <= b.y + b.h + EPS;
}

function prune(rects: Rect[]): Rect[] {
  const out: Rect[] = [];
  for (let i = 0; i < rects.length; i++) {
    if (rects[i].w <= EPS || rects[i].h <= EPS) continue;
    let dominated = false;
    for (let j = 0; j < rects.length; j++) {
      if (i === j) continue;
      if (containedIn(rects[i], rects[j]) && (rectArea(rects[j]) > rectArea(rects[i]) + EPS || j < i)) {
        dominated = true;
        break;
      }
    }
    if (!dominated) out.push(rects[i]);
  }
  return out;
}

export type MaxRectsHeuristic = "bssf" | "baf" | "bl";

/** Jukka Jylänki's MaxRects bin packer. */
export class MaxRectsBin implements BinPacker {
  private free: Rect[];
  public readonly placed: Slot[] = [];

  constructor(
    public readonly w: number,
    public readonly h: number,
    private readonly heuristic: MaxRectsHeuristic
  ) {
    this.free = [{ x: 0, y: 0, w, h }];
  }

  freeRects(): Rect[] {
    return this.free.map((r) => ({ ...r }));
  }

  cutMetrics(): CutMetrics | null {
    return null;
  }

  find(d: Dims): Slot | null {
    let best: Slot | null = null;
    let bestPrimary = Infinity;
    let bestSecondary = Infinity;
    for (const f of this.free) {
      if (d.w > f.w + EPS || d.h > f.h + EPS) continue;
      const leftoverX = f.w - d.w;
      const leftoverY = f.h - d.h;
      let primary: number;
      let secondary: number;
      if (this.heuristic === "bssf") {
        primary = Math.min(leftoverX, leftoverY);
        secondary = Math.max(leftoverX, leftoverY);
      } else if (this.heuristic === "baf") {
        primary = rectArea(f) - d.w * d.h;
        secondary = Math.min(leftoverX, leftoverY);
      } else {
        // Bottom-left: lowest top edge, then leftmost right edge.
        primary = f.y + d.h;
        secondary = f.x + d.w;
      }
      if (primary < bestPrimary - EPS || (Math.abs(primary - bestPrimary) <= EPS && secondary < bestSecondary - EPS)) {
        bestPrimary = primary;
        bestSecondary = secondary;
        best = { x: f.x, y: f.y, w: d.w, h: d.h };
      }
    }
    return best;
  }

  commit(slot: Slot): void {
    const next: Rect[] = [];
    for (const f of this.free) {
      if (!overlaps(f, slot)) {
        next.push(f);
        continue;
      }
      if (slot.y > f.y) next.push({ x: f.x, y: f.y, w: f.w, h: slot.y - f.y });
      if (slot.y + slot.h < f.y + f.h) next.push({ x: f.x, y: slot.y + slot.h, w: f.w, h: f.y + f.h - (slot.y + slot.h) });
      if (slot.x > f.x) next.push({ x: f.x, y: f.y, w: slot.x - f.x, h: f.h });
      if (slot.x + slot.w < f.x + f.w) next.push({ x: slot.x + slot.w, y: f.y, w: f.x + f.w - (slot.x + slot.w), h: f.h });
    }
    this.free = prune(next);
    this.placed.push(slot);
  }
}

export type GuillotineSplit = "shorter" | "longer";

/** Guillotine bin packer: every cut is a straight full-length cut. */
export class GuillotineBin implements BinPacker {
  private free: Rect[];
  private cuts: number[] = [];
  public readonly placed: Slot[] = [];

  constructor(
    public readonly w: number,
    public readonly h: number,
    private readonly split: GuillotineSplit
  ) {
    this.free = [{ x: 0, y: 0, w, h }];
  }

  freeRects(): Rect[] {
    return this.free.map((r) => ({ ...r }));
  }

  cutMetrics(): CutMetrics {
    return { count: this.cuts.length, lengthMm: this.cuts.reduce((a, c) => a + c, 0) };
  }

  find(d: Dims): Slot | null {
    let best: Rect | null = null;
    let bestShort = Infinity;
    let bestLong = Infinity;
    for (const f of this.free) {
      if (d.w > f.w + EPS || d.h > f.h + EPS) continue;
      const sx = f.w - d.w;
      const sy = f.h - d.h;
      const short = Math.min(sx, sy);
      const long = Math.max(sx, sy);
      if (short < bestShort - EPS || (Math.abs(short - bestShort) <= EPS && long < bestLong - EPS)) {
        bestShort = short;
        bestLong = long;
        best = f;
      }
    }
    return best ? { x: best.x, y: best.y, w: d.w, h: d.h } : null;
  }

  commit(slot: Slot): void {
    const idx = this.free.findIndex(
      (f) =>
        slot.x >= f.x - EPS &&
        slot.y >= f.y - EPS &&
        slot.x + slot.w <= f.x + f.w + EPS &&
        slot.y + slot.h <= f.y + f.h + EPS
    );
    if (idx === -1) return;
    const f = this.free[idx];
    this.free.splice(idx, 1);
    const leftOverW = f.w - slot.w;
    const leftOverH = f.h - slot.h;
    const splitVertical = this.split === "shorter" ? leftOverW < leftOverH : leftOverW >= leftOverH;
    if (splitVertical) {
      // full-height band on the right, strip below the piece on the left
      this.free.push({ x: slot.x + slot.w, y: f.y, w: leftOverW, h: f.h });
      this.free.push({ x: f.x, y: slot.y + slot.h, w: slot.w, h: leftOverH });
      if (leftOverW > EPS) this.cuts.push(f.h);
      if (leftOverH > EPS) this.cuts.push(slot.w);
    } else {
      // full-width band at the bottom, strip to the right of the piece
      this.free.push({ x: slot.x + slot.w, y: f.y, w: leftOverW, h: slot.h });
      this.free.push({ x: f.x, y: slot.y + slot.h, w: f.w, h: leftOverH });
      if (leftOverH > EPS) this.cuts.push(f.w);
      if (leftOverW > EPS) this.cuts.push(slot.h);
    }
    this.placed.push(slot);
  }
}

/** First-fit decreasing-height shelf packer — a simple baseline the optimiser must beat. */
export class ShelfBin implements BinPacker {
  private shelves: { y: number; h: number; usedW: number }[] = [];
  public readonly placed: Slot[] = [];

  constructor(
    public readonly w: number,
    public readonly h: number
  ) {}

  freeRects(): Rect[] {
    const rects: Rect[] = [];
    for (const s of this.shelves) {
      if (s.usedW < this.w) rects.push({ x: s.usedW, y: s.y, w: this.w - s.usedW, h: s.h });
    }
    const bottom = this.shelves.reduce((a, s) => Math.max(a, s.y + s.h), 0);
    if (bottom < this.h) rects.push({ x: 0, y: bottom, w: this.w, h: this.h - bottom });
    return rects;
  }

  cutMetrics(): CutMetrics | null {
    return null;
  }

  find(d: Dims): Slot | null {
    for (const s of this.shelves) {
      if (d.h <= s.h + EPS && s.usedW + d.w <= this.w + EPS) {
        return { x: s.usedW, y: s.y, w: d.w, h: d.h };
      }
    }
    const y = this.shelves.reduce((a, s) => Math.max(a, s.y + s.h), 0);
    if (y + d.h <= this.h + EPS && d.w <= this.w + EPS) {
      return { x: 0, y, w: d.w, h: d.h };
    }
    return null;
  }

  commit(slot: Slot): void {
    const s = this.shelves.find((x) => Math.abs(x.y - slot.y) <= EPS);
    if (s) s.usedW = Math.max(s.usedW, slot.x + slot.w);
    else this.shelves.push({ y: slot.y, h: slot.h, usedW: slot.w });
    this.placed.push(slot);
  }
}
