"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { subscribeOrder, type Order } from "@/lib/orders/ordersData";
import { formatNum, type PricingSettings } from "@/lib/orders/pricing";
import { subscribeSlabStock, type GroupEntry, type SlabLot, type SlabStock } from "@/lib/adminData";
import { groupPiecesByMaterial, materialGrainResolver, type CutlistPieceGroup } from "@/lib/cutlist/build";
import { optimize } from "@/lib/cutlist/optimizer";
import type { CuttingMode, GrainAxis, OptimizeConfig, OptimizeResult } from "@/lib/cutlist/types";
import { saveCutlist, subscribeCutlists, type SavedCutlist } from "@/lib/cutlist/store";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { ErrorBox, Field, NumInput, Spinner, inputClass, primaryButton, secondaryButton } from "../ui";
import CutlistLayout from "./CutlistLayout";
import CutlistReport from "./CutlistReport";
import { formatDateTime, orderNo } from "./common";

type Props = {
  orderIds: string[];
  pricing: PricingSettings;
  groups: GroupEntry[];
  onClose: () => void;
  onToast: (msg: string) => void;
};

type Config = {
  kerfMm: number | null;
  respectGrain: boolean;
  allowRotation: boolean;
  cuttingMode: CuttingMode;
  grainAxis: GrainAxis;
};

const DEFAULT_CONFIG: Config = {
  kerfMm: 4,
  respectGrain: false,
  allowRotation: true,
  cuttingMode: "guillotine",
  grainAxis: "length",
};

const DEFAULT_SLAB_CM = { lengthCm: 290, widthCm: 190 };

const groupKeyOf = (g: CutlistPieceGroup) => `${g.materialId}#${g.thicknessMm}`;
// build.ts keys a material as "mat:<groupKey>:<materialId>", which is exactly the
// slab_stock key under the "mat:" prefix.
const stockKeyOf = (g: CutlistPieceGroup) => (g.materialId.startsWith("mat:") ? g.materialId.slice(4) : undefined);

