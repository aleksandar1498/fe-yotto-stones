"use client";

import { useState, type ReactNode } from "react";
import {
  PRODUCT_TYPES,
  SIDES,
  formatMoney,
  formatNum,
  type Position,
  type PositionQuote,
  type PricingSettings,
  type Side,
} from "@/lib/orders/pricing";
import { Field, NumInput, inputClass } from "../ui";

type Props = {
  position: Position;
  index: number;
  count: number;
  pricing: PricingSettings;
  stoneKey: string;
  quote?: PositionQuote;
  currency: string;
  errors?: Record<string, string>;
  readOnly?: boolean;
  attachmentsCount?: number;
  onChange: (p: Position) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
};

const iconBtn = "rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-obsidian disabled:opacity-30";

export function edgeSummary(p: Position, pricing: PricingSettings): string {
  const parts = SIDES.filter((s) => p.edges?.[s.key]?.profile).map((s) => {
    const e = p.edges![s.key]!;
    return `${s.short}: ${pricing.profiles[e.profile]?.label ?? e.profile}${e.buildUp ? " + подлепка" : ""}`;
  });
  return parts.length ? parts.join("; ") : "без обработка";
}

// Top view: L1 bottom (front), L2 top (back), S1 left, S2 right. Gold = finished edge, blue dashes = drip groove.
function EdgeDiagram({ p }: { p: Position }) {
  const L = Math.max(1, p.lengthCm || 1);
  const D = Math.max(1, p.depthCm || 1);
  const w = 160;
  const h = Math.max(24, Math.min(90, (w * D) / L));
  const x0 = 10;
  const y0 = 10;
  const coords: Record<Side, [number, number, number, number]> = {
    l1: [x0, y0 + h, x0 + w, y0 + h],
    l2: [x0, y0, x0 + w, y0],
    s1: [x0, y0, x0, y0 + h],
    s2: [x0 + w, y0, x0 + w, y0 + h],
  };
  return (
    <svg viewBox={`0 0 ${w + 20} ${h + 20}`} className="h-auto w-full max-w-[200px]" aria-hidden>
      <rect x={x0} y={y0} width={w} height={h} fill="#f5f1e8" stroke="#d1d5db" />
      {SIDES.map((s) => {
        const [a, b, c, d] = coords[s.key];
        const e = p.edges?.[s.key];
        return (
          <g key={s.key}>
            {e?.profile && <line x1={a} y1={b} x2={c} y2={d} stroke="#C8A45B" strokeWidth={e.buildUp ? 7 : 4} />}
            {p.drip?.[s.key] && <line x1={a} y1={b} x2={c} y2={d} stroke="#0284c7" strokeWidth={2} strokeDasharray="4 3" />}
          </g>
        );
      })}
      <text x={x0 + w / 2} y={y0 + h / 2 + 4} textAnchor="middle" fontSize="10" fill="#6b7280">
        {p.lengthCm || "?"}×{p.depthCm || "?"}
      </text>
    </svg>
  );
}

