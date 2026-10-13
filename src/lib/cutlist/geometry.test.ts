import { describe, expect, it } from "vitest";
import { freeRectangles, overlaps } from "./geometry";

describe("geometry helpers", () => {
  it("treats touching edges as non-overlapping", () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
    expect(overlaps({ x: 0, y: 0, w: 11, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(true);
  });

  it("conserves area when decomposing free space", () => {
    const bounds = { x: 0, y: 0, w: 100, h: 100 };
    const occupied = [
      { x: 0, y: 0, w: 30, h: 100 },
      { x: 30, y: 0, w: 70, h: 40 },
    ];
    const free = freeRectangles(bounds, occupied);
    const freeArea = free.reduce((a, r) => a + r.w * r.h, 0);
    const occupiedArea = occupied.reduce((a, r) => a + r.w * r.h, 0);
    expect(freeArea).toBe(bounds.w * bounds.h - occupiedArea);
    // The decomposition must be disjoint.
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        expect(overlaps(free[i], free[j])).toBe(false);
      }
    }
  });
});
