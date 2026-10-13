"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { subscribeDocumentSettings } from "@/lib/orders/ordersData";
import type { DocumentSettings } from "@/lib/orders/documents";
import { subscribeCutlist, type SavedCutlist } from "@/lib/cutlist/store";
import type { SlabResult } from "@/lib/cutlist/types";
import { formatNum } from "@/lib/orders/pricing";
import { ErrorBox, Spinner } from "../../ui";
import { fmtLen, pieceColorMap, pieceKey, readableText } from "@/lib/cutlist/colors";
import { formatDateTime } from "../common";

const M2 = 1_000_000;

const PRINT_CSS = `
@page { size: A4; margin: 12mm; }
.doc-sheet, .doc-sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media print {
  html, body { background: #fff !important; }
  .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  thead { display: table-header-group; }
}
`;

function SlabDiagram({ slab, kerfMm }: { slab: SlabResult; kerfMm: number }) {
  const L = slab.lengthMm;
  const W = slab.widthMm;
  const gap = Math.max(kerfMm, L * 0.0035);
  const inset = gap / 2;
  const stroke = Math.max(2, L * 0.0012);
  const font = L / 64;
  const colors = pieceColorMap(slab.placements, kerfMm);
  const offcutText = readableText("#ecfdf5");
  return (
    <svg
      viewBox={`-${L * 0.06} -${W * 0.06} ${L * 1.12} ${W * 1.12}`}
      className="w-full"
      style={{ maxWidth: "180mm" }}
      role="img"
      aria-label={`Диаграма на плоча ${slab.slabIndex}`}
    >
      {/* Slab body — the kerf color shows through the gaps between pieces. */}
      <rect x={0} y={0} width={L} height={W} fill="#94a3b8" stroke="#111827" strokeWidth={stroke * 1.6} />

      {slab.offcuts.map((o, i) => {
        const big = o.lengthMm > L * 0.05 && o.widthMm > W * 0.05;
        return (
          <g key={`off-${i}`}>
            <rect x={o.xMm} y={o.yMm} width={o.lengthMm} height={o.widthMm} fill="#ecfdf5" stroke="#10b981" strokeWidth={stroke} strokeDasharray={`${font} ${font}`} />
            {big && (
              <text x={o.xMm + o.lengthMm / 2} y={o.yMm + o.widthMm / 2} textAnchor="middle" dominantBaseline="middle" fontSize={font} fill={offcutText}>
                <tspan x={o.xMm + o.lengthMm / 2} dy={-font * 0.2}>
                  остатък
                </tspan>
                <tspan x={o.xMm + o.lengthMm / 2} dy={font * 1.15}>
                  {fmtLen(o.lengthMm)} × {fmtLen(o.widthMm)}
                </tspan>
              </text>
            )}
          </g>
        );
      })}

      {slab.placements.map((p) => {
        const color = colors.get(pieceKey(p)) ?? "#4e79a7";
        const px = p.xMm + inset;
        const py = p.yMm + inset;
        const pw = Math.max(1, p.lengthMm - gap);
        const ph = Math.max(1, p.widthMm - gap);
        return (
          <g key={pieceKey(p)}>
            <rect x={px} y={py} width={pw} height={ph} fill={color} stroke="#1f2937" strokeWidth={stroke * 0.6} />
            <text x={px + pw / 2} y={py + ph / 2} textAnchor="middle" dominantBaseline="middle" fontSize={font} fill={readableText(color)}>
              <tspan x={px + pw / 2} dy={-font * 0.2}>
                {p.rotated ? "↻ " : ""}
                {p.label ?? p.pieceId}
              </tspan>
              <tspan x={px + pw / 2} dy={font * 1.15}>
                {fmtLen(p.lengthMm)} × {fmtLen(p.widthMm)}
              </tspan>
            </text>
          </g>
        );
      })}

      <text x={L / 2} y={-W * 0.02} textAnchor="middle" fontSize={font * 0.9} fill="#374151">
        {fmtLen(L)} мм
      </text>
      <text x={-L * 0.02} y={W / 2} textAnchor="middle" fontSize={font * 0.9} fill="#374151" transform={`rotate(-90 ${-L * 0.02} ${W / 2})`}>
        {fmtLen(W)} мм
      </text>
    </svg>
  );
}

