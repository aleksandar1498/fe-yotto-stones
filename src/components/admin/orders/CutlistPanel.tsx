"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { subscribeOrder, type Order } from "@/lib/orders/ordersData";
import { formatNum, type PricingSettings } from "@/lib/orders/pricing";
import { subscribeSlabStock, type GroupEntry, type SlabLot, type SlabStock } from "@/lib/adminData";
import { groupPiecesByMaterial, materialGrainResolver, type CutlistPieceGroup } from "@/lib/cutlist/build";
import { createSearch, type CutlistSearch } from "@/lib/cutlist/optimizer";
import { PRODUCT_KINDS, PRODUCT_STANDARDS, type ProductKind } from "@/lib/cutlist/standards";
import type { CuttingMode, GrainAxis, OptimizeConfig, OptimizeResult, OrientationPreference, SlabPoolEntry } from "@/lib/cutlist/types";
import { saveCutlist, subscribeCutlists, type SavedCutlist } from "@/lib/cutlist/store";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { ErrorBox, Field, NumInput, Spinner, dangerButton, inputClass, primaryButton, secondaryButton } from "../ui";
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

type SearchDepth = "fast" | "normal" | "deep";

const SEARCH_PRESETS: Record<SearchDepth, { maxCandidates: number; timeLimitMs: number; label: string }> = {
  fast: { maxCandidates: 60, timeLimitMs: 1500, label: "Бързо" },
  normal: { maxCandidates: 300, timeLimitMs: 8000, label: "Нормално" },
  deep: { maxCandidates: 1500, timeLimitMs: 30000, label: "Задълбочено" },
};

type Config = {
  kerfMm: number | null;
  respectGrain: boolean;
  allowRotation: boolean;
  cuttingMode: CuttingMode;
  grainAxis: GrainAxis;
  orientation: OrientationPreference;
  search: SearchDepth;
  product: ProductKind | "none";
  offcutLengthMm: number | null;
  offcutWidthMm: number | null;
};

