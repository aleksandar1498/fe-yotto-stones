"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import { deleteMaterial, downloadBackup, toGroupEntries, type GroupEntry, type Material } from "@/lib/adminData";
import { fallbackToLocal, materialDisplayName, materialImageSrc } from "@/lib/materialImage";
import { materialPriceM2 } from "@/lib/orders/publicQuote";
import MaterialForm from "./MaterialForm";
import GroupForm from "./GroupForm";
import { Modal, dangerButton, inputClass, primaryButton, secondaryButton } from "./ui";

type Dialog =
  | { kind: "material"; groupKey: string; material?: Material }
  | { kind: "group"; groupKey: string }
  | { kind: "delete"; groupKey: string; material: Material };

export default function AdminDashboard() {
  const [groups, setGroups] = useState<GroupEntry[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [toast, setToast] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(
    () =>
      onValue(
        ref(db, "group_materials"),
        (snap) => setGroups(toGroupEntries(snap.val())),
        (err) => setLoadError(err.message)
      ),
    []
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      (groups ?? []).map((g) => ({
        group: g,
        materials: q
          ? g.materials.filter((m) =>
              [m.name, m.displayName, m.origin, String(m.id)].some((v) => v?.toLowerCase().includes(q))
            )
          : g.materials,
      })),
    [groups, q]
  );

  const groupByKey = (key: string) => groups?.find((g) => g.key === key);
  const closeWith = (message: string) => {
    setDialog(null);
    setToast(message);
  };

  const confirmDelete = async () => {
    if (dialog?.kind !== "delete") return;
    setDeleting(true);
    try {
      await deleteMaterial(dialog.groupKey, dialog.material.id);
      closeWith(`Материал „${materialDisplayName(dialog.material)}“ е изтрит.`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Грешка при изтриване.");
    } finally {
      setDeleting(false);
    }
  };

  if (loadError) {
    return <p className="rounded-lg bg-red-50 p-4 text-red-700">Грешка при зареждане: {loadError}</p>;
  }
  if (!groups) {
    return <p className="py-20 text-center text-sm uppercase tracking-[0.2em] text-darkGold">Зареждане на материалите…</p>;
  }

  const total = groups.reduce((n, g) => n + g.materials.length, 0);
  const dialogGroup = dialog ? groupByKey(dialog.groupKey) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-darkGold">Каталог</p>
          <h1 className="text-3xl font-bold text-obsidian">Групи и материали</h1>
          <p className="mt-1 text-sm text-gray-500">
            {groups.length} групи · {total} материала
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className={`${inputClass} sm:w-72`}
            placeholder="Търси по име, произход, #id…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className={secondaryButton} onClick={() => downloadBackup().catch((e) => setToast(e.message))}>
            ⬇ JSON архив
          </button>
        </div>
      </div>

      {filtered.map(({ group, materials }) => {
        const open = openKey === group.key || (!!q && materials.length > 0);
        return (
          <section key={group.key} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <button
                className="flex flex-1 items-center gap-4 text-left"
                onClick={() => setOpenKey(open && !q ? null : group.key)}
              >
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {group.mainImageUrl && <img src={group.mainImageUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-obsidian">
                    {group.name} <span className="text-sm font-normal text-gray-400">· {group.category} · #{group.id}</span>
                  </h2>
                  <p className="truncate text-sm text-gray-500">{group.title}</p>
                </div>
                <span className="ml-auto rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  {q ? `${materials.length}/${group.materials.length}` : group.materials.length}
                </span>
                <span className={`text-darkGold transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
              </button>
              <div className="flex gap-2">
                <button className={secondaryButton} onClick={() => setDialog({ kind: "group", groupKey: group.key })}>
                  Редактирай групата
                </button>
                <button className={primaryButton} onClick={() => setDialog({ kind: "material", groupKey: group.key })}>
                  + Материал
                </button>
              </div>
            </div>

            {open && (
              <div className="grid grid-cols-1 gap-4 border-t border-gray-100 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                {materials.length === 0 && <p className="col-span-full py-6 text-center text-sm text-gray-400">Няма материали.</p>}
                {materials.map((m) => (
                  <article key={m.id} className="group flex flex-col overflow-hidden rounded-lg bg-white shadow transition hover:shadow-lg">
                    <div className="relative h-36 overflow-hidden bg-gray-100">
                      <img
                        src={materialImageSrc(m, group.id)}
                        onError={fallbackToLocal(m, group.id)}
                        alt={materialDisplayName(m)}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {m.trending && (
                        <span className="absolute left-2 top-2 rounded-full bg-royalGold px-2 py-0.5 text-xs font-semibold text-obsidian">
                          Премиум
                        </span>
                      )}
                      <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">#{m.id}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <h3 className="font-semibold text-obsidian">{materialDisplayName(m)}</h3>
                      <p className="text-xs text-gray-500">{[m.origin, m.surface].filter(Boolean).join(" · ") || m.name}</p>
                      <p className="mt-1 text-xs text-gray-400">{materialPriceM2(m.price) != null ? `Цена: ${materialPriceM2(m.price)} €/м²` : "Цена: по вид камък"}</p>
                      <div className="mt-auto flex gap-2 pt-3">
                        <button
                          className="flex-1 rounded-md bg-darkGold py-1.5 text-xs font-semibold text-white hover:bg-darkGoldHover"
                          onClick={() => setDialog({ kind: "material", groupKey: group.key, material: m })}
                        >
                          Редактирай
                        </button>
                        <a
                          href={`/materials/${group.id}/${m.id}`}
                          target="_blank"
                          className="rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-600 hover:border-darkGold hover:text-darkGold"
                          title="Виж в сайта"
                        >
                          ↗
                        </a>
                        <button
                          className="rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => setDialog({ kind: "delete", groupKey: group.key, material: m })}
                          title="Изтрий"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {dialog?.kind === "material" && dialogGroup && (
        <MaterialForm
          group={dialogGroup}
          material={dialog.material}
          onClose={() => setDialog(null)}
          onSaved={closeWith}
        />
      )}
      {dialog?.kind === "group" && dialogGroup && (
        <GroupForm group={dialogGroup} onClose={() => setDialog(null)} onSaved={closeWith} />
      )}
      {dialog?.kind === "delete" && (
        <Modal
          title="Изтриване на материал"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button className={secondaryButton} onClick={() => setDialog(null)} disabled={deleting}>
                Отказ
              </button>
              <button className={dangerButton} onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Изтриване…" : "Изтрий"}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700">
            Сигурни ли сте, че искате да изтриете <strong>{materialDisplayName(dialog.material)}</strong> (#{dialog.material.id})
            от групата <strong>{dialogGroup?.name}</strong>? Действието е необратимо – препоръчваме първо да изтеглите JSON архив.
          </p>
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-obsidian px-5 py-3 text-sm text-platinum shadow-2xl">
          <span className="mr-2 text-royalGold">●</span>
          {toast}
        </div>
      )}
    </div>
  );
}