export default function PrintCutlist() {
  const { id } = useParams<{ id: string }>();
  const [cutlist, setCutlist] = useState<SavedCutlist | null | undefined>(undefined);
  const [settings, setSettings] = useState<DocumentSettings>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeCutlist(id, setCutlist, (e) => setError(e.message)), [id]);
  useEffect(() => subscribeDocumentSettings(setSettings, (e) => setError(e.message)), []);

  useEffect(() => {
    if (cutlist) document.title = `Разкрой-${cutlist.materialName}-${cutlist.id.slice(-6)}`;
  }, [cutlist]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <ErrorBox>{error}</ErrorBox>
      </div>
    );
  }
  if (cutlist === undefined || !settings) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }
  if (cutlist === null) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <ErrorBox>Разкроят не е намерен.</ErrorBox>
      </div>
    );
  }

  const r = cutlist.result;
  const slab = r.slabSpec;
  const company = settings.company;

  return (
    <div className="min-h-screen bg-neutral-200 print:bg-white">
      <style>{PRINT_CSS}</style>
      <div className="sticky top-0 z-10 bg-obsidian text-platinum shadow print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin?tab=orders" className="text-sm text-royalGold hover:underline">
            ← Към поръчките
          </Link>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-royalGold px-4 py-1.5 text-sm font-semibold text-obsidian transition hover:bg-darkGold hover:text-white"
          >
            Изтегли PDF
          </button>
        </div>
        <p className="pb-2 text-center text-xs text-neutral-400">
          В прозореца за печат изберете „Запиши като PDF“, размер A4 и включени „Графики на фона“.
        </p>
      </div>

      <div className="px-4 py-8 print:p-0">
        <div className="doc-sheet mx-auto w-[210mm] max-w-full bg-white p-[12mm] shadow-xl print:w-auto print:p-0 print:shadow-none">
          <header className="mb-6 border-b border-gray-300 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-obsidian">{company.name}</p>
                <p className="text-xs text-gray-500">{company.tagline}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {company.address} · {company.phones.join(", ")}
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p className="text-base font-bold uppercase tracking-widest text-obsidian">Разкрой / Кътлист</p>
                <p>№ {cutlist.id.slice(-8).toUpperCase()}</p>
                <p>{formatDateTime(cutlist.createdAt)}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-700 sm:grid-cols-4">
              <p>
                <span className="text-gray-400">Материал: </span>
                {cutlist.materialName} · {cutlist.thicknessMm} мм
              </p>
              <p>
                <span className="text-gray-400">Плоча: </span>
                {slab.lengthMm} × {slab.widthMm} мм
              </p>
              <p>
                <span className="text-gray-400">Прорез: </span>
                {r.kerfMm} мм
              </p>
              <p>
                <span className="text-gray-400">Плочи: </span>
                {r.slabsUsed}
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-700">
              <span className="text-gray-400">Поръчки: </span>
              {cutlist.orders.map((o) => `№ ${String(o.number).padStart(4, "0")} · ${o.clientName}`).join("  |  ")}
            </p>
          </header>

          <section className="avoid-break mb-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-700 sm:grid-cols-3">
              <p>
                <span className="text-gray-400">Общо детайли: </span>
                {r.totalPieces}
              </p>
              <p>
                <span className="text-gray-400">Поставени: </span>
                {r.placedPieces}
              </p>
              <p>
                <span className="text-gray-400">Непоставени: </span>
                <span className={r.unplacedCount > 0 ? "font-semibold text-red-600" : ""}>{r.unplacedCount}</span>
              </p>
              <p>
                <span className="text-gray-400">Използвана площ: </span>
                {formatNum(r.usedAreaMm2 / M2, 2)} м²
              </p>
              <p>
                <span className="text-gray-400">Обща площ: </span>
                {formatNum(r.totalSlabAreaMm2 / M2, 2)} м²
              </p>
              <p>
                <span className="text-gray-400">Използваемост: </span>
                <span className="font-semibold">{formatNum(r.totalUtilizationPercent, 1)} %</span>
              </p>
              <p>
                <span className="text-gray-400">Разрези: </span>
                {r.totalCutCount}
                {r.cutMetricsEstimated ? " (оценка)" : ""}
              </p>
              <p>
                <span className="text-gray-400">Дължина на разрезите: </span>
                {formatNum(r.totalCutLengthMm / 1000, 2)} м
              </p>
              <p>
                <span className="text-gray-400">Отпадък: </span>
                {formatNum(r.wasteAreaMm2 / M2, 2)} м²
              </p>
            </div>
          </section>

          {r.slabs.map((s) => {
            const slabColors = pieceColorMap(s.placements, r.kerfMm);
            return (
            <section key={s.slabIndex} className="avoid-break mb-8 border-t border-gray-200 pt-4">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-obsidian">Плоча {s.slabIndex}</h2>
                <span className="text-xs text-gray-500">
                  {s.placements.length} детайла · {s.cutCount} разреза ({formatNum(s.cutLengthMm / 1000, 2)} м) · използваемост{" "}
                  {formatNum(s.utilizationPercent, 1)} % · използван {formatNum(s.usedAreaMm2 / M2, 2)} м²
                </span>
              </div>
              <SlabDiagram slab={s} kerfMm={r.kerfMm} />
              <table className="mt-3 w-full text-xs">
                <thead className="text-left uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="py-1 pr-3">#</th>
                    <th className="py-1 pr-3">Детайл</th>
                    <th className="py-1 pr-3">Поръчка</th>
                    <th className="py-1 pr-3 text-center">Д×Ш (мм)</th>
                    <th className="py-1 pr-3 text-center">X, Y</th>
                    <th className="py-1 pr-3 text-center">Ориентация</th>
                    <th className="py-1 text-center">Текстура</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {s.placements.map((p, i) => {
                    const order = cutlist.orders.find((o) => o.id === p.orderId);
                    return (
                      <tr key={`${p.pieceId}-${p.instanceIndex}`}>
                        <td className="py-1 pr-3 text-gray-400">{i + 1}</td>
                        <td className="py-1 pr-3">
                          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ backgroundColor: slabColors.get(pieceKey(p)) }} />
                          {p.label ?? p.pieceId}
                        </td>
                        <td className="py-1 pr-3">№ {String(order?.number ?? p.orderNumber ?? 0).padStart(4, "0")}</td>
                        <td className="py-1 pr-3 text-center">
                          {fmtLen(p.lengthMm)} × {fmtLen(p.widthMm)}
                        </td>
                        <td className="py-1 pr-3 text-center">
                          {p.xMm}, {p.yMm}
                        </td>
                        <td className="py-1 pr-3 text-center">{p.rotated ? "завъртян 90°" : "по естествена"}</td>
                        <td className="py-1 text-center">{p.grainRequired ? "запазена" : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
            );
          })}

          {r.slabs.some((s) => s.offcuts.length > 0) && (
            <section className="avoid-break mb-6 border-t border-gray-200 pt-4">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-obsidian">Остатъци (неизползвани площи)</h2>
              <table className="w-full text-xs">
                <thead className="text-left uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="py-1 pr-3">Плоча</th>
                    <th className="py-1 pr-3 text-center">Размери (мм)</th>
                    <th className="py-1 pr-3 text-center">Позиция X, Y (мм)</th>
                    <th className="py-1 text-right">Площ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {r.slabs.flatMap((s) =>
                    s.offcuts.map((o, i) => (
                      <tr key={`${s.slabIndex}-${i}`}>
                        <td className="py-1 pr-3 text-gray-500">Плоча {s.slabIndex}</td>
                        <td className="py-1 pr-3 text-center">
                          {o.lengthMm} × {o.widthMm}
                        </td>
                        <td className="py-1 pr-3 text-center">
                          {o.xMm}, {o.yMm}
                        </td>
                        <td className="py-1 text-right">{formatNum((o.lengthMm * o.widthMm) / M2, 2)} м²</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          )}

          {r.unplacedPieces.length > 0 && (
            <section className="avoid-break rounded border border-red-300 p-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-red-700">Внимание: непоставени детайли</h2>
              <table className="mt-2 w-full text-xs">
                <thead className="text-left uppercase tracking-wider text-red-700">
                  <tr>
                    <th className="py-1 pr-3">Поръчка</th>
                    <th className="py-1 pr-3">Детайл</th>
                    <th className="py-1 pr-3 text-center">Размери (мм)</th>
                    <th className="py-1 pr-3 text-center">Брой</th>
                    <th className="py-1">Причина</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {r.unplacedPieces.map((u) => (
                    <tr key={u.pieceId}>
                      <td className="py-1 pr-3">№ {String(u.orderNumber ?? 0).padStart(4, "0")}</td>
                      <td className="py-1 pr-3">{u.label ?? u.pieceId}</td>
                      <td className="py-1 pr-3 text-center">
                        {u.lengthMm} × {u.widthMm}
                      </td>
                      <td className="py-1 pr-3 text-center">{u.quantity}</td>
                      <td className="py-1">
                        {u.reason}
                        {u.detail ? ` · ${u.detail}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <footer className="mt-8 border-t border-gray-200 pt-3 text-xs text-gray-400">
            Разкроят е изчислен с детерминистичен геометричен алгоритъм ({r.strategy} · {r.candidatesEvaluated} варианта). Стойностите са
            ориентировъчни за производство.
          </footer>
        </div>
      </div>
    </div>
  );
}
