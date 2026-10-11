"use client";

import { useState } from "react";
import { type GroupEntry } from "@/lib/adminData";
import { savePricing } from "@/lib/orders/ordersData";
import { DEFAULT_PRICING, PRODUCT_TYPES, UNIT_LABELS, type PricingSettings, type ServiceUnit } from "@/lib/orders/pricing";
import { Modal, NumInput, primaryButton, secondaryButton } from "../ui";

type Props = { pricing: PricingSettings; groups: GroupEntry[]; onClose: () => void; onSaved: () => void };

const cell = "w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-darkGold";
const checkCls = "bg-amber-50";

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wider text-darkGold first:mt-0">{children}</h3>;
}

export default function PricingSettingsForm({ pricing, groups, onClose, onSaved }: Props) {
  const [p, setP] = useState<PricingSettings>(() => structuredClone(pricing));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const stoneKeys = Object.keys(p.stones);
  const set = (patch: Partial<PricingSettings>) => setP((cur) => ({ ...cur, ...patch }));
  const n = (v: number | null) => v ?? 0;

  async function save() {
    setError("");
    const bad =
      p.vatPct < 0 ||
      p.vatPct > 100 ||
      Object.values(p.wastePct).some((w) => w < 0 || w > 200) ||
      Object.values(p.stones).some((s) => s.materialM2 <= 0);
    if (bad) {
      setError("Проверете стойностите: ДДС 0–100%, фира 0–200%, цена на материал > 0.");
      return;
    }
    setSaving(true);
    try {
      await savePricing(p);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Ценоразпис (цени без ДДС)"
      onClose={onClose}
      wide
      footer={
        <>
          <button
            className="mr-auto text-sm text-gray-500 hover:text-obsidian"
            onClick={() => setP(structuredClone(DEFAULT_PRICING))}
            disabled={saving}
          >
            Върни примерните цени
          </button>
          <button className={secondaryButton} onClick={onClose} disabled={saving}>
            Отказ
          </button>
          <button className={primaryButton} onClick={save} disabled={saving}>
            {saving ? "Запазване…" : "Запази"}
          </button>
        </>
      }
    >
      <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        Полетата в жълто са ориентировъчни и трябва да бъдат потвърдени. Промените важат за нови поръчки и за „Преизчисли с текущите
        цени“ – вече записаните поръчки пазят своите цени.
      </p>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <H>Общи</H>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(
          [
            ["vatPct", "ДДС, %"],
            ["minOrderNet", "Мин. поръчка, € без ДДС"],
            ["minPieceAreaM2", "Мин. площ на парче, м²"],
            ["dripGrooveM", "Водооткапващ канал, €/м"],
            ["buildUpMultiplier", "Множител профил при подлепка"],
            ["defaultBuildUpCm", "Подлепка по подразбиране, см"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="block text-xs text-gray-600">
            {label}
            <NumInput className={`${cell} mt-1`} value={p[k]} min={0} onChange={(v) => set({ [k]: n(v) })} />
          </label>
        ))}
      </div>

      <H>Фира по тип изделие, %</H>
      <div className="grid gap-3 sm:grid-cols-3">
        {PRODUCT_TYPES.map((t) => (
          <label key={t.key} className="block text-xs text-gray-600">
            {t.label}
            <NumInput
              className={`${cell} mt-1`}
              value={p.wastePct[t.key]}
              min={0}
              onChange={(v) => set({ wastePct: { ...p.wastePct, [t.key]: n(v) } })}
            />
          </label>
        ))}
      </div>

      <H>Коефициент за дебелина (× цена на материала)</H>
      <div className="flex flex-wrap gap-3">
        {Object.entries(p.thicknessFactors).map(([cm, f]) => (
          <label key={cm} className="block w-28 text-xs text-gray-600">
            {cm} см
            <NumInput
              className={`${cell} mt-1`}
              value={f}
              min={0}
              onChange={(v) => set({ thicknessFactors: { ...p.thicknessFactors, [cm]: n(v) } })}
            />
          </label>
        ))}
      </div>

      <H>Камък (€ без ДДС)</H>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs text-gray-500">
            <tr>
              <th className="py-1 pr-2">Вид</th>
              <th className="py-1 pr-2">Групи от каталога</th>
              <th className="py-1 pr-2">Материал /м²</th>
              <th className="py-1 pr-2">Рязане /м</th>
              <th className="py-1 pr-2">Импрегн. /м²</th>
              <th className="py-1">Запечатка чело /м</th>
            </tr>
          </thead>
          <tbody>
            {stoneKeys.map((k) => {
              const s = p.stones[k];
              const upd = (patch: Partial<typeof s>) => set({ stones: { ...p.stones, [k]: { ...s, ...patch, check: false } } });
              return (
                <tr key={k} className={`border-t border-gray-100 ${s.check ? checkCls : ""}`}>
                  <td className="py-1 pr-2 font-semibold">{s.label}</td>
                  <td className="py-1 pr-2 text-xs text-gray-500">
                    {groups.filter((g) => (s.groupIds ?? []).includes(g.id)).map((g) => g.name).join(", ") || "—"}
                  </td>
                  {(["materialM2", "cuttingM", "sealM2", "sealEdgeM"] as const).map((f) => (
                    <td key={f} className="py-1 pr-2">
                      <NumInput className={cell} value={s[f]} min={0} onChange={(v) => upd({ [f]: n(v) })} aria-label={`${s.label} ${f}`} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <H>Профили на ръба (€/м)</H>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs text-gray-500">
            <tr>
              <th className="py-1 pr-2">Профил</th>
              {stoneKeys.map((k) => (
                <th key={k} className="py-1 pr-2">
                  {p.stones[k].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(p.profiles).map(([k, pr]) => (
              <tr key={k} className={`border-t border-gray-100 ${pr.check ? checkCls : ""}`}>
                <td className="py-1 pr-2">
                  <input
                    className={cell}
                    value={pr.label}
                    onChange={(e) => set({ profiles: { ...p.profiles, [k]: { ...pr, label: e.target.value } } })}
                    aria-label="Име на профила"
                  />
                </td>
                {stoneKeys.map((sk) => (
                  <td key={sk} className="py-1 pr-2">
                    <NumInput
                      className={cell}
                      value={pr.prices?.[sk] ?? 0}
                      min={0}
                      onChange={(v) =>
                        set({ profiles: { ...p.profiles, [k]: { ...pr, check: false, prices: { ...pr.prices, [sk]: n(v) } } } })
                      }
                      aria-label={`${pr.label} ${p.stones[sk].label}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <H>Отвори (€/бр.)</H>
          {Object.entries(p.cutouts).map(([k, c]) => (
            <div key={k} className={`mb-1 flex gap-2 ${c.check ? checkCls : ""}`}>
              <input
                className={cell}
                value={c.label}
                onChange={(e) => set({ cutouts: { ...p.cutouts, [k]: { ...c, label: e.target.value } } })}
                aria-label="Име на отвора"
              />
              <NumInput
                className={`${cell} w-24`}
                value={c.price}
                min={0}
                onChange={(v) => set({ cutouts: { ...p.cutouts, [k]: { ...c, check: false, price: n(v) } } })}
                aria-label={`Цена ${c.label}`}
              />
            </div>
          ))}
        </div>
        <div>
          <H>Услуги</H>
          {Object.entries(p.services).map(([k, s]) => (
            <div key={k} className="mb-1 flex gap-2">
              <input
                className={cell}
                value={s.label}
                onChange={(e) => set({ services: { ...p.services, [k]: { ...s, label: e.target.value } } })}
                aria-label="Име на услугата"
              />
              <select
                className={`${cell} w-24`}
                value={s.unit}
                onChange={(e) => set({ services: { ...p.services, [k]: { ...s, unit: e.target.value as ServiceUnit } } })}
                aria-label="Мярка"
              >
                {(Object.keys(UNIT_LABELS) as ServiceUnit[]).map((u) => (
                  <option key={u} value={u}>
                    {u === "flat" ? "фикс." : UNIT_LABELS[u]}
                  </option>
                ))}
              </select>
              <NumInput
                className={`${cell} w-24`}
                value={s.price}
                min={0}
                onChange={(v) => set({ services: { ...p.services, [k]: { ...s, price: n(v) } } })}
                aria-label={`Цена ${s.label}`}
              />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-6 text-xs text-gray-400">
        Валута: {p.currency}. Цените се въвеждат без ДДС.
      </p>
    </Modal>
  );
}
