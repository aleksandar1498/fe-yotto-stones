import { describe, expect, it } from "vitest";
import { DEFAULT_PRICING, quoteOrder, quotePosition, type Position } from "./pricing";

const position = (patch: Partial<Position> = {}): Position => ({
  id: "p1",
  sort: 0,
  type: "windowsill",
  lengthCm: 300,
  depthCm: 60,
  thicknessCm: 2,
  qty: 1,
  edges: {},
  drip: {},
  cutouts: {},
  extras: [],
  ...patch,
});

const sealLines = (p: Position, includeSeal?: boolean) =>
  quotePosition(p, { pricing: DEFAULT_PRICING, stoneKey: "limestone", includeSeal }).lines.filter((l) => l.key.startsWith("seal"));

const edgeSealLines = (p: Position) =>
  quotePosition(p, { pricing: DEFAULT_PRICING, stoneKey: "marble" }).lines.filter((l) => l.key.startsWith("seal"));

describe("impregnation / edge sealing", () => {
  it("keeps legacy positions (no flag) automatically sealed", () => {
    expect(sealLines(position())).toHaveLength(1);
    expect(sealLines(position())[0].key).toBe("seal_m2");
  });

  it("has no sealing when the position is explicitly off", () => {
    expect(sealLines(position({ impregnated: false }))).toHaveLength(0);
    expect(edgeSealLines(position({ edges: { l1: { profile: "r_half" } }, impregnated: false }))).toHaveLength(0);
  });

  it("seals an enabled position, including the finished edge for marble", () => {
    expect(sealLines(position({ impregnated: true }))).toHaveLength(1);
    const edge = edgeSealLines(position({ edges: { l1: { profile: "r_half" } }, impregnated: true }));
    expect(edge).toHaveLength(1);
    expect(edge[0].key).toBe("seal_edge");
    expect(edge[0].qty).toBe(3);
  });

  it("can price the same order without any sealing (the second total)", () => {
    const positions = [position({ impregnated: true })];
    const input = { positions, services: [], stoneKey: "limestone", pricing: DEFAULT_PRICING };
    const withSeal = quoteOrder({ ...input, includeSeal: true });
    const withoutSeal = quoteOrder({ ...input, includeSeal: false });

    // Only the sealing line changes; the rest of the calculation is identical.
    const rest = (q: typeof withSeal) => q.positions[0].lines.filter((l) => !l.key.startsWith("seal"));
    expect(rest(withSeal)).toEqual(rest(withoutSeal));
    expect(withSeal.gross).toBeGreaterThan(withoutSeal.gross);
    // 1.8 m² × 13.50 €/m² = 24.30 € net → 29.16 € with 20 % VAT.
    expect(withSeal.gross - withoutSeal.gross).toBeCloseTo(29.16, 2);
  });
});
