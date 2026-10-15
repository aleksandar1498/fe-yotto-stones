import { describe, expect, it } from "vitest";
import { firstFitBaseline, optimize } from "./optimizer";
import { validateResult } from "./geometry";
import type { OptimizeConfig, OptimizeInput, PieceSpec } from "./types";

const baseConfig = (over: Partial<OptimizeConfig> = {}): OptimizeConfig => ({
  slab: { lengthMm: 2900, widthMm: 1900, grainAxis: "length" },
  kerfMm: 4,
  grainMode: "none",
  allowRotation: true,
  cuttingMode: "freestyle",
  seed: 1,
  maxCandidates: 24,
  timeLimitMs: 100000,
  minReusableMm: 100,
  ...over,
});

const piece = (lengthMm: number, widthMm: number, quantity = 1, extra: Partial<PieceSpec> = {}): PieceSpec => ({
  pieceId: extra.pieceId ?? `p-${lengthMm}x${widthMm}`,
  orderId: extra.orderId ?? "order-1",
  lengthMm,
  widthMm,
  quantity,
  ...extra,
});

const input = (pieces: PieceSpec[], over: Partial<OptimizeConfig> = {}, materialId = "m1"): OptimizeInput => ({
  materialId,
  materialName: "Тестов материал",
  config: baseConfig(over),
  pieces,
});

describe("optimizer — placement basics", () => {
  it("places a single piece on one slab", () => {
    const result = optimize(input([piece(600, 1200)]));
    expect(result.slabsUsed).toBe(1);
    expect(result.placedPieces).toBe(1);
    expect(result.status).toBe("complete");
    expect(validateResult(result)).toEqual([]);
  });

  it("packs several pieces onto a single slab", () => {
    const pieces = Array.from({ length: 5 }, (_, i) => piece(500, 400, 1, { pieceId: `p${i}` }));
    const result = optimize(input(pieces));
    expect(result.slabsUsed).toBe(1);
    expect(result.placedPieces).toBe(5);
    expect(validateResult(result)).toEqual([]);
  });

  it("uses multiple slabs when pieces cannot fit together", () => {
    const pieces = Array.from({ length: 3 }, (_, i) => piece(2900, 700, 1, { pieceId: `p${i}` }));
    const result = optimize(input(pieces));
    expect(result.slabsUsed).toBe(2);
    expect(result.placedPieces).toBe(3);
    expect(validateResult(result)).toEqual([]);
  });

  it("expands quantities into individual pieces", () => {
    const result = optimize(input([piece(600, 400, 3)]));
    expect(result.placedPieces).toBe(3);
    expect(result.totalPieces).toBe(3);
    const indices = result.slabs.flatMap((s) => s.placements.map((p) => p.instanceIndex)).sort();
    expect(indices).toEqual([1, 2, 3]);
    expect(validateResult(result)).toEqual([]);
  });
});

