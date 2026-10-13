"use client";

import { formatNum } from "@/lib/orders/pricing";
import type { ReactNode } from "react";
import type { OptimizeResult, UnplacedReason } from "@/lib/cutlist/types";

const M2 = 1_000_000;

export const UNPLACED_REASON_LABEL: Record<UnplacedReason, string> = {
  "exceeds-slab": "По-голям от плочата",
  grain: "Не позволява текстурата",
  "search-exhausted": "Няма намерено място в лимита на търсене",
  invalid: "Невалидни размери",
};

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-1.5 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold text-obsidian">{value}</span>
    </div>
  );
}

export default function CutlistReport({ result, labelOf }: { result: OptimizeResult; labelOf?: (orderId: string) => string }) {
  const slab = result.slabSpec;
  const complete = result.unplacedCount === 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-darkGold">Обобщение</h3>
          <Metric label="Материал" value={result.materialName ?? result.materialId} />
          <Metric label="Размери на плочата" value={`${slab.lengthMm} × ${slab.widthMm} мм (${slab.lengthMm / 10} × ${slab.widthMm / 10} см)`} />
          <Metric label="Текстура" value={slab.grainAxis === "width" ? "по ширина" : "по дължина"} />
          <Metric label="Прорез (kerf)" value={`${result.kerfMm} мм`} />
          <Metric label="Необходими плочи" value={formatNum(result.slabsUsed, 0)} />
          <Metric label="Общо детайли" value={formatNum(result.totalPieces, 0)} />
          <Metric label="Поставени" value={formatNum(result.placedPieces, 0)} />
          <Metric
            label="Непоставени"
            value={
              complete ? (
                "0"
              ) : (
                <span className="text-red-600">{formatNum(result.unplacedCount, 0)}</span>
              )
            }
          />
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-darkGold">Площи</h3>
          <Metric label="Обща площ на плочите" value={`${formatNum(result.totalSlabAreaMm2 / M2, 2)} м²`} />
          <Metric label="Използвана площ" value={`${formatNum(result.usedAreaMm2 / M2, 2)} м²`} />
          <Metric label="Използваемост" value={`${formatNum(result.totalUtilizationPercent, 1)} %`} />
          <Metric label="Отпадък" value={`${formatNum(result.wasteAreaMm2 / M2, 2)} м²`} />
          <Metric label="Повторно използваем остатък" value={`${formatNum(result.reusableOffcutAreaMm2 / M2, 2)} м²`} />
          <Metric
            label={result.cutMetricsEstimated ? "Разрези (оценка)" : "Разрези"}
            value={formatNum(result.totalCutCount, 0)}
          />
          <Metric
            label={result.cutMetricsEstimated ? "Дължина на разрезите (оценка)" : "Дължина на разрезите"}
            value={`${formatNum(result.totalCutLengthMm / 1000, 2)} м`}
          />
          <Metric label="Загуба от разрез (оценка)" value={`${formatNum(result.kerfLossAreaMm2 / M2, 2)} м²`} />
          <p className="mt-2 text-xs text-gray-400">
            Стратегия: {result.strategy} · оценени варианти: {result.candidatesEvaluated} · семе: {result.seed} ·{" "}
            {formatNum(result.durationMs, 0)} мс
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-darkGold">По плочи</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="py-2 pr-4">Плоча</th>
                <th className="py-2 pr-4 text-center">Детайли</th>
                <th className="py-2 pr-4 text-center">Разрези</th>
                <th className="py-2 pr-4 text-right">Дължина (м)</th>
                <th className="py-2 pr-4 text-right">Използвана площ</th>
                <th className="py-2 pr-4 text-right">Използваемост</th>
                <th className="py-2 text-right">Остатък (използваем)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.slabs.map((s) => (
                <tr key={s.slabIndex}>
                  <td className="py-2 pr-4 font-semibold text-obsidian">Плоча {s.slabIndex}</td>
                  <td className="py-2 pr-4 text-center">{s.placements.length}</td>
                  <td className="py-2 pr-4 text-center">{s.cutCount}</td>
                  <td className="py-2 pr-4 text-right">{formatNum(s.cutLengthMm / 1000, 2)}</td>
                  <td className="py-2 pr-4 text-right">{formatNum(s.usedAreaMm2 / M2, 2)} м²</td>
                  <td className="py-2 pr-4 text-right">{formatNum(s.utilizationPercent, 1)} %</td>
                  <td className="py-2 text-right">{formatNum(s.reusableOffcutAreaMm2 / M2, 2)} м²</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {result.slabs.some((s) => s.offcuts.length > 0) && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-darkGold">Остатъци (неизползвани площи)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Плоча</th>
                  <th className="py-2 pr-4 text-center">Размери (мм)</th>
                  <th className="py-2 pr-4 text-center">Позиция X, Y (мм)</th>
                  <th className="py-2 text-right">Площ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.slabs.flatMap((s) =>
                  s.offcuts.map((o, i) => (
                    <tr key={`${s.slabIndex}-${i}`}>
                      <td className="py-2 pr-4 text-gray-600">Плоча {s.slabIndex}</td>
                      <td className="py-2 pr-4 text-center">
                        {o.lengthMm} × {o.widthMm}
                      </td>
                      <td className="py-2 pr-4 text-center">
                        {o.xMm}, {o.yMm}
                      </td>
                      <td className="py-2 text-right">{formatNum((o.lengthMm * o.widthMm) / M2, 2)} м²</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result.unplacedPieces.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-red-700">Непоставени детайли</h3>
          <p className="mb-3 text-xs text-red-700">
            Оптимизацията не е пълна. Тези детайли не са разположени и изискват ръчна проверка.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-red-700">
                <tr>
                  <th className="py-2 pr-4">Поръчка</th>
                  <th className="py-2 pr-4">Детайл</th>
                  <th className="py-2 pr-4 text-center">Размери (мм)</th>
                  <th className="py-2 pr-4 text-center">Брой</th>
                  <th className="py-2">Причина</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {result.unplacedPieces.map((u) => (
                  <tr key={u.pieceId}>
                    <td className="py-2 pr-4">{labelOf?.(u.orderId) ?? u.orderId}</td>
                    <td className="py-2 pr-4">{u.label ?? u.pieceId}</td>
                    <td className="py-2 pr-4 text-center">
                      {u.lengthMm} × {u.widthMm}
                    </td>
                    <td className="py-2 pr-4 text-center">{u.quantity}</td>
                    <td className="py-2">
                      {UNPLACED_REASON_LABEL[u.reason]}
                      {u.detail ? <span className="block text-xs text-red-600">{u.detail}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