export default function CutlistPanel({ orderIds, pricing, groups, onClose, onToast }: Props) {
  const { user } = useAdminAuth();
  const orderKey = orderIds.join(",");

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [stock, setStock] = useState<Record<string, SlabStock>>({});
  const [slabChoice, setSlabChoice] = useState<Record<string, string>>({});
  const [customSlab, setCustomSlab] = useState<Record<string, { lengthCm: number | null; widthCm: number | null }>>({});
  const [results, setResults] = useState<Record<string, OptimizeResult> | null>(null);
  const [activeMaterial, setActiveMaterial] = useState("");
  const [activeSlab, setActiveSlab] = useState(0);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState<SavedCutlist[]>([]);
  const [past, setPast] = useState<SavedCutlist[]>([]);

  useEffect(() => {
    const map = new Map<string, Order>();
    const unsubs = orderIds.map((id) =>
      subscribeOrder(
        id,
        (o) => {
          if (o) map.set(id, o);
          else map.delete(id);
          setOrders([...map.values()]);
        },
        (e) => setError(e.message)
      )
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKey]);

  useEffect(() => subscribeCutlists(setPast, () => setPast([])), []);
  useEffect(() => subscribeSlabStock(setStock, () => setStock({})), []);

  const pieceGroups = useMemo(() => {
    if (!orders) return [];
    return groupPiecesByMaterial(orders, { pricing, resolveGrain: materialGrainResolver(groups) });
  }, [orders, pricing, groups]);

  const orderById = useMemo(() => new Map((orders ?? []).map((o) => [o.id, o])), [orders]);
  const orderLabel = useCallback(
    (id: string) => {
      const o = orderById.get(id);
      return o ? `${orderNo(o.number)} · ${o.client.name}` : id;
    },
    [orderById]
  );

  const relevantPast = useMemo(
    () => past.filter((c) => c.orders.some((o) => orderIds.includes(o.id))),
    [past, orderIds]
  );

  const set = <K extends keyof Config>(key: K, value: Config[K]) => setConfig((c) => ({ ...c, [key]: value }));

  // Available slab sizes for a material, grouped by dimensions (from slab_stock).
  const slabOptions = useCallback(
    (g: CutlistPieceGroup) => {
      const key = stockKeyOf(g);
      const lots: SlabLot[] = (key && stock[key]?.slabs) || [];
      const map = new Map<string, { id: string; lengthCm: number; widthCm: number; thicknessCm: number | null; qty: number }>();
      for (const l of lots) {
        const id = `${l.lengthCm}x${l.widthCm}x${l.thicknessCm ?? ""}`;
        const cur = map.get(id);
        if (cur) cur.qty += Number(l.qty) || 0;
        else
          map.set(id, {
            id,
            lengthCm: Number(l.lengthCm) || 0,
            widthCm: Number(l.widthCm) || 0,
            thicknessCm: l.thicknessCm ?? null,
            qty: Number(l.qty) || 0,
          });
      }
      return [...map.values()].sort((a, b) => b.qty - a.qty || b.lengthCm * b.widthCm - a.lengthCm * a.widthCm);
    },
    [stock]
  );

  const choiceOf = (g: CutlistPieceGroup, options = slabOptions(g)) =>
    slabChoice[groupKeyOf(g)] ?? (options.length ? options[0].id : "custom");

  // Chosen slab for a material: an inventory lot (with its availability) or a custom size.
  const slabFor = useCallback(
    (g: CutlistPieceGroup): { lengthCm: number; widthCm: number; qty: number | null } => {
      const options = slabOptions(g);
      const choice = slabChoice[groupKeyOf(g)] ?? (options.length ? options[0].id : "custom");
      if (choice !== "custom") {
        const opt = options.find((o) => o.id === choice);
        if (opt) return { lengthCm: opt.lengthCm, widthCm: opt.widthCm, qty: opt.qty };
      }
      const custom = customSlab[groupKeyOf(g)] ?? DEFAULT_SLAB_CM;
      return { lengthCm: custom.lengthCm ?? DEFAULT_SLAB_CM.lengthCm, widthCm: custom.widthCm ?? DEFAULT_SLAB_CM.widthCm, qty: null };
    },
    [slabOptions, slabChoice, customSlab]
  );

  const run = useCallback(() => {
    const out: Record<string, OptimizeResult> = {};
    for (const g of pieceGroups) {
      const slab = slabFor(g);
      const cfg: OptimizeConfig = {
        slab: { lengthMm: Math.round(slab.lengthCm * 10), widthMm: Math.round(slab.widthCm * 10), grainAxis: config.grainAxis },
        kerfMm: Math.max(0, Math.round(config.kerfMm ?? 4)),
        grainMode: config.respectGrain ? "per-piece" : "none",
        allowRotation: config.allowRotation,
        cuttingMode: config.cuttingMode,
        minReusableMm: 100,
        seed: 1,
        maxCandidates: 60,
        timeLimitMs: 2000,
      };
      out[groupKeyOf(g)] = optimize({
        materialId: g.materialId,
        materialName: g.materialName,
        config: cfg,
        pieces: g.pieces,
      });
    }
    setResults(out);
    setActiveSlab(0);
    setActiveMaterial(pieceGroups[0] ? groupKeyOf(pieceGroups[0]) : "");
  }, [config, pieceGroups, slabFor]);

  const save = useCallback(async () => {
    if (!results) return;
    const created: SavedCutlist[] = [];
    for (const g of pieceGroups) {
      const r = results[groupKeyOf(g)];
      if (!r) continue;
      const refs = g.orderIds.map((id) => {
        const o = orderById.get(id);
        return { id, number: o?.number ?? 0, clientName: o?.client.name ?? "" };
      });
      const doc = await saveCutlist({
        name: (name.trim() || g.materialName) + ` · ${g.thicknessMm} мм`,
        status: r.status,
        materialId: g.materialId,
        materialName: g.materialName,
        thicknessMm: g.thicknessMm,
        orders: refs,
        result: r,
        createdBy: user?.email ?? undefined,
      });
      created.push(doc);
    }
    setSaved(created);
    onToast(`Запазени разкрои: ${created.length}.`);
  }, [results, pieceGroups, name, orderById, user, onToast]);

  if (error) return <ErrorBox>Грешка при зареждане на поръчките: {error}</ErrorBox>;
  if (!orders) return <Spinner label="Зареждане на избраните поръчки…" />;

  const totalPieces = pieceGroups.reduce((a, g) => a + g.pieces.reduce((b, p) => b + p.quantity, 0), 0);

  const activeGroup = pieceGroups.find((g) => groupKeyOf(g) === activeMaterial) ?? pieceGroups[0];
  const activeResult = activeGroup ? results?.[groupKeyOf(activeGroup)] : undefined;
  const activeSlabData = activeResult?.slabs[Math.min(activeSlab, (activeResult?.slabs.length ?? 1) - 1)];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-darkGold">Разкрой</p>
          <h1 className="text-3xl font-bold text-obsidian">Оптимизация на разкрой</h1>
          <p className="mt-1 text-sm text-gray-500">
            {orderIds.length} поръчки · {pieceGroups.length} материала · {totalPieces} детайла
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {results && (
            <button className={secondaryButton} onClick={() => setResults(null)}>
              ← Настройки
            </button>
          )}
          <button className={secondaryButton} onClick={onClose}>
            Затвори
          </button>
        </div>
      </div>

      {/* Step 1 — review grouped pieces */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-darkGold">1. Преглед на детайлите</h2>
        <p className="mb-3 text-xs text-gray-500">
          Детайлите са групирани по материал и дебелина. Различни материали никога не се смесват на една плоча.
        </p>
        {pieceGroups.length === 0 ? (
          <p className="text-sm text-gray-500">Няма позиции в избраните поръчки.</p>
        ) : (
          <div className="space-y-4">
            {pieceGroups.map((g) => (
              <div key={groupKeyOf(g)} className="rounded-lg border border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2">
                  <span className="font-semibold text-obsidian">{g.materialName}</span>
                  <span className="text-xs text-gray-500">
                    {g.thicknessMm} мм · {g.pieces.reduce((a, p) => a + p.quantity, 0)} бр. · {g.orderIds.length} поръчки
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-4 py-2">Поръчка</th>
                        <th className="px-4 py-2">Детайл</th>
                        <th className="px-4 py-2 text-center">Д×Ш (мм)</th>
                        <th className="px-4 py-2 text-center">Бр.</th>
                        <th className="px-4 py-2 text-center">Текстура</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {g.pieces.map((p) => (
                        <tr key={p.pieceId}>
                          <td className="px-4 py-2 text-gray-600">{orderLabel(p.orderId)}</td>
                          <td className="px-4 py-2">{p.label}</td>
                          <td className="px-4 py-2 text-center">
                            {p.lengthMm} × {p.widthMm}
                          </td>
                          <td className="px-4 py-2 text-center">{p.quantity}</td>
                          <td className="px-4 py-2 text-center">{p.grainRequired ? "да" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2 — configuration */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-darkGold">2. Настройки на плочата и разкроя</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Прорез / kerf (мм)" hint="Реално отнета ширина от диска.">
            <NumInput value={config.kerfMm} onChange={(v) => set("kerfMm", v)} min={0} />
          </Field>
          <Field label="Посока на текстурата на плочата">
            <select className={inputClass} value={config.grainAxis} onChange={(e) => set("grainAxis", e.target.value as GrainAxis)}>
              <option value="length">По дължина</option>
              <option value="width">По ширина</option>
            </select>
          </Field>
          <Field label="Начин на рязане" hint="Гилотината комбинира вертикални и хоризонтални прави разфасовки.">
            <select className={inputClass} value={config.cuttingMode} onChange={(e) => set("cuttingMode", e.target.value as CuttingMode)}>
              <option value="guillotine">Комбинирани прави разфасовки (хор. + верт.)</option>
              <option value="freestyle">Свободно подреждане (макс. ефективност)</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 self-end text-sm text-obsidian">
            <input type="checkbox" checked={config.respectGrain} onChange={(e) => set("respectGrain", e.target.checked)} />
            Спазвай посоката на текстурата
          </label>
          <label className="flex items-center gap-2 self-end text-sm text-obsidian">
            <input type="checkbox" checked={config.allowRotation} onChange={(e) => set("allowRotation", e.target.checked)} />
            Разреши завъртане на 90°
          </label>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">Плоча по материал (от наличността)</p>
          {pieceGroups.length === 0 ? (
            <p className="text-sm text-gray-500">Няма материали.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="py-2 pr-3">Материал</th>
                    <th className="py-2 pr-3">Размер на плочата</th>
                    <th className="py-2 pr-3">Наличност</th>
                  </tr>
                </thead>
                <tbody>
                  {pieceGroups.map((g) => {
                    const key = groupKeyOf(g);
                    const options = slabOptions(g);
                    const choice = choiceOf(g, options);
                    const slab = slabFor(g);
                    const custom = customSlab[key] ?? DEFAULT_SLAB_CM;
                    return (
                      <tr key={key} className="border-t border-gray-100 align-top">
                        <td className="py-2 pr-3">
                          {g.materialName} <span className="text-xs text-gray-400">· {g.thicknessMm} мм</span>
                        </td>
                        <td className="py-2 pr-3">
                          <select
                            className={inputClass}
                            value={choice}
                            onChange={(e) => setSlabChoice((c) => ({ ...c, [key]: e.target.value }))}
                            aria-label={`Размер на плочата за ${g.materialName}`}
                          >
                            {options.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.lengthCm} × {o.widthCm} см{o.thicknessCm ? ` · ${o.thicknessCm} см` : ""} · {o.qty} бр.
                              </option>
                            ))}
                            <option value="custom">Друг размер…</option>
                          </select>
                          {choice === "custom" && (
                            <div className="mt-2 flex items-center gap-2">
                              <NumInput
                                className={`${inputClass} w-24`}
                                value={custom.lengthCm}
                                min={1}
                                onChange={(v) => setCustomSlab((c) => ({ ...c, [key]: { ...(c[key] ?? DEFAULT_SLAB_CM), lengthCm: v } }))}
                                aria-label="Дължина на плочата"
                              />
                              <span className="text-gray-400">×</span>
                              <NumInput
                                className={`${inputClass} w-24`}
                                value={custom.widthCm}
                                min={1}
                                onChange={(v) => setCustomSlab((c) => ({ ...c, [key]: { ...(c[key] ?? DEFAULT_SLAB_CM), widthCm: v } }))}
                                aria-label="Ширина на плочата"
                              />
                              <span className="text-xs text-gray-400">см</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {slab.qty == null ? <span className="text-amber-700">по избор</span> : <span className="text-gray-600">{slab.qty} бр.</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Размерите идват от „Наличност“ на материала (Каталог → Наличност на плочите). Ако няма наличност, задайте размер ръчно.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className={primaryButton} onClick={run} disabled={pieceGroups.length === 0}>
            ▶ Стартирай оптимизацията
          </button>
          <span className="text-xs text-gray-500">
            Детерминистичен алгоритъм · оценява няколко подредби и избира най-ефективната.
          </span>
        </div>
      </div>

      {/* Step 3 — results */}
      {results && activeGroup && activeResult && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {pieceGroups.map((g) => {
              const r = results[groupKeyOf(g)];
              const key = groupKeyOf(g);
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveMaterial(key);
                    setActiveSlab(0);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    activeMaterial === key ? "bg-darkGold text-white" : "border border-darkGold text-darkGold hover:bg-darkGold/10"
                  }`}
                >
                  {g.materialName} · {g.thicknessMm} мм
                  {r.unplacedCount > 0 && <span className="ml-2 rounded-full bg-red-600 px-2 text-xs text-white">{r.unplacedCount}</span>}
                </button>
              );
            })}
          </div>

          {(() => {
            const slab = slabFor(activeGroup);
            if (slab.qty == null) return null;
            const enough = activeResult.slabsUsed <= slab.qty;
            return (
              <p className={`rounded-lg px-4 py-2 text-sm ${enough ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                {enough ? "✔" : "⚠"} Нужни {activeResult.slabsUsed} плочи · налични {slab.qty} ({slab.lengthCm} × {slab.widthCm} см).
                {!enough && " Не достигат плочи – намалете поръчката или изберете друг размер."}
              </p>
            );
          })()}

          <CutlistReport result={activeResult} labelOf={orderLabel} />

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-darkGold">Разположение по плочи</h3>
              <div className="flex flex-wrap gap-1">
                {activeResult.slabs.map((s, i) => (
                  <button
                    key={s.slabIndex}
                    onClick={() => setActiveSlab(i)}
                    className={`rounded-md px-3 py-1 text-sm font-semibold transition ${
                      activeSlab === i ? "bg-obsidian text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Плоча {s.slabIndex}
                  </button>
                ))}
              </div>
            </div>
            {activeSlabData && (
              <>
                <p className="mb-3 text-xs text-gray-500">
                  Плоча {activeSlabData.slabIndex} от {activeResult.slabsUsed} · {activeSlabData.placements.length} детайла ·{" "}
                  използваемост {formatNum(activeSlabData.utilizationPercent, 1)} % · остатък{" "}
                  {formatNum(activeSlabData.reusableOffcutAreaMm2 / 1_000_000, 2)} м²
                </p>
                <CutlistLayout slab={activeSlabData} slabSpec={activeResult.slabSpec} kerfMm={activeResult.kerfMm} labelOf={orderLabel} />
              </>
            )}
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-darkGold">4. Запазване и експорт</h3>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Име на разкроя (по избор)">
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={activeGroup.materialName} />
              </Field>
              <button className={primaryButton} onClick={save}>
                💾 Запази разкроя ({pieceGroups.length})
              </button>
            </div>
            {saved.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm">
                {saved.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-2">
                    <span>
                      <span className="font-semibold text-obsidian">{c.name}</span>{" "}
                      <span className="text-xs text-gray-500">
                        {c.result.slabsUsed} плочи · {formatNum(c.result.totalUtilizationPercent, 1)} % използваемост
                      </span>
                    </span>
                    <Link href={`/admin/print/cutlist/${c.id}`} target="_blank" className="font-semibold text-darkGold hover:underline">
                      Печат / PDF ↗
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {relevantPast.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-darkGold">Запазени разкрои за тези поръчки</h3>
          <ul className="space-y-1 text-sm">
            {relevantPast.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-2">
                <span>
                  <span className="font-semibold text-obsidian">{c.name}</span>{" "}
                  <span className="text-xs text-gray-500">
                    {c.status === "partial" ? "непълен · " : ""}
                    {c.result.slabsUsed} плочи · {formatDateTime(c.createdAt)}
                  </span>
                </span>
                <Link href={`/admin/print/cutlist/${c.id}`} target="_blank" className="font-semibold text-darkGold hover:underline">
                  Печат / PDF ↗
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
