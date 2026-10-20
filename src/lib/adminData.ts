import { get, onValue, ref, runTransaction, update, type Unsubscribe } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export type Material = {
  id: number;
  name: string;
  displayName?: string;
  imageName?: string;
  imageUrl?: string;
  price?: string | number;
  origin?: string;
  material?: string;
  surface?: string;
  sizes?: string;
  description?: string;
  seoDescription?: string;
  galleryImageUrls?: string[];
  trending?: boolean;
  /** Grain policy for cutting: directional = pieces must keep their orientation. */
  grain?: "none" | "directional";
};

export type MaterialGroup = {
  id: number;
  category: string;
  name: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  mainImageUrl?: string;
  materials: Material[];
};

// A group as stored in RTDB, plus the key under group_materials it lives at.
export type GroupEntry = MaterialGroup & { key: string };

export type GroupDetails = Omit<MaterialGroup, "id" | "materials">;

// ---------- slab availability (stock) ----------
//
// Kept out of group_materials on purpose: the catalogue is public-read and cached,
// while stock changes often (on every confirmed cutlist) and must stay admin-only.
// One entry = a lot of identical slabs; consumption decrements qty, and reusable
// offcuts can simply be added later as smaller lots.
export type SlabLot = {
  id: number;
  lengthCm: number;
  widthCm: number;
  thicknessCm?: number | null;
  qty: number;
  note?: string;
};

export type SlabStock = {
  groupKey: string;
  groupId?: number;
  materialId: number;
  materialName?: string;
  updatedAt?: number;
  slabs: SlabLot[];
};

/** Stable identity of a material's stock — matches the order MaterialRef (groupKey + materialId). */
export const slabStockKey = (groupKey: string, materialId: number) => `${groupKey}:${materialId}`;

export const slabStockTotal = (slabs?: SlabLot[] | null): number =>
  (slabs ?? []).reduce((a, s) => a + (Number(s.qty) || 0), 0);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// RTDB turns arrays with holes into objects; normalise both shapes to a clean list.
export function toList<T>(value: T[] | Record<string, T> | null | undefined): T[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : Object.values(value)).filter(Boolean) as T[];
}

export function toGroupEntries(data: unknown): GroupEntry[] {
  if (!data || typeof data !== "object") return [];
  return Object.entries(data as Record<string, MaterialGroup | null>)
    .filter(([, g]) => !!g)
    .map(([key, g]) => ({ ...(g as MaterialGroup), key, materials: toList(g!.materials) }))
    .sort((a, b) => a.id - b.id);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const materialsPath = (groupKey: string) => `group_materials/${groupKey}/materials`;

// Drop empty optional fields so RTDB stays tidy (RTDB also rejects `undefined`).
function clean<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as T;
}

export async function saveMaterial(groupKey: string, material: Omit<Material, "id"> & { id?: number }) {
  let savedId = material.id ?? 0;

  // Transaction keeps the array dense and the id unique even if two tabs are open.
  const result = await runTransaction(ref(db, materialsPath(groupKey)), (current) => {
    const list = toList<Material>(current);
    if (material.id) {
      // First call may see an un-synced local cache (null); returning it lets the SDK retry with server data.
      if (current === null) return current;
      const idx = list.findIndex((m) => m.id === material.id);
      if (idx === -1) return; // abort: it was deleted meanwhile
      list[idx] = clean({ ...material, id: material.id } as Material);
    } else {
      savedId = Math.max(0, ...list.map((m) => Number(m.id) || 0)) + 1;
      list.push(clean({ ...material, id: savedId } as Material));
    }
    return list;
  });

  if (!result.committed) throw new Error("Материалът вече не съществува.");
  return savedId;
}

export async function deleteMaterial(groupKey: string, materialId: number) {
  await runTransaction(ref(db, materialsPath(groupKey)), (current) =>
    current === null ? current : toList<Material>(current).filter((m) => m.id !== materialId)
  );
  // Keep the stock's lifecycle tied to the material: ids are reused (max+1), so a
  // deleted material's slabs must go too, otherwise a future material could inherit them.
  await update(ref(db), { [slabStockPath(groupKey, materialId)]: null });
}

// ---------- slab stock read/write ----------

const slabStockPath = (groupKey: string, materialId: number) => `slab_stock/${slabStockKey(groupKey, materialId)}`;

// RTDB rejects undefined values, so drop them recursively before writing.
function pruneDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map(pruneDeep) as T;
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) if (v !== undefined) out[k] = pruneDeep(v);
  return out as T;
}

export function subscribeSlabStock(cb: (map: Record<string, SlabStock>) => void, onError: (e: Error) => void): Unsubscribe {
  return onValue(
    ref(db, "slab_stock"),
    (snap) => {
      const raw = snap.val();
      const out: Record<string, SlabStock> = {};
      if (raw && typeof raw === "object") {
        for (const [key, value] of Object.entries(raw as Record<string, SlabStock>)) {
          out[key] = { ...(value as SlabStock), slabs: toList<SlabLot>((value as SlabStock).slabs) };
        }
      }
      cb(out);
    },
    onError
  );
}

/** Replaces a material's whole slab list. Rows without dimensions or quantity are dropped. */
export async function saveSlabStock(
  group: { key: string; id: number },
  material: Pick<Material, "id" | "name" | "displayName">,
  slabs: SlabLot[]
): Promise<void> {
  const cleaned = (slabs ?? [])
    .map((s, i) => ({
      id: i + 1,
      lengthCm: Number(s.lengthCm) || 0,
      widthCm: Number(s.widthCm) || 0,
      thicknessCm: Number(s.thicknessCm) > 0 ? Number(s.thicknessCm) : undefined,
      qty: Math.max(0, Math.floor(Number(s.qty) || 0)),
      note: s.note?.trim() || undefined,
    }))
    .filter((s) => s.lengthCm > 0 && s.widthCm > 0 && s.qty > 0);

  await update(ref(db), {
    [slabStockPath(group.key, material.id)]: pruneDeep({
      groupKey: group.key,
      groupId: group.id,
      materialId: material.id,
      materialName: material.displayName || material.name,
      updatedAt: Date.now(),
      slabs: cleaned,
    }),
  });
}

export async function deleteSlabStock(groupKey: string, materialId: number): Promise<void> {
  await update(ref(db), { [slabStockPath(groupKey, materialId)]: null });
}

export async function saveGroupDetails(groupKey: string, details: GroupDetails) {
  const { category, name, title, shortDescription, description, mainImageUrl } = details;
  await update(ref(db, `group_materials/${groupKey}`), {
    category,
    name,
    title: title ?? "",
    shortDescription: shortDescription ?? "",
    description: description ?? "",
    mainImageUrl: mainImageUrl ?? "",
  });
}

export async function uploadMaterialImage(category: string, file: File, baseName: string) {
  if (!file.type.startsWith("image/")) throw new Error("Позволени са само изображения.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Изображението трябва да е под 5 MB.");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const imageName = `${slugify(baseName) || "image"}-${Date.now()}.${ext}`;
  const path = `images/group_materials/${slugify(category) || "misc"}/${imageName}`;

  const snapshot = await uploadBytes(storageRef(storage, path), file, { contentType: file.type });
  const imageUrl = await getDownloadURL(snapshot.ref);
  return { imageName, imageUrl };
}

export async function downloadBackup() {
  const snapshot = await get(ref(db, "/"));
  const blob = new Blob([JSON.stringify(snapshot.val(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `yotto-stones-rtdb-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
