"use client";

import { PRODUCT_TYPES, formatMoney, formatNum, type OrderQuote, type Position } from "@/lib/orders/pricing";

type QuoteLine = OrderQuote["serviceLines"][number];

function Line({ line, cur }: { line: QuoteLine; cur: string }) {
  return (
    <li className="px-3 py-1.5">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 break-words text-gray-700">{line.label}</span>
        <span className="whitespace-nowrap text-obsidian">{formatMoney(line.amount, cur)}</span>
      </div>
      <div className="text-xs text-gray-500">
        {formatNum(line.qty, 3)} {line.unit} × {formatMoney(line.unitPrice, cur)}
      </div>
    </li>
  );
}

type Props = { quote: OrderQuote; positions: Position[]; compact?: boolean };

export default function PriceBreakdown({ quote, positions, compact }: Props) {
  const cur = quote.currency;
  const byId = new Map(positions.map((p, i) => [p.id, { p, i }]));

  return (
    <div className="space-y-4 text-sm">
      {!compact &&
        quote.positions.map((pq) => {
          const ref = byId.get(pq.positionId);
          if (!ref) return null;
          const type = PRODUCT_TYPES.find((t) => t.key === ref.p.type)?.label;
          return (
            <div key={pq.positionId} className="rounded-lg border border-gray-100">
              <div className="flex items-start justify-between gap-3 bg-gray-50 px-3 py-2 font-semibold text-obsidian">
                <span>
                  {ref.i + 1}. {type}
                  {ref.p.label ? ` – ${ref.p.label}` : ""}{" "}
                  <span className="font-normal text-gray-500">× {ref.p.qty} бр.</span>
                </span>
                <span className="whitespace-nowrap">{formatMoney(pq.total, cur)}</span>
              </div>
              {pq.lines.length === 0 ? (
                <p className="px-3 py-2 text-gray-400">{pq.warnings[0] ?? "—"}</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {pq.lines.map((l) => (
                    <Line key={l.key} line={l} cur={cur} />

                  ))}
                </ul>
              )}
            </div>
          );
        })}

      {!compact && quote.serviceLines.length > 0 && (
        <div className="rounded-lg border border-gray-100">
          <div className="flex items-start justify-between gap-3 bg-gray-50 px-3 py-2 font-semibold text-obsidian">
            <span>Услуги</span>
            <span className="whitespace-nowrap">{formatMoney(quote.servicesTotal, cur)}</span>
          </div>
          <ul className="divide-y divide-gray-50">
            {quote.serviceLines.map((l) => (
              <Line key={l.key} line={l} cur={cur} />

            ))}
          </ul>
        </div>
      )}

      <dl className="space-y-1 rounded-lg bg-obsidian p-4 text-platinum">
        <Row label={`Позиции (${quote.positions.length}) · ${formatNum(quote.netAreaM2, 3)} м² нето`} value={formatMoney(quote.positionsTotal, cur)} />
        {quote.servicesTotal > 0 && <Row label="Услуги" value={formatMoney(quote.servicesTotal, cur)} />}
        <Row label="Междинна сума" value={formatMoney(quote.subtotal, cur)} />
        {quote.discount > 0 && <Row label={`Отстъпка ${formatNum(quote.discountPct)}%`} value={`− ${formatMoney(quote.discount, cur)}`} />}
        {quote.minimumTopUp > 0 && <Row label="Доплащане до минимална поръчка" value={formatMoney(quote.minimumTopUp, cur)} />}
        <Row label="Сума без ДДС" value={formatMoney(quote.net, cur)} strong />
        <Row label={`ДДС ${formatNum(quote.vatPct)}%`} value={formatMoney(quote.vat, cur)} />
        <div className="mt-2 flex items-baseline justify-between border-t border-white/20 pt-2">
          <dt className="text-sm uppercase tracking-wider text-royalGold">Общо с ДДС</dt>
          <dd className="text-2xl font-bold text-white">{formatMoney(quote.gross, cur)}</dd>
        </div>
      </dl>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? "font-semibold text-white" : ""}`}>
      <dt className="min-w-0">{label}</dt>
      <dd className="whitespace-nowrap">{value}</dd>
    </div>
  );
}