export default function PositionEditor({
  position: p,
  index,
  count,
  pricing,
  stoneKey,
  quote,
  currency,
  errors = {},
  readOnly,
  attachmentsCount = 0,
  onChange,
  onDuplicate,
  onDelete,
  onMove,
}: Props) {
  const [open, setOpen] = useState(true);
  const [showCutouts, setShowCutouts] = useState(
    p.type === "countertop" || Object.values(p.cutouts ?? {}).some((n) => Number(n) > 0)
  );
  const set = (patch: Partial<Position>) => onChange({ ...p, ...patch });
  const setEdge = (side: Side, patch: { profile?: string; buildUp?: boolean }) => {
    const cur = p.edges?.[side] ?? { profile: "" };
    const next = { ...cur, ...patch };
    const edges = { ...(p.edges ?? {}) };
    if (!next.profile) delete edges[side];
    else edges[side] = { profile: next.profile, ...(next.buildUp ? { buildUp: true } : {}) };
    set({ edges });
  };
  const anyBuildUp = SIDES.some((s) => p.edges?.[s.key]?.buildUp);
  const typeLabel = PRODUCT_TYPES.find((t) => t.key === p.type)?.label ?? p.type;
  const hasError = Object.keys(errors).length > 0;

  return (
    <section className={`rounded-xl border bg-white shadow-sm ${hasError ? "border-red-300" : "border-gray-200"}`}>
      <header className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
        <button className="flex flex-1 items-center gap-2 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-obsidian text-xs font-bold text-royalGold">{index + 1}</span>
          <span className="font-semibold text-obsidian">
            {typeLabel}
            {p.label ? ` – ${p.label}` : ""}
          </span>
          <span className="hidden text-sm text-gray-500 sm:inline">
            {p.lengthCm || "?"}×{p.depthCm || "?"}×{p.thicknessCm || "?"} см · {p.qty || 0} бр.
          </span>
          {attachmentsCount > 0 && <span className="text-xs text-gray-400">📎 {attachmentsCount}</span>}
        </button>
        <span className="font-semibold text-obsidian">{formatMoney(quote?.total ?? 0, currency)}</span>
        {!readOnly && (
          <div className="flex items-center">
            <button className={iconBtn} onClick={() => onMove(-1)} disabled={index === 0} title="Нагоре" aria-label="Премести нагоре">
              ↑
            </button>
            <button className={iconBtn} onClick={() => onMove(1)} disabled={index === count - 1} title="Надолу" aria-label="Премести надолу">
              ↓
            </button>
            <button className={iconBtn} onClick={onDuplicate} title="Дублирай позицията" aria-label="Дублирай позицията">
              ⧉
            </button>
            <button className={`${iconBtn} hover:text-red-700`} onClick={onDelete} title="Изтрий" aria-label="Изтрий позицията">
              🗑
            </button>
          </div>
        )}
      </header>

      {open && (
        <fieldset disabled={readOnly} className="space-y-5 p-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
            <Field label="Тип">
              <select className={inputClass} value={p.type} onChange={(e) => set({ type: e.target.value as Position["type"] })}>
                {PRODUCT_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Означение" hint="напр. „Кухня – прозорец 2“">
                <input className={inputClass} value={p.label ?? ""} onChange={(e) => set({ label: e.target.value })} maxLength={80} />
              </Field>
            </div>
            <Field label="Дължина" error={errors.lengthCm}>
              <Cm>
                <NumInput value={p.lengthCm} min={0} onChange={(n) => set({ lengthCm: n ?? 0 })} />
              </Cm>
            </Field>
            <Field label="Дълбочина" error={errors.depthCm}>
              <Cm>
                <NumInput value={p.depthCm} min={0} onChange={(n) => set({ depthCm: n ?? 0 })} />
              </Cm>
            </Field>
            <Field label="Дебелина" error={errors.thicknessCm}>
              <select className={inputClass} value={String(p.thicknessCm)} onChange={(e) => set({ thicknessCm: Number(e.target.value) })}>
                {Array.from(new Set([...Object.keys(pricing.thicknessFactors), String(p.thicknessCm)]))
                  .filter(Boolean)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((t) => (
                    <option key={t} value={t}>
                      {t} см
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Брой" hint="еднакви парчета" error={errors.qty}>
              <NumInput value={p.qty} integer min={0} onChange={(n) => set({ qty: n ?? 0 })} />
            </Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_200px]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="py-1 pr-2">Страна</th>
                    <th className="py-1 pr-2">Профил на ръба</th>
                    <th className="py-1 pr-2 text-center" title="Подлепка (удебеляване на чело)">
                      Подлепка
                    </th>
                    <th className="py-1 text-center" title="Водооткапващ канал">
                      Канал
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SIDES.map((s) => {
                    const e = p.edges?.[s.key];
                    return (
                      <tr key={s.key} className="border-t border-gray-100">
                        <td className="py-1.5 pr-2 whitespace-nowrap">
                          <span className="mr-1 font-mono text-xs text-gray-400">{s.short}</span>
                          {s.label}
                        </td>
                        <td className="py-1.5 pr-2">
                          <select
                            className={`${inputClass} py-1.5`}
                            value={e?.profile ?? ""}
                            onChange={(ev) => setEdge(s.key, { profile: ev.target.value })}
                            aria-label={`Профил ${s.label}`}
                          >
                            <option value="">— без обработка —</option>
                            {Object.entries(pricing.profiles).map(([k, pr]) => (
                              <option key={k} value={k}>
                                {pr.label}
                                {pr.prices?.[stoneKey] ? ` (${formatMoney(pr.prices[stoneKey], currency)}/м)` : ""}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1.5 pr-2 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-darkGold"
                            disabled={readOnly || !e?.profile}
                            checked={!!e?.buildUp}
                            onChange={(ev) => setEdge(s.key, { buildUp: ev.target.checked })}
                            aria-label={`Подлепка ${s.label}`}
                          />
                        </td>
                        <td className="py-1.5 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-sky-600"
                            checked={!!p.drip?.[s.key]}
                            onChange={(ev) => set({ drip: { ...(p.drip ?? {}), [s.key]: ev.target.checked } })}
                            aria-label={`Канал ${s.label}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {anyBuildUp && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Височина на подлепката, см</span>
                  <NumInput
                    className={`${inputClass} w-20 py-1`}
                    value={p.buildUpCm ?? pricing.defaultBuildUpCm}
                    min={0}
                    onChange={(n) => set({ buildUpCm: n ?? pricing.defaultBuildUpCm })}
                    aria-label="Височина на подлепката"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
              <EdgeDiagram p={p} />
              <span>
                <span className="text-royalGold">━</span> обработен ръб · <span className="text-sky-600">┅</span> канал
              </span>
              <span>Д1 = предна (долу), Д2 = задна</span>
            </div>
          </div>

          <div>
            {showCutouts ? (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {Object.entries(pricing.cutouts).map(([k, c]) => (
                  <Field key={k} label={c.label} hint={`${formatMoney(c.price, currency)} / бр. на парче`}>
                    <NumInput
                      value={p.cutouts?.[k] ?? 0}
                      integer
                      min={0}
                      onChange={(n) => set({ cutouts: { ...(p.cutouts ?? {}), [k]: n ?? 0 } })}
                    />
                  </Field>
                ))}
              </div>
            ) : (
              !readOnly && (
                <button className="text-sm font-semibold text-darkGold hover:underline" onClick={() => setShowCutouts(true)}>
                  + Отвори (мивка, котлон, смесител…)
                </button>
              )
            )}
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-gray-600">Допълнителни доплащания</span>
            {(p.extras ?? []).map((x, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder="напр. полиране на видима повърхност"
                  value={x.label}
                  onChange={(e) => set({ extras: (p.extras ?? []).map((y, j) => (j === i ? { ...y, label: e.target.value } : y)) })}
                  aria-label="Описание на доплащането"
                />
                <NumInput
                  className={`${inputClass} w-32`}
                  value={x.amount}
                  placeholder="€"
                  onChange={(n) => set({ extras: (p.extras ?? []).map((y, j) => (j === i ? { ...y, amount: n ?? 0 } : y)) })}
                  aria-label="Сума на доплащането"
                />
                {!readOnly && (
                  <button
                    className={iconBtn}
                    onClick={() => set({ extras: (p.extras ?? []).filter((_, j) => j !== i) })}
                    aria-label="Премахни доплащането"
                  >
                    ✖
                  </button>
                )}
              </div>
            ))}
            {!readOnly && (
              <button
                className="text-sm font-semibold text-darkGold hover:underline"
                onClick={() => set({ extras: [...(p.extras ?? []), { label: "", amount: 0 }] })}
              >
                + Доплащане
              </button>
            )}
          </div>

          <Field label="Бележки към позицията">
            <textarea className={inputClass} rows={2} value={p.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} maxLength={1000} />
          </Field>

          {quote && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <span>Нето площ: {formatNum(quote.netAreaM2, 3)} м²</span>
              <span>За плащане: {formatNum(quote.billableAreaM2, 3)} м²</span>
              <span>Обработен ръб: {formatNum(quote.edgeM, 2)} м</span>
              {quote.warnings.map((w) => (
                <span key={w} className="text-amber-700">
                  ⚠ {w}
                </span>
              ))}
            </div>
          )}
        </fieldset>
      )}
    </section>
  );
}

function Cm({ children }: { children: ReactNode }) {
  return (
    <div className="relative [&_input]:pr-10">
      {children}
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">см</span>
    </div>
  );
}