describe("optimizer — constraints", () => {
  it("reports pieces larger than the slab as unplaced", () => {
    const result = optimize(input([piece(3000, 100)]));
    expect(result.placedPieces).toBe(0);
    expect(result.status).toBe("partial");
    expect(result.unplacedPieces).toHaveLength(1);
    expect(result.unplacedPieces[0].reason).toBe("exceeds-slab");
    expect(result.unplacedCount).toBe(1);
    expect(validateResult(result)).toEqual([]);
  });

  it("keeps unplaced quantities for repeated oversized pieces", () => {
    const result = optimize(input([piece(3000, 100, 2)]));
    expect(result.unplacedPieces[0].quantity).toBe(2);
    expect(result.totalPieces).toBe(2);
  });

  it("enforces grain direction on the length axis", () => {
    const result = optimize(input([piece(1200, 600, 1)], { grainMode: "directional", allowRotation: true }));
    expect(result.placedPieces).toBe(1);
    expect(result.slabs[0].placements.every((p) => p.rotated === false)).toBe(true);
    expect(validateResult(result, { grainMode: "directional" })).toEqual([]);
  });

  it("rotates grain-bound pieces when the slab grain runs along the width", () => {
    const slab = { lengthMm: 2900, widthMm: 1900, grainAxis: "width" as const };
    const result = optimize(input([piece(600, 1200, 1)], { grainMode: "directional", slab, allowRotation: true }));
    expect(result.placedPieces).toBe(1);
    expect(result.slabs[0].placements[0].rotated).toBe(true);
    expect(validateResult(result, { grainMode: "directional" })).toEqual([]);
  });

  it("marks grain-bound pieces unplaced when rotation is forbidden", () => {
    const slab = { lengthMm: 2900, widthMm: 1900, grainAxis: "width" as const };
    const result = optimize(input([piece(600, 1200, 1)], { grainMode: "directional", slab, allowRotation: false }));
    expect(result.placedPieces).toBe(0);
    expect(result.unplacedPieces[0].reason).toBe("grain");
  });

  it("honours the rotation switch", () => {
    const slab = { lengthMm: 1300, widthMm: 700, grainAxis: "length" as const };
    const withRotation = optimize(input([piece(700, 1250, 1)], { slab, allowRotation: true }));
    expect(withRotation.placedPieces).toBe(1);
    expect(withRotation.slabs[0].placements[0].rotated).toBe(true);

    const withoutRotation = optimize(input([piece(700, 1250, 1)], { slab, allowRotation: false }));
    expect(withoutRotation.placedPieces).toBe(0);
    expect(withoutRotation.unplacedPieces[0].reason).toBe("exceeds-slab");
  });

  it("takes the kerf into account when deciding whether pieces fit", () => {
    const slab = { lengthMm: 1000, widthMm: 1000, grainAxis: "length" as const };
    const pieces = [piece(500, 1000, 1, { pieceId: "a" }), piece(500, 1000, 1, { pieceId: "b" })];
    const noKerf = optimize(input(pieces, { slab, kerfMm: 0 }));
    expect(noKerf.slabsUsed).toBe(1);
    const withKerf = optimize(input(pieces, { slab, kerfMm: 10 }));
    expect(withKerf.slabsUsed).toBe(2);
    expect(validateResult(withKerf, { kerfMm: 10 })).toEqual([]);
  });

  it("produces a guillotine-valid layout in guillotine mode", () => {
    const pieces = [
      piece(900, 500, 2, { pieceId: "a" }),
      piece(600, 400, 3, { pieceId: "b" }),
      piece(1300, 700, 1, { pieceId: "c" }),
    ];
    const result = optimize(input(pieces, { cuttingMode: "guillotine" }));
    expect(result.slabsUsed).toBeGreaterThan(0);
    expect(validateResult(result)).toEqual([]);
  });
});

describe("optimizer — metrics, determinism, traceability", () => {
  it("computes utilization and waste from actual geometry", () => {
    const result = optimize(input([piece(1000, 500)], { kerfMm: 0 }));
    const used = 1000 * 500;
    const total = 2900 * 1900;
    expect(result.usedAreaMm2).toBe(used);
    expect(result.totalSlabAreaMm2).toBe(total);
    expect(result.wasteAreaMm2).toBe(total - used);
    expect(result.totalUtilizationPercent).toBeCloseTo((used / total) * 100, 6);
    expect(result.reusableOffcutAreaMm2).toBeGreaterThan(0);
  });

  it("is deterministic for identical input and configuration", () => {
    const pieces = [
      piece(1200, 800, 2, { pieceId: "a" }),
      piece(900, 600, 3, { pieceId: "b" }),
      piece(400, 400, 2, { pieceId: "c" }),
    ];
    const run = () => JSON.parse(JSON.stringify(optimize(input(pieces)))) as Record<string, unknown>;
    const a = run();
    const b = run();
    delete a.durationMs;
    delete b.durationMs;
    expect(a).toEqual(b);
  });

  it("keeps every placed piece linked to its source order", () => {
    const pieces = [
      piece(800, 600, 1, { pieceId: "a", orderId: "order-A", orderNumber: 10 }),
      piece(800, 600, 1, { pieceId: "b", orderId: "order-B", orderNumber: 11 }),
    ];
    const result = optimize(input(pieces));
    const orders = new Set(result.slabs.flatMap((s) => s.placements.map((p) => p.orderId)));
    expect(orders).toEqual(new Set(["order-A", "order-B"]));
  });

  it("beats the first-fit baseline on a representative dataset", () => {
    // Two tall pieces set a 1700 mm shelf; the remaining 1800×880 piece only fits
    // when rotated into the side strip — a move the shelf baseline cannot make.
    const pieces = [
      piece(1800, 880, 1, { pieceId: "wide" }),
      piece(1000, 1700, 1, { pieceId: "tall-1" }),
      piece(1000, 1700, 1, { pieceId: "tall-2" }),
    ];
    const optimized = optimize(input(pieces));
    const baseline = firstFitBaseline(input(pieces));
    expect(baseline.slabsUsed).toBe(2);
    expect(optimized.slabsUsed).toBeLessThan(baseline.slabsUsed);
    expect(validateResult(optimized)).toEqual([]);
  });
});

