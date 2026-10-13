// Firebase RTDB persistence for saved cutlists.
//
// Kept separate from the optimizer so the engine stays pure. A cutlist is an
// immutable-ish snapshot of one material's optimization result plus its source
// order references — the contract a future inventory phase will consume.
//
// Reading goes through ./normalize because RTDB drops empty arrays.

import { onValue, push, ref, update, type Unsubscribe } from "firebase/database";
import { db } from "@/lib/firebase";
import { normalizeCutlist, type SavedCutlist } from "./normalize";

export type { CutlistOrderRef, SavedCutlist } from "./normalize";

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";

// Strip undefined recursively — RTDB rejects it.
function prune<T>(value: T): T {
  if (Array.isArray(value)) return value.map(prune) as T;
  if (!isObj(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = prune(v);
  return out as T;
}

export function newCutlistId(): string {
  return push(ref(db, "cutlists")).key as string;
}

export async function saveCutlist(
  draft: Omit<SavedCutlist, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<SavedCutlist> {
  const now = Date.now();
  const id = draft.id ?? newCutlistId();
  const doc: SavedCutlist = { ...draft, id, createdAt: now, updatedAt: now };
  const { id: _omit, ...stored } = doc;
  void _omit;
  await update(ref(db), { [`cutlists/${id}`]: prune(stored) });
  return doc;
}

function toList(value: unknown): SavedCutlist[] {
  if (!isObj(value)) return [];
  return Object.entries(value)
    .map(([id, v]) => normalizeCutlist(id, v))
    .filter((c): c is SavedCutlist => c !== null)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export function subscribeCutlists(cb: (list: SavedCutlist[]) => void, onError: (e: Error) => void): Unsubscribe {
  return onValue(ref(db, "cutlists"), (snap) => cb(toList(snap.val())), onError);
}

export function subscribeCutlist(id: string, cb: (c: SavedCutlist | null) => void, onError: (e: Error) => void): Unsubscribe {
  return onValue(
    ref(db, `cutlists/${id}`),
    (snap) => cb(normalizeCutlist(id, snap.val())),
    onError
  );
}

export async function deleteCutlist(id: string): Promise<void> {
  await update(ref(db), { [`cutlists/${id}`]: null });
}