const DEFAULT_CONFIG: Config = {
  kerfMm: 4,
  respectGrain: false,
  allowRotation: true,
  cuttingMode: "guillotine",
  grainAxis: "length",
  orientation: "auto",
  search: "normal",
  product: "windowsill",
  offcutLengthMm: PRODUCT_STANDARDS.windowsill.minLengthMm,
  offcutWidthMm: PRODUCT_STANDARDS.windowsill.minWidthMm,
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
  const [poolSel, setPoolSel] = useState<Record<string, string[]>>({});
  const [customSlab, setCustomSlab] = useState<Record<string, { lengthCm: number | null; widthCm: number | null }>>({});
  const [results, setResults] = useState<Record<string, OptimizeResult> | null>(null);
  const [activeMaterial, setActiveMaterial] = useState("");
  const [activeSlab, setActiveSlab] = useState(0);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState<SavedCutlist[]>([]);
  const [past, setPast] = useState<SavedCutlist[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ evaluated: number; total: number } | null>(null);
  const stopRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const searchesRef = useRef<{ key: string; search: CutlistSearch }[]>([]);

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

  useEffect(
    () => () => {
      stopRef.current = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

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

  const setProduct = (product: ProductKind | "none") =>
    setConfig((c) =>
      product === "none" ? { ...c, product } : { ...c, product, offcutLengthMm: PRODUCT_STANDARDS[product].minLengthMm, offcutWidthMm: PRODUCT_STANDARDS[product].minWidthMm }
    );

  const minOffcutActive = config.product !== "none";

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

  const poolIdsFor = (key: string, options: { id: string }[]) => poolSel[key] ?? options.map((o) => o.id);
  const togglePool = (key: string, id: string, options: { id: string }[]) =>
    setPoolSel((s) => {
      const base = s[key] ?? options.map((o) => o.id);
      return { ...s, [key]: base.includes(id) ? base.filter((x) => x !== id) : [...base, id] };
    });
  const movePool = (key: string, id: string, dir: -1 | 1, options: { id: string }[]) =>
    setPoolSel((s) => {
      const base = [...(s[key] ?? options.map((o) => o.id))];
      const i = base.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= base.length) return s;
      [base[i], base[j]] = [base[j], base[i]];
      return { ...s, [key]: base };
    });

  // The selected slabs for a material, in priority order (first entry is used first).
  const slabPoolFor = useCallback(
    (g: CutlistPieceGroup): SlabPoolEntry[] => {
      const options = slabOptions(g);
      const key = groupKeyOf(g);
      const ids = poolSel[key] ?? options.map((o) => o.id);
      const entries: SlabPoolEntry[] = [];
      for (const id of ids) {
        if (id === "custom") {
          const c = customSlab[key] ?? DEFAULT_SLAB_CM;
          entries.push({
            lengthMm: Math.round((c.lengthCm ?? DEFAULT_SLAB_CM.lengthCm) * 10),
            widthMm: Math.round((c.widthCm ?? DEFAULT_SLAB_CM.widthCm) * 10),
            qty: 1,
            label: "по избор",
          });
        } else {
          const o = options.find((x) => x.id === id);
          if (o) entries.push({ lengthMm: Math.round(o.lengthCm * 10), widthMm: Math.round(o.widthCm * 10), qty: o.qty, label: `${o.lengthCm}×${o.widthCm}` });
        }
      }
      if (entries.length === 0) {
        const c = customSlab[key] ?? DEFAULT_SLAB_CM;
        entries.push({
          lengthMm: Math.round((c.lengthCm ?? DEFAULT_SLAB_CM.lengthCm) * 10),
          widthMm: Math.round((c.widthCm ?? DEFAULT_SLAB_CM.widthCm) * 10),
          qty: Number.POSITIVE_INFINITY,
        });
      }
      return entries;
    },
    [slabOptions, poolSel, customSlab]
  );

  // Anytime search: step candidate layouts frame by frame, keep the best, allow stopping early.
  const run = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    const preset = SEARCH_PRESETS[config.search];
    const searches = pieceGroups.map((g) => {
      const pool = slabPoolFor(g);
      const primary = pool[0];
      const cfg: OptimizeConfig = {
        slab: { lengthMm: primary.lengthMm, widthMm: primary.widthMm, grainAxis: config.grainAxis },
        slabPool: pool,
        orientation: config.orientation,
        kerfMm: Math.max(0, Math.round(config.kerfMm ?? 4)),
        grainMode: config.respectGrain ? "per-piece" : "none",
        allowRotation: config.allowRotation,
        cuttingMode: config.cuttingMode,
        minReusableMm: 100,
        minOffcutLengthMm: config.product === "none" ? 0 : config.offcutLengthMm ?? 0,
        minOffcutWidthMm: config.product === "none" ? 0 : config.offcutWidthMm ?? 0,
        seed: 1,
        maxCandidates: preset.maxCandidates,
        timeLimitMs: preset.timeLimitMs,
      };
      return {
        key: groupKeyOf(g),
        search: createSearch({ materialId: g.materialId, materialName: g.materialName, config: cfg, pieces: g.pieces }),
      };
    });

    searchesRef.current = searches;
    stopRef.current = false;
    setResults(null);
    setActiveSlab(0);
    setActiveMaterial(pieceGroups[0] ? groupKeyOf(pieceGroups[0]) : "");
    setRunning(true);
    setProgress({ evaluated: 0, total: searches.reduce((a, s) => a + s.search.total, 0) });

    let first = true;
    const loop = () => {
      const stopping = stopRef.current;
      let active = false;
      let improved = false;
      let evaluated = 0;
      let total = 0;
      for (const { search } of searches) {
        // Evaluate a batch per frame so the search budget is actually used (not starved by re-renders).
        let steps = 0;
        while (!stopping && !search.done && steps < 8) {
          search.step();
          if (search.lastImproved) improved = true;
          steps++;
        }
        if (!stopping && !search.done) active = true;
        evaluated += search.evaluated;
        total += search.total;
      }
      if (improved || first || !active) {
        const acc: Record<string, OptimizeResult> = {};
        for (const { key, search } of searches) acc[key] = search.result();
        setResults(acc);
        first = false;
      }
      setProgress({ evaluated, total });
      if (active) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = null;
        setRunning(false);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [config, pieceGroups, slabPoolFor]);

  const stopSearch = useCallback(() => {
    stopRef.current = true;
  }, []);

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
          <Field label="Ориентация на детайлите" hint="По дължина = дългата страна по дължината на плочата (ленти); по ширина = вертикални колони.">
            <select
              className={inputClass}
              value={config.orientation}
              onChange={(e) => set("orientation", e.target.value as OrientationPreference)}
            >
              <option value="auto">Автоматично</option>
              <option value="length">По дължина (хоризонтални ленти)</option>
              <option value="width">По ширина (вертикални колони)</option>
            </select>
          </Field>
          <Field label="Дълбочина на търсенето" hint="Търси непрекъснато и подобрява разкроя; може да се спре по всяко време.">
            <select className={inputClass} value={config.search} onChange={(e) => set("search", e.target.value as SearchDepth)}>
              {(Object.keys(SEARCH_PRESETS) as SearchDepth[]).map((k) => (
                <option key={k} value={k}>
                  {SEARCH_PRESETS[k].label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Продукт (годен остатък)"
            hint={
              config.product === "none"
                ? "Без изискване — всеки остатък е „годен“."
                : `Стандартни дължини: ${PRODUCT_STANDARDS[config.product].standardLengthsMm.join(", ")} мм`
            }
          >
            <select className={inputClass} value={config.product} onChange={(e) => setProduct(e.target.value as ProductKind | "none")}>
              <option value="none">Без изискване</option>
              {PRODUCT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {PRODUCT_STANDARDS[k].label}
                </option>
              ))}
            </select>
          </Field>
          {minOffcutActive && (
            <>
              <Field label="Мин. дължина на остатъка (мм)" hint="Остатъци под това не се броят за годни.">
                <NumInput value={config.offcutLengthMm} onChange={(v) => set("offcutLengthMm", v)} min={0} />
              </Field>
              <Field label="Мин. ширина на остатъка (мм)">
                <NumInput value={config.offcutWidthMm} onChange={(v) => set("offcutWidthMm", v)} min={0} />
              </Field>
            </>
          )}
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
                    <th className="py-2 pr-3">Размери на плочите (по приоритет)</th>
                    <th className="py-2 pr-3">Приоритет</th>
                  </tr>
                </thead>
                <tbody>
                  {pieceGroups.map((g) => {
                    const key = groupKeyOf(g);
                    const options = slabOptions(g);
                    const ids = poolIdsFor(key, options);
                    const custom = customSlab[key] ?? DEFAULT_SLAB_CM;
                    const labelOfId = (id: string) =>
                      id === "custom" ? "по избор" : `${options.find((o) => o.id === id)?.lengthCm ?? "?"}×${options.find((o) => o.id === id)?.widthCm ?? "?"}`;
                    return (
                      <tr key={key} className="border-t border-gray-100 align-top">
                        <td className="py-2 pr-3">
                          {g.materialName} <span className="text-xs text-gray-400">· {g.thicknessMm} мм</span>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="space-y-1">
                            {options.length === 0 && <p className="text-xs text-amber-700">Няма налични размери — добавете ръчно:</p>}
                            {options.map((o) => {
                              const idx = ids.indexOf(o.id);
                              return (
                                <div key={o.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-darkGold"
                                    checked={idx >= 0}
                                    onChange={() => togglePool(key, o.id, options)}
                                    aria-label={`Включи ${o.lengthCm}×${o.widthCm} см`}
                                  />
                                  <span className="text-sm">
                                    {o.lengthCm} × {o.widthCm} см{o.thicknessCm ? ` · ${o.thicknessCm} см` : ""} · {o.qty} бр.
                                  </span>
                                  {idx >= 0 && (
                                    <span className="ml-auto flex items-center">
                                      <button
                                        type="button"
                                        className="rounded px-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                                        disabled={idx === 0}
                                        onClick={() => movePool(key, o.id, -1, options)}
                                        title="По-висок приоритет"
                                        aria-label="По-висок приоритет"
                                      >
                                        ↑
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded px-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                                        disabled={idx === ids.length - 1}
                                        onClick={() => movePool(key, o.id, 1, options)}
                                        title="По-нисък приоритет"
                                        aria-label="По-нисък приоритет"
                                      >
                                        ↓
                                      </button>
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-darkGold"
                                checked={ids.includes("custom")}
                                onChange={() => togglePool(key, "custom", options)}
                                aria-label="Друг размер"
                              />
                              <span className="text-sm">Друг размер…</span>
                            </div>
                            {ids.includes("custom") && (
                              <div className="flex items-center gap-2 pl-6">
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
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-xs text-gray-600">
                          {ids.length === 0 ? (
                            <span className="text-amber-700">изберете поне един размер</span>
                          ) : (
                            <span>Приоритет: {ids.map(labelOfId).join(" → ")}</span>
                          )}
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
          {running ? (
            <button className={dangerButton} onClick={stopSearch}>
              ■ Спри и използвай най-доброто
            </button>
          ) : (
            <button className={primaryButton} onClick={run} disabled={pieceGroups.length === 0}>
              ▶ Стартирай оптимизацията
            </button>
          )}
          {running && progress ? (
            <span className="text-sm text-gray-600">
              оценени {progress.evaluated} / {progress.total} варианта…
            </span>
          ) : (
            <span className="text-xs text-gray-500">
              Търси непрекъснато и подобрява разкроя; спрете, когато резултатът е добър (гледайте използваемостта и
              най-големия остатък).
            </span>
          )}
        </div>
        {running && progress && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-darkGold transition-all"
              style={{ width: `${progress.total > 0 ? Math.min(100, (progress.evaluated / progress.total) * 100) : 0}%` }}
            />
          </div>
        )}
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

          {/* Visualization first so you can review it while changing settings below. */}
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
                  {minOffcutActive && (
                    <>
                      {" "}
                      · годен остатък {formatNum(activeSlabData.usableOffcutAreaMm2 / 1_000_000, 2)} м²
                    </>
                  )}
                </p>
                <CutlistLayout
                  slab={activeSlabData}
                  slabSpec={activeResult.slabSpec}
                  kerfMm={activeResult.kerfMm}
                  labelOf={orderLabel}
                  minOffcutLengthMm={minOffcutActive ? config.offcutLengthMm ?? undefined : undefined}
                  minOffcutWidthMm={minOffcutActive ? config.offcutWidthMm ?? undefined : undefined}
                />
              </>
            )}
          </div>

          {!activeResult.guillotineCuttable && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
              ⚠ Този разкрой <strong>не е изпълним с прави разфасовки</strong> (2-осна машина): има детайл, който изисква
              разрез през друг детайл. Изберете „Комбинирани прави разфасовки“ или променете настройките.
            </p>
          )}
          {activeResult.slabUsage.length > 0 && (
            <p
              className={`rounded-lg px-4 py-2 text-sm ${
                activeResult.slabUsage.some((u) => u.used > u.available) ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
              }`}
            >
              {activeResult.slabUsage.some((u) => u.used > u.available) ? "⚠" : "✔"} Използвани плочи:{" "}
              {activeResult.slabUsage.map((u) => `${u.lengthMm / 10}×${u.widthMm / 10} см: ${u.used} от ${u.available}`).join(" · ")}
              {activeResult.slabUsage.some((u) => u.used > u.available) && " — недостиг на наличност."}
            </p>
          )}

          <CutlistReport
            result={activeResult}
            labelOf={orderLabel}
            productLabel={config.product !== "none" ? PRODUCT_STANDARDS[config.product].label : undefined}
            minOffcutLengthMm={minOffcutActive ? config.offcutLengthMm ?? undefined : undefined}
            minOffcutWidthMm={minOffcutActive ? config.offcutWidthMm ?? undefined : undefined}
          />

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
