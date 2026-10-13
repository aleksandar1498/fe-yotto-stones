import { describe, expect, it } from "vitest";
import { normalizeCutlist } from "./normalize";

// Mirrors what Firebase RTDB returns after saving: empty arrays are dropped and
// arrays may come back as index-keyed maps.
const rawFromDb = {
  name: "Тест",
  status: "complete",
  materialId: "m1",
  materialName: "Мрамор",
  thicknessMm: 20,
  createdAt: 1,
  updatedAt: 2,
  orders: { o1: { id: "o1", number: 5, clientName: "Иван" } },
  result: {
    materialId: "m1",
    status: "partial",
    kerfMm: 4,
    slabSpec: { lengthMm: 2900, widthMm: 1900, grainAxis: "length" },
    slabs: {
      s1: {
        slabIndex: 1,
        lengthMm: 2900,
        widthMm: 1900,
        usedAreaMm2: 100,
        slabAreaMm2: 200,
        placements: { p1: { pieceId: "a:1", instanceIndex: 1, orderId: "o1", xMm: 0, yMm: 0, lengthMm: 10, widthMm: 10, rotated: false, grainRequired: false } },
        // offcuts was [] → dropped by RTDB
      },
    },
    // unplacedPieces was [] → dropped by RTDB
  },
};

describe("normalizeCutlist (RTDB read safety)", () => {
  it("restores dropped/omitted collections so views never read .length of undefined", () => {
    const c = normalizeCutlist("abc", rawFromDb);
    expect(c).not.toBeNull();
    const r = c!.result;

    expect(Array.isArray(c!.orders)).toBe(true);
    expect(c!.orders[0]).toMatchObject({ id: "o1", number: 5, clientName: "Иван" });

    expect(Array.isArray(r.slabs)).toBe(true);
    expect(Array.isArray(r.slabs[0].placements)).toBe(true);
    expect(r.slabs[0].placements[0].pieceId).toBe("a:1");
    expect(Array.isArray(r.slabs[0].offcuts)).toBe(true);
    expect(r.slabs[0].offcuts).toEqual([]);
    expect(Array.isArray(r.unplacedPieces)).toBe(true);
    expect(r.unplacedPieces).toEqual([]);

    // Derived figures are recomputed when absent.
    expect(r.slabs[0].utilizationPercent).toBeCloseTo(50, 6);
    expect(r.totalSlabAreaMm2).toBe(200);
    expect(r.usedAreaMm2).toBe(100);
    expect(r.wasteAreaMm2).toBe(100);
    expect(r.placedPieces).toBe(1);
    expect(r.slabsUsed).toBe(1);
    expect(r.slabSpec.grainAxis).toBe("length");
    expect(r.config.cuttingMode).toBeDefined();

    // Cut metrics were absent in the old payload — backfilled and flagged as an estimate.
    expect(r.totalCutCount).toBeGreaterThan(0);
    expect(r.cutMetricsEstimated).toBe(true);
  });

  it("returns null for missing data instead of throwing", () => {
    expect(normalizeCutlist("x", null)).toBeNull();
    expect(normalizeCutlist("x", undefined)).toBeNull();
  });
});
