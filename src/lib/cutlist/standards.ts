// Product standards used to judge whether an offcut is actually reusable.
//
// A leftover is only valuable if it can still yield a real product, so a 904×874 mm
// piece is useless for windowsills (which start at 1200 mm) even though it has area.
// The values below are defaults and are editable in the UI per optimization run.
//
// Assumptions (adjust in the UI if your catalogue differs):
//   windowsill — lengths 1200/1500/1800/2200 mm, min depth 150 mm
//   countertop — min 600×600 mm (module / depth 600 mm)
//   threshold  — lengths 900–1500 mm, min depth 100 mm

export type ProductKind = "windowsill" | "countertop" | "threshold";

export type ProductStandard = {
  key: ProductKind;
  label: string;
  /** Minimum offcut length that can still yield this product (mm). */
  minLengthMm: number;
  /** Minimum offcut width/depth (mm). */
  minWidthMm: number;
  /** Typical standard lengths (mm) — shown as guidance. */
  standardLengthsMm: number[];
};

export const PRODUCT_STANDARDS: Record<ProductKind, ProductStandard> = {
  windowsill: { key: "windowsill", label: "Перваз", minLengthMm: 1200, minWidthMm: 150, standardLengthsMm: [1200, 1500, 1800, 2200] },
  countertop: { key: "countertop", label: "Плот", minLengthMm: 600, minWidthMm: 600, standardLengthsMm: [600, 1200, 1800, 2400, 3000] },
  threshold: { key: "threshold", label: "Праг", minLengthMm: 900, minWidthMm: 100, standardLengthsMm: [900, 1000, 1200, 1500] },
};

export const PRODUCT_KINDS: ProductKind[] = ["windowsill", "countertop", "threshold"];

/** true when an offcut can yield the product (trying both orientations). */
export function offcutFitsProduct(offcut: { lengthMm: number; widthMm: number }, minLengthMm: number, minWidthMm: number): boolean {
  if (minLengthMm <= 0 || minWidthMm <= 0) return true;
  return (
    (offcut.lengthMm >= minLengthMm && offcut.widthMm >= minWidthMm) ||
    (offcut.widthMm >= minLengthMm && offcut.lengthMm >= minWidthMm)
  );
}
