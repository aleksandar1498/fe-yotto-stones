import { describe, expect, it } from "vitest";
import type { Order } from "@/lib/orders/ordersData";
import type { MaterialSection, Position } from "@/lib/orders/pricing";
import { groupPiecesByMaterial, sectionMaterialKey } from "./build";

const section = (over: Partial<MaterialSection> = {}): MaterialSection => ({
  id: "s1",
  sort: 0,
  material: { groupKey: "marble", groupId: 1, materialId: 10, label: "Мрамор Карара" },
  stoneKey: "marble",
  materialPriceM2: null,
  ...over,
});

const position = (over: Partial<Position> = {}): Position => ({
  id: "p1",
  sort: 0,
  sectionId: "s1",
  type: "countertop",
  lengthCm: 120,
  depthCm: 60,
  thicknessCm: 2,
  qty: 2,
  ...over,
});

function makeOrder(id: string, number: number, sections: MaterialSection[], positions: Position[]): Order {
  return {
    id,
    number,
    status: "confirmed",
    client: { name: "Клиент", phone: "" },
    material: sections[0].material,
    stoneKey: sections[0].stoneKey,
    sections,
    positions,
    services: [],
    discountPct: 0,
    pricing: {},
    totals: { net: 0, vat: 0, gross: 0, areaM2: 0, currency: "EUR" },
    attachments: [],
    statusLog: [],
    createdAt: 0,
    updatedAt: 0,
  } as unknown as Order;
}

describe("groupPiecesByMaterial", () => {
  it("combines pieces from different orders that share a material and thickness", () => {
    const a = makeOrder("order-A", 1, [section()], [position({ id: "pa", lengthCm: 120, depthCm: 60, qty: 2 })]);
    const b = makeOrder("order-B", 2, [section()], [position({ id: "pb", lengthCm: 90, depthCm: 50, qty: 1 })]);

    const groups = groupPiecesByMaterial([a, b]);
    expect(groups).toHaveLength(1);
    expect(groups[0].pieces).toHaveLength(2);
    expect(new Set(groups[0].orderIds)).toEqual(new Set(["order-A", "order-B"]));
    expect(groups[0].thicknessMm).toBe(20);
  });

  it("converts centimetres to millimetres and keeps order references", () => {
    const a = makeOrder("order-A", 1, [section()], [position({ id: "pa", lengthCm: 120, depthCm: 60, thicknessCm: 2, qty: 3 })]);
    const [group] = groupPiecesByMaterial([a]);
    const [piece] = group.pieces;
    expect(piece.pieceId).toBe("order-A:pa");
    expect(piece.lengthMm).toBe(1200);
    expect(piece.widthMm).toBe(600);
    expect(piece.thicknessMm).toBe(20);
    expect(piece.quantity).toBe(3);
    expect(piece.orderNumber).toBe(1);
  });

  it("never mixes different materials", () => {
    const marble = makeOrder("order-A", 1, [section()], [position({ id: "pa" })]);
    const granite = makeOrder(
      "order-B",
      2,
      [section({ id: "s2", material: { groupKey: "granite", groupId: 2, materialId: 20, label: "Гранит" }, stoneKey: "granite" })],
      [position({ id: "pb", sectionId: "s2" })]
    );
    const groups = groupPiecesByMaterial([marble, granite]);
    expect(groups).toHaveLength(2);
    expect(new Set(groups.map((g) => g.materialName))).toEqual(new Set(["Мрамор Карара", "Гранит"]));
  });

  it("keeps different thicknesses apart", () => {
    const two = makeOrder("order-A", 1, [section()], [position({ id: "pa", thicknessCm: 2 })]);
    const three = makeOrder("order-B", 2, [section()], [position({ id: "pb", thicknessCm: 3 })]);
    const groups = groupPiecesByMaterial([two, three]);
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.thicknessMm).sort()).toEqual([20, 30]);
  });

  it("applies the grain resolver to pieces", () => {
    const a = makeOrder("order-A", 1, [section()], [position({ id: "pa" })]);
    const key = sectionMaterialKey(section());
    const [group] = groupPiecesByMaterial([a], { resolveGrain: (id) => (id === key ? "directional" : "none") });
    expect(group.pieces[0].grainRequired).toBe(true);
    expect(group.pieces[0].rotationAllowed).toBe(false);
  });
});