describe("geometry — independent validation", () => {
  it("detects overlaps and out-of-bounds placements", () => {
    const result = optimize(input([piece(600, 400, 2, { pieceId: "a" })]));
    // Tamper with the layout: stack both instances on the exact same spot.
    result.slabs[0].placements[1].xMm = result.slabs[0].placements[0].xMm;
    result.slabs[0].placements[1].yMm = result.slabs[0].placements[0].yMm;
    const issues = validateResult(result);
    expect(issues.some((i) => i.code === "kerf")).toBe(true);

    const bounds = optimize(input([piece(600, 400)]));
    bounds.slabs[0].placements[0].xMm = 5000;
    expect(validateResult(bounds).some((i) => i.code === "bounds")).toBe(true);
  });
});

describe("optimizer — cut metrics and offcuts", () => {
  it("reports real guillotine cut metrics when a guillotine layout wins", () => {
    const pieces = [piece(1800, 880, 1, { pieceId: "wide" }), piece(1000, 1700, 2, { pieceId: "tall" })];
    const result = optimize(input(pieces, { cuttingMode: "guillotine" }));
    expect(result.slabsUsed).toBe(1);
    expect(result.cutMetricsEstimated).toBe(false);
    expect(result.totalCutCount).toBeGreaterThan(0);
    expect(result.totalCutLengthMm).toBeGreaterThan(0);
    expect(validateResult(result)).toEqual([]);
  });

  it("flags estimated cut metrics for non-guillotine packing", () => {
    const result = optimize(input([piece(600, 400)], { cuttingMode: "freestyle" }));
    expect(result.cutMetricsEstimated).toBe(true);
    expect(result.totalCutCount).toBeGreaterThan(0);
  });

  it("reports reusable offcuts with real sizes inside the slab", () => {
    const result = optimize(input([piece(600, 400)]));
    const offcuts = result.slabs[0].offcuts;
    const slabL = result.slabs[0].lengthMm;
    const slabW = result.slabs[0].widthMm;
    expect(offcuts.length).toBeGreaterThan(0);
    for (const o of offcuts) {
      expect(o.lengthMm).toBeGreaterThanOrEqual(100);
      expect(o.widthMm).toBeGreaterThanOrEqual(100);
      expect(o.xMm).toBeGreaterThanOrEqual(0);
      expect(o.yMm).toBeGreaterThanOrEqual(0);
      expect(o.xMm + o.lengthMm).toBeLessThanOrEqual(slabL);
      expect(o.yMm + o.widthMm).toBeLessThanOrEqual(slabW);
    }
    expect(result.slabs[0].reusableOffcutAreaMm2).toBe(
      offcuts.reduce((a, o) => a + o.lengthMm * o.widthMm, 0)
    );
  });

  it("reports the single largest reusable offcut", () => {
    const result = optimize(input([piece(600, 400)]));
    expect(result.largestOffcutAreaMm2).toBeGreaterThan(0);
    const maxOffcut = Math.max(0, ...result.slabs.flatMap((s) => s.offcuts.map((o) => o.lengthMm * o.widthMm)));
    expect(result.largestOffcutAreaMm2).toBe(maxOffcut);
  });
});

