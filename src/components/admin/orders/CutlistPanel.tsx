"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { subscribeOrder, type Order } from "@/lib/orders/ordersData";
import { formatNum, type PricingSettings } from "@/lib/orders/pricing";
import type { GroupEntry } from "@/lib/adminData";
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
  slabLengthCm: number | null;
  slabWidthCm: number | null;
  kerfMm: number | null;
  respectGrain: boolean;
  allowRotation: boolean;
  cuttingMode: CuttingMode;
  grainAxis: GrainAxis;
};

const DEFAULT_CONFIG: Config = {
  slabLengthCm: 290,
  slabWidthCm: 190,
  kerfMm: 4,
  respectGrain: false,
  allowRotation: true,
  cuttingMode: "guillotine",
  grainAxis: "length",
};

const groupKeyOf = (g: CutlistPieceGroup) => `${g.materialId}#${g.thicknessMm}`;

export default function CutlistPanel({ orderIds, pricing, groups, onClose, onToast }: Props) {
  const { user } = useAdminAuth();
  const orderKey = orderIds.join(",");

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
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

  const run = useCallback(() => {
    const cfg: OptimizeConfig = {
      slab: {
        lengthMm: Math.round((config.slabLengthCm ?? 290) * 10),
        widthMm: Math.round((config.slabWidthCm ?? 190) * 10),
        grainAxis: config.grainAxis,
      },
      kerfMm: Math.max(0, Math.round(config.kerfMm ?? 4)),
      grainMode: config.respectGrain ? "per-piece" : "none",
      allowRotation: config.allowRotation,
      cuttingMode: config.cuttingMode,
      minReusableMm: 100,
      seed: 1,
      maxCandidates: 60,
      timeLimitMs: 2000,
    };
    const out: Record<string, OptimizeResult> = {};
    for (const g of pieceGroups) {
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
  }, [config, pieceGroups]);

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Дължина на плочата (см)">
            <NumInput value={config.slabLengthCm} onChange={(v) => set("slabLengthCm", v)} min={1} />
          </Field>
          <Field label="Ширина на плочата (см)">
            <NumInput value={config.slabWidthCm} onChange={(v) => set("slabWidthCm", v)} min={1} />
          </Field>
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
