// Pure, framework-free contracts for the natural-stone cutlist optimizer.
//
// Everything here is millimetres and integer-friendly: callers round dimensions
// before calling optimise() so no floating-point drift creeps into the geometry.
// This module has no React / Firebase imports, which keeps the engine unit-testable
// in isolation and reusable by a future inventory phase.

export type GrainAxis = "length" | "width";

// none        → grain is ignored entirely.
// directional → every piece must keep its length axis parallel to the slab grain axis.
// per-piece   → each piece decides through its own grainRequired flag.
export type GrainMode = "none" | "directional" | "per-piece";

// guillotine → every cut is a straight full-length cut (saw-friendly).
// freestyle  → general rectangle packing (MaxRects), fewer slabs but more complex cuts.
export type CuttingMode = "guillotine" | "freestyle";

export type SlabSpec = {
  /** Slab extent along its grain axis (x when grainAxis === "length"). */
  lengthMm: number;
  /** Slab extent along its cross axis (y when grainAxis === "length"). */
  widthMm: number;
  /** Direction of the natural veining/pattern on the slab. Defaults to "length". */
  grainAxis?: GrainAxis;
};

/** One entry of the available-slab pool: `qty` identical slabs, consumed in list order (priority). */
export type SlabPoolEntry = {
  lengthMm: number;
  widthMm: number;
  /** How many identical slabs of this size are available. */
  qty: number;
  /** Optional label for reporting (e.g. the inventory lot note). */
  label?: string;
};

/** Preferred orientation of pieces: auto = packer decides, otherwise the piece's length axis is fixed. */
export type OrientationPreference = "auto" | "length" | "width";

export type PieceSpec = {
  /** Stable id of the source position; one spec may expand into several instances. */
  pieceId: string;
  orderId: string;
  orderNumber?: number;
  label?: string;
  sectionId?: string;
  /** Piece extent along its own grain axis. */
  lengthMm: number;
  widthMm: number;
  quantity: number;
  /** false → the piece may never be rotated, regardless of the global switch. */
  rotationAllowed?: boolean;
  /** true → the piece's length axis must stay parallel to the slab grain axis. */
  grainRequired?: boolean;
  thicknessMm?: number;
  notes?: string;
};

export type OptimizeConfig = {
  slab: SlabSpec;
  /**
   * Optional pool of available slab sizes consumed in priority order (first entry first),
   * each limited by qty. When set, `slab` is only used as the reported default spec.
   */
  slabPool?: SlabPoolEntry[];
  /** auto = packer decides; length/width fixes the piece's length axis along that slab axis. */
  orientation?: OrientationPreference;
  /** Saw blade width in mm — real material removed between adjacent pieces. */
  kerfMm: number;
  grainMode: GrainMode;
  /** Global rotation switch; still gated by each piece's rotationAllowed and by grain. */
  allowRotation: boolean;
  cuttingMode: CuttingMode;
  /** Free areas with both axes at least this size count as reusable offcuts. Default 100 mm. */
  minReusableMm?: number;
  /** Product standard for offcut usefulness: a piece is "usable" only if it fits at least this length (mm). 0 = disabled. */
  minOffcutLengthMm?: number;
  /** Product standard: minimum offcut width/depth (mm). 0 = disabled. */
  minOffcutWidthMm?: number;
  /** Reproducible PRNG seed for bounded restarts. Default 1. */
  seed?: number;
  /** Upper bound on candidate layouts evaluated. Default 60. */
  maxCandidates?: number;
  /** Soft wall-clock budget in milliseconds. Default 1500 ms. */
  timeLimitMs?: number;
};

export type OptimizeInput = {
  materialId: string;
  materialName?: string;
  config: OptimizeConfig;
  pieces: PieceSpec[];
};