describe("optimizer — slab pool and orientation", () => {
  it("uses a priority slab pool: the first fitting size is consumed first", () => {
    const pool = [
      { lengthMm: 1900, widthMm: 1800, qty: 1, label: "remnant" },
      { lengthMm: 2900, widthMm: 1800, qty: 5, label: "full" },
    ];
    const result = optimize(input([piece(1200, 600, 1), piece(600, 500, 1)], { slabPool: pool }));
    expect(result.slabsUsed).toBe(1);
    // Slab orientation is free, so compare dimensions as an unordered pair.
    const dims = [result.slabs[0].lengthMm, result.slabs[0].widthMm].sort((a, b) => a - b);
    expect(dims).toEqual([1800, 1900]); // the high-priority remnant was used
    const pair = (u: { lengthMm: number; widthMm: number }) => [u.lengthMm, u.widthMm].sort((a, b) => a - b).join("x");
    expect(result.slabUsage.find((u) => pair(u) === "1800x1900")?.used).toBe(1);
    expect(result.slabUsage.find((u) => pair(u) === "1800x2900")?.used).toBe(0);
    expect(validateResult(result)).toEqual([]);
  });

  it("falls back to the next size once the priority stock is exhausted", () => {
    const pool = [
      { lengthMm: 1300, widthMm: 700, qty: 1 },
      { lengthMm: 1600, widthMm: 700, qty: 5 },
    ];
    // Two 1200×600 pieces: the 1300×700 remnant holds one, the other spills to the bigger size.
    const result = optimize(input([piece(1200, 600, 2, { pieceId: "a" })], { slabPool: pool, kerfMm: 0 }));
    expect(result.slabsUsed).toBe(2);
    const sizes = result.slabs.map((s) => [s.lengthMm, s.widthMm].sort((a, b) => a - b).join("x")).sort();
    expect(sizes).toEqual(["700x1300", "700x1600"]);
    expect(validateResult(result)).toEqual([]);
  });

  it("honours the orientation preference", () => {
    const byLength = optimize(input([piece(1200, 300)], { orientation: "length" }));
    expect(byLength.slabs[0].placements[0].rotated).toBe(false);

    const byWidth = optimize(input([piece(1200, 300)], { orientation: "width" }));
    expect(byWidth.slabs[0].placements[0].rotated).toBe(true);
  });

  it("guarantees a guillotine-cuttable layout in guillotine mode", () => {
    const pieces = [
      piece(1300, 260, 6, { pieceId: "terrace" }),
      piece(1840, 150, 1, { pieceId: "a" }),
      piece(1645, 150, 1, { pieceId: "b" }),
      piece(1560, 150, 1, { pieceId: "c" }),
      piece(1120, 100, 1, { pieceId: "d" }),
    ];
    const result = optimize(input(pieces, { cuttingMode: "guillotine", slab: { lengthMm: 1900, widthMm: 2900, grainAxis: "length" } }));
    expect(result.guillotineCuttable).toBe(true);
    expect(validateResult(result)).toEqual([]);
  });
});

describe("optimizer — band packing benchmark (cutlistoptimizer-style)", () => {
  // The exact limestone set from the two orders, on the reference sheet 1900 × 2900.
  const pieces = [
    piece(1300, 260, 6, { pieceId: "terrace" }),
    piece(1840, 150, 1, { pieceId: "hol-tv" }),
    piece(1780, 170, 1, { pieceId: "detska-v" }),
    piece(1645, 150, 1, { pieceId: "hol-kotle" }),
    piece(1560, 150, 1, { pieceId: "spalnya-v" }),
    piece(1540, 100, 1, { pieceId: "spalnya-vi" }),
    piece(1520, 100, 1, { pieceId: "detska1" }),
    piece(1120, 100, 1, { pieceId: "detska2" }),
    piece(900, 70, 1, { pieceId: "detska-v2" }),
  ];
  const slab = { lengthMm: 2900, widthMm: 1900, grainAxis: "length" as const };

  it("packs everything on one sheet and leaves one big reusable band", () => {
    const result = optimize(input(pieces, { cuttingMode: "guillotine", slab, minOffcutLengthMm: 1200, minOffcutWidthMm: 150 }));
    expect(result.slabsUsed).toBe(1);
    expect(result.unplacedCount).toBe(0);
    expect(result.guillotineCuttable).toBe(true);
    // Reference leaves ~1900×752 (1.43 m²); we require at least 1.4 m² in one usable piece.
    expect(result.largestUsableOffcutAreaMm2).toBeGreaterThanOrEqual(1_400_000);
    expect(validateResult(result)).toEqual([]);
  });

  it("produces a row/column band structure", () => {
    const result = optimize(input(pieces, { cuttingMode: "guillotine", slab }));
    const placements = result.slabs[0].placements;
    // Some pieces horizontal (rows) and the terrace pieces vertical (columns).
    expect(placements.some((p) => !p.rotated)).toBe(true);
    expect(placements.filter((p) => p.rotated).length).toBeGreaterThanOrEqual(4);
  });
});
