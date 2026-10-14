"use client";

import { useState } from "react";
import { saveSlabStock, slabStockTotal, type GroupEntry, type Material, type SlabLot } from "@/lib/adminData";
import { Modal, NumInput, inputClass, primaryButton, secondaryButton } from "./ui";

const blankLot = (id: number): SlabLot => ({ id, lengthCm: 290, widthCm: 180, qty: 1 });

type Props = {
  group: GroupEntry;
  material: Material;
  initial?: SlabLot[];
  onClose: () => void;
  onSaved: (message: string) => void;
};

export default function SlabStockForm({ group, material, initial, onClose, onSaved }: Props) {
  const [slabs, setSlabs] = useState<SlabLot[]>(() =>
    initial && initial.length ? initial.map((s, i) => ({ ...s, id: i + 1 })) : [blankLot(1)]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (i: number, patch: Partial<SlabLot>) => setSlabs((l) => l.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const add = () => setSlabs((l) => [...l, blankLot(l.length + 1)]);
  const remove = (i: number) => setSlabs((l) => l.filter((_, j) => j !== i));

  const total = slabStockTotal(slabs);

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await saveSlabStock(group, material, slabs);
      onSaved(`Наличността на „${material.displayName || material.name}“ е запазена.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={`Наличност – ${material.displayName || material.name}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose} disabled={saving}>
            Отказ
          </button>
          <button type="button" className={primaryButton} onClick={submit} disabled={saving}>
            {saving ? "Запазване…" : "Запази"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Плочи на склад за този материал. Размерите са в сантиметри. Еднаквите плочи се групират в един ред с „брой“;
          различните размери са отделни редове. Наличните количества ще се намаляват при потвърден разкрой.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="py-2 pr-3">Дължина (см)</th>
                <th className="py-2 pr-3">Ширина (см)</th>
                <th className="py-2 pr-3">Дебелина (см)</th>
                <th className="py-2 pr-3">Брой</th>
                <th className="py-2 pr-3">Бележка</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {slabs.map((s, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="w-[130px] py-2 pr-3">
                    <NumInput value={s.lengthCm} min={0} onChange={(n) => set(i, { lengthCm: n ?? 0 })} aria-label="Дължина" />
                  </td>
                  <td className="w-[130px] py-2 pr-3">
                    <NumInput value={s.widthCm} min={0} onChange={(n) => set(i, { widthCm: n ?? 0 })} aria-label="Ширина" />
                  </td>
                  <td className="w-[130px] py-2 pr-3">
                    <NumInput
                      value={s.thicknessCm ?? null}
                      min={0}
                      placeholder="—"
                      onChange={(n) => set(i, { thicknessCm: n })}
                      aria-label="Дебелина"
                    />
                  </td>
                  <td className="w-[110px] py-2 pr-3">
                    <NumInput value={s.qty} integer min={0} onChange={(n) => set(i, { qty: n ?? 0 })} aria-label="Брой" />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className={inputClass}
                      value={s.note ?? ""}
                      placeholder="напр. склад / партида"
                      onChange={(e) => set(i, { note: e.target.value })}
                      aria-label="Бележка"
                    />
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-red-50 hover:text-red-700"
                      onClick={() => remove(i)}
                      disabled={slabs.length === 1}
                      title="Премахни реда"
                      aria-label="Премахни реда"
                    >
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="text-sm font-semibold text-darkGold hover:underline" onClick={add}>
            + Добави размер
          </button>
          <p className="text-sm text-gray-600">
            Общо плочи: <strong className="text-obsidian">{total}</strong>
          </p>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}