export type Placement = {
  pieceId: string;
  /** 1-based instance number for a piece whose quantity is greater than one. */
  instanceIndex: number;
  orderId: string;
  orderNumber?: number;
  label?: string;
  /** x offset along the slab length axis. */
  xMm: number;
  /** y offset along the slab width axis. */
  yMm: number;
  /** Placed extent along the slab length axis (x). */
  lengthMm: number;
  /** Placed extent along the slab width axis (y). */
  widthMm: number;
  rotated: boolean;
  grainRequired: boolean;
};

export type Offcut = {
  xMm: number;
  yMm: number;
  lengthMm: number;
  widthMm: number;
};

export type SlabResult = {
  slabIndex: number;
  lengthMm: number;
  widthMm: number;
  placements: Placement[];
  usedAreaMm2: number;
  slabAreaMm2: number;
  utilizationPercent: number;
  /** Free rectangles large enough to be reused (both axes >= minReusableMm). */
  offcuts: Offcut[];
  reusableOffcutAreaMm2: number;
  /** Area of the single largest reusable offcut on this slab (mm²). */
  largestOffcutAreaMm2: number;
  /** Reusable offcut area that can still yield a standard product (mm²). */
  usableOffcutAreaMm2: number;
  /** Area of the largest offcut that can still yield a standard product (mm²). */
  largestUsableOffcutAreaMm2: number;
  kerfLossAreaMm2: number;
  /** Number of saw cuts needed for this slab (real for guillotine, estimated otherwise). */
  cutCount: number;
  /** Total length of the saw cuts in mm (real for guillotine, estimated otherwise). */
  cutLengthMm: number;
};

export type UnplacedReason = "exceeds-slab" | "grain" | "orientation" | "search-exhausted" | "invalid";

export type UnplacedPiece = {
  pieceId: string;
  orderId: string;
  orderNumber?: number;
  label?: string;
  materialId: string;
  materialName?: string;
  lengthMm: number;
  widthMm: number;
  /** How many instances of this piece could not be placed. */
  quantity: number;
  reason: UnplacedReason;
  detail?: string;
};

export type OptimizeResult = {
  materialId: string;
  materialName?: string;
  /** complete → every requested instance was placed; partial → some remain unplaced. */
  status: "complete" | "partial";
  /** Winning strategy id, e.g. "maxrects-bssf/area-desc". */
  strategy: string;
  slabs: SlabResult[];
  slabsUsed: number;
  unplacedPieces: UnplacedPiece[];
  totalPieces: number;
  placedPieces: number;
  unplacedCount: number;
  totalSlabAreaMm2: number;
  usedAreaMm2: number;
  wasteAreaMm2: number;
  kerfLossAreaMm2: number;
  reusableOffcutAreaMm2: number;
  /** Area of the single largest reusable offcut across all slabs (mm²). */
  largestOffcutAreaMm2: number;
  /** Reusable offcut area that can still yield a standard product (mm²). */
  usableOffcutAreaMm2: number;
  /** Area of the largest offcut that can still yield a standard product (mm²). */
  largestUsableOffcutAreaMm2: number;
  totalUtilizationPercent: number;
  /** Total saw cuts across all slabs. */
  totalCutCount: number;
  /** Total length of all saw cuts in mm. */
  totalCutLengthMm: number;
  /** true when cut metrics come from a formula rather than a real guillotine sequence. */
  cutMetricsEstimated: boolean;
  kerfMm: number;
  slabSpec: SlabSpec;
  /** Slabs consumed per available size (for the pool report). */
  slabUsage: { lengthMm: number; widthMm: number; used: number; available: number }[];
  /** true when every slab can be cut with full straight cuts (2-axis bridge saw). */
  guillotineCuttable: boolean;
  config: OptimizeConfig;
  seed: number;
  candidatesEvaluated: number;
  durationMs: number;
};

export const DEFAULT_SLAB: Required<SlabSpec> = {
  lengthMm: 2900,
  widthMm: 1900,
  grainAxis: "length",
};

export const DEFAULT_KERF_MM = 4;

export const DEFAULT_MIN_REUSABLE_MM = 100;
