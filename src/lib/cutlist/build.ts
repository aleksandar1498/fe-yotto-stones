// Maps existing orders/positions onto the pure optimizer contracts.
//
// This module deliberately avoids runtime imports of the Firebase-backed modules
// (ordersData/adminData) — only `import type` is used for their shapes, which is
// erased at build time. That keeps the grouping logic free of network side effects
// and safe to unit-test.

import type { Order, MaterialSection } from "@/lib/orders/ordersData";
import type { GroupEntry } from "@/lib/adminData";
import { PRODUCT_TYPES, type PricingSettings, type Position } from "@/lib/orders/pricing";
import type { PieceSpec } from "./types";

export type GrainSetting = "none" | "directional";

/** Resolves a material's grain policy. Defaults to non-directional so nothing changes unless configured. */
export type GrainResolver = (materialId: string) => GrainSetting;

export type CutlistPieceGroup = {
  /** Stable identity used to keep different materials (and thicknesses) apart. */
  materialId: string;
  materialName: string;
  stoneKey: string;
  thicknessMm: number;
  /** Pieces from every selected order that share this material + thickness. */
  pieces: PieceSpec[];
  orderIds: string[];
};

const cmToMm = (cm: unknown): number => Math.round((typeof cm === "number" && Number.isFinite(cm) ? cm : 0) * 10);

/** Stable identity of the stone a section is cut from. */
export function sectionMaterialKey(section: MaterialSection): string {
  const m = section.material;
  if (m?.materialId != null) return `mat:${m.groupKey ?? m.groupId ?? ""}:${m.materialId}`;
  if (m?.groupId != null) return `grp:${m.groupId}`;
  if (m?.groupKey) return `grp:${m.groupKey}`;
  return `stone:${section.stoneKey}`;
}

export function sectionMaterialName(section: MaterialSection, pricing?: Pick<PricingSettings, "stones">): string {
  const label = section.material?.label?.trim();
  if (label) return label;
  const stone = pricing?.stones?.[section.stoneKey]?.label;
  return stone || section.stoneKey || "Материал";
}

/** Builds a grain resolver from the catalogue so materials can opt into directional cutting. */
export function materialGrainResolver(groups: GroupEntry[]): GrainResolver {
  const map = new Map<string, GrainSetting>();
  for (const group of groups) {
    for (const material of group.materials ?? []) {
      map.set(`mat:${group.key}:${material.id}`, material.grain === "directional" ? "directional" : "none");
    }
  }
  return (materialId) => map.get(materialId) ?? "none";
}

// Local, dependency-free equivalent of ordersData.ensureSections (type-only import above).
function resolveSections(order: Order): MaterialSection[] {
  const sections = (order.sections ?? []).filter(Boolean);
  if (sections.length) return [...sections].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  return [
    {
      id: "main",
      sort: 0,
      material: order.material ?? { label: "" },
      stoneKey: order.stoneKey,
      materialPriceM2: order.materialPriceM2 ?? null,
    },
  ];
}

function positionLabel(p: Position): string {
  if (p.label?.trim()) return p.label.trim();
  const type = PRODUCT_TYPES.find((t) => t.key === p.type)?.label ?? p.type;
  return `${type} ${p.sort + 1}`;
}

export type GroupOptions = {
  pricing?: Pick<PricingSettings, "stones">;
  /** Grain policy per material ID. Missing → "none" (rotation allowed). */
  resolveGrain?: GrainResolver;
  /** Fallback thickness when a position has none, in mm. Default 20 mm. */
  defaultThicknessMm?: number;
};

/**
 * Combines positions from several orders into per-material groups.
 *
 * Two pieces land in the same group only when their material identity AND thickness
 * match, so different stones are never mixed on a slab. Order/piece references are
 * preserved on every spec for traceability.
 */
export function groupPiecesByMaterial(orders: Order[], opts: GroupOptions = {}): CutlistPieceGroup[] {
  const resolveGrain = opts.resolveGrain ?? (() => "none" as GrainSetting);
  const defaultThicknessMm = opts.defaultThicknessMm ?? 20;
  const groups = new Map<string, CutlistPieceGroup>();

  for (const order of orders) {
    const sections = resolveSections(order);
    const sectionById = new Map(sections.map((s) => [s.id, s]));
    const fallback = sections[0];

    for (const position of order.positions ?? []) {
      const section = (position.sectionId && sectionById.get(position.sectionId)) || fallback;
      if (!section) continue;

      const materialId = sectionMaterialKey(section);
      const thicknessMm = cmToMm(position.thicknessCm) || defaultThicknessMm;
      const groupKey = `${materialId}#${thicknessMm}`;

      let group = groups.get(groupKey);
      if (!group) {
        group = {
          materialId,
          materialName: sectionMaterialName(section, opts.pricing),
          stoneKey: section.stoneKey,
          thicknessMm,
          pieces: [],
          orderIds: [],
        };
        groups.set(groupKey, group);
      }
      if (!group.orderIds.includes(order.id)) group.orderIds.push(order.id);

      const grain = resolveGrain(materialId);
      const piece: PieceSpec = {
        pieceId: `${order.id}:${position.id}`,
        orderId: order.id,
        orderNumber: order.number,
        label: positionLabel(position),
        sectionId: section.id,
        lengthMm: cmToMm(position.lengthCm),
        widthMm: cmToMm(position.depthCm),
        quantity: Math.max(0, Math.floor(position.qty)),
        thicknessMm,
        grainRequired: grain === "directional",
        rotationAllowed: grain !== "directional",
        notes: position.notes,
      };
      group.pieces.push(piece);
    }
  }

  return [...groups.values()].sort(
    (a, b) => a.materialName.localeCompare(b.materialName, "bg") || a.thicknessMm - b.thicknessMm
  );
}
