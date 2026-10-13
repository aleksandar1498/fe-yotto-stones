// Shared color assignment for cutlist diagrams (admin + print).
//
// Colors are chosen per individual piece and, crucially, adjacent pieces never share
// a color (greedy graph colouring over the layout), so neighbouring rectangles are
// always visually distinct. The assignment is deterministic for a given placement
// list, so the admin view and the printed sheet always match.

import type { Placement } from "./types";

// Tableau-20 style qualitative palette — high contrast against each other.
export const PIECE_PALETTE = [
  "#4e79a7",
  "#f28e2b",
  "#59a14f",
  "#e15759",
  "#76b7b2",
  "#b07aa1",
  "#edc948",
  "#ff9da7",
  "#9c755f",
  "#8cd17d",
  "#a0cbe8",
  "#ffbe7d",
  "#d4a6c8",
  "#b6992d",
  "#86bcb6",
  "#c98b6b",
  "#7b6fd0",
  "#efa03d",
  "#5f9ea0",
  "#cf6b8f",
];

export const pieceKey = (p: Pick<Placement, "pieceId" | "instanceIndex">): string => `${p.pieceId}#${p.instanceIndex}`;

/** Black or white text depending on the fill luminance, so labels stay readable. */
export function readableText(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 150 ? "#111827" : "#ffffff";
}

/** Dimensions in millimetres, formatted the same way everywhere. */
export const fmtLen = (mm: number): string => `${Math.round(mm)}`;

/**
 * Greedy graph colouring: two placements are "adjacent" when their rectangles are
 * within one kerf of each other, and adjacent pieces always get different colors.
 */
export function pieceColorMap(placements: Placement[], kerfMm: number): Map<string, string> {
  const n = placements.length;
  const tol = Math.max(0, kerfMm) + 2;
  const neighbours: number[][] = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    const a = placements[i];
    for (let j = i + 1; j < n; j++) {
      const b = placements[j];
      const nearX = a.xMm < b.xMm + b.lengthMm + tol && b.xMm < a.xMm + a.lengthMm + tol;
      const nearY = a.yMm < b.yMm + b.widthMm + tol && b.yMm < a.yMm + a.widthMm + tol;
      if (nearX && nearY) {
        neighbours[i].push(j);
        neighbours[j].push(i);
      }
    }
  }

  const chosen: number[] = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    const used = new Set<number>();
    for (const j of neighbours[i]) if (chosen[j] >= 0) used.add(chosen[j]);
    let color = -1;
    for (let c = 0; c < PIECE_PALETTE.length; c++) {
      if (!used.has(c)) {
        color = c;
        break;
      }
    }
    if (color === -1) {
      // More colours than neighbours is the norm; fall back to the least-used one.
      const counts = new Map<number, number>();
      for (const j of neighbours[i]) if (chosen[j] >= 0) counts.set(chosen[j], (counts.get(chosen[j]) ?? 0) + 1);
      let best = 0;
      let bestCount = Infinity;
      for (let c = 0; c < PIECE_PALETTE.length; c++) {
        const count = counts.get(c) ?? 0;
        if (count < bestCount) {
          bestCount = count;
          best = c;
        }
      }
      color = best;
    }
    chosen[i] = color;
  }

  const map = new Map<string, string>();
  placements.forEach((p, i) => map.set(pieceKey(p), PIECE_PALETTE[chosen[i]]));
  return map;
}
