import type { ReactNode } from "react";
import { statusInfo, type Order } from "@/lib/orders/ordersData";
import { formatMoney, formatNum, thicknessFactor, type OrderQuote } from "@/lib/orders/pricing";
import { SIDE_LEGEND, dimensions, docNumber, formatLongDate, positionSpecs, productLabel, type DocumentSettings } from "@/lib/orders/documents";
import { formatDateTime } from "../common";

type Props = { order: Order; quote: OrderQuote; settings: DocumentSettings; generatedBy?: string };

const kb = (n: number) => (n >= 1048576 ? `${formatNum(n / 1048576, 1)} MB` : `${formatNum(n / 1024, 0)} KB`);

// Internal traceability sheet: every input, every price line, the pricing snapshot and the full history.
export default function InternalDocument({ order, quote, settings, generatedBy }: Props) {
  const { company } = settings;
  const money = (n: number) => formatMoney(n, quote.currency);
  const quotes = new Map(quote.positions.map((q) => [q.positionId, q]));
  const stone = order.pricing.stones[order.stoneKey];
  const billable = quote.positions.reduce((a, q) => a + q.billableAreaM2, 0);
  const edgeM = quote.positions.reduce((a, q) => a + q.edgeM, 0);
  const posNo = new Map(order.positions.map((p, i) => [p.id, i + 1]));
  const drift = Math.abs((order.totals?.gross ?? quote.gross) - quote.gross) > 0.01;
  const warnings = quote.positions.flatMap((q) => q.warnings.map((w) => `Поз. ${posNo.get(q.positionId)}: ${w}`));

  return (
    <article className="text-[9pt] leading-snug text-neutral-800">
      <header className="flex items-start justify-between gap-6 border-b-2 border-obsidian pb-3">
        <div className="flex items-center gap-4">
          <img src="/assets/images/logo-official-v2.svg" alt={company.name} className="h-10 w-auto" />
          <div>
            <p className="text-[8pt] font-semibold uppercase tracking-[0.25em] text-red-700">Вътрешен документ – не се предоставя на клиента</p>
            <p className="text-[14pt] font-semibold text-obsidian">Поръчка № {docNumber(order.number)} – проследимост</p>
          </div>
        </div>
        <div className="text-right text-[8pt] text-neutral-600">
          <p>Генериран: {formatDateTime(Date.now())}</p>
          {generatedBy && <p>От: {generatedBy}</p>}
          <p className="font-mono text-[7pt] text-neutral-400">ID {order.id}</p>
        </div>
      </header>

      {(drift || warnings.length > 0) && (
        <div className="mt-3 rounded border border-amber-400 bg-amber-50 p-2 text-[8pt] text-amber-900">
          {drift && (
            <p>
              Записаната сума ({money(order.totals.gross)}) се различава от преизчислената ({money(quote.gross)}) – проверете поръчката.
            </p>
          )}
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      <section className="avoid-break mt-4 grid grid-cols-3 gap-3">
        <Box title="Поръчка">
          <KV k="Статус" v={statusInfo(order.status).label} />
          <KV k="Създадена" v={formatDateTime(order.createdAt)} />
          <KV k="Обновена" v={formatDateTime(order.updatedAt)} />
          {order.closedAt && <KV k="Приключена" v={formatDateTime(order.closedAt)} />}
          <KV k="Готовност" v={order.dueDate ? formatLongDate(order.dueDate) : "—"} />
        </Box>
        <Box title="Клиент">
          <KV k="Име" v={order.client.name} />
          <KV k="Телефон" v={order.client.phone} />
          <KV k="Имейл" v={order.client.email || "—"} />
          <KV k="Адрес" v={order.client.address || "—"} />
        </Box>
        <Box title="Материал">
          <KV k="Материал" v={order.material.label || "—"} />
          <KV k="Вид / ценова група" v={`${stone?.label ?? "—"} (${order.stoneKey})`} />
          <KV k="Каталог" v={`${order.material.groupKey ?? "—"} / #${order.material.materialId ?? "—"}`} />
          <KV
            k="Цена м² (2 см)"
            v={order.materialPriceM2 ? `${money(order.materialPriceM2)} (ръчна)` : money(stone?.materialM2 ?? 0)}
          />
        </Box>
      </section>

      <section className="mt-4">
        <h2 className="doc-title">Позиции и калкулация</h2>
        {order.positions.map((p, i) => {
          const q = quotes.get(p.id);
          const specs = positionSpecs(p, order.pricing);
          const att = order.attachments.filter((a) => a.positionId === p.id);
          return (
            <div key={p.id} className="avoid-break mt-2 rounded border border-neutral-300">
              <div className="flex flex-wrap items-baseline justify-between gap-2 bg-neutral-100 px-3 py-1.5">
                <p className="font-semibold text-obsidian">
                  {i + 1}. {productLabel(p.type)}
                  {p.label ? ` – ${p.label}` : ""} · {dimensions(p)} · {p.qty} бр.
                </p>
                <p className="text-[8pt] text-neutral-600">
                  Нето {formatNum(q?.netAreaM2 ?? 0, 3)} м² · Фактурна {formatNum(q?.billableAreaM2 ?? 0, 3)} м² · Фира{" "}
                  {order.pricing.wastePct[p.type] ?? 0}% · Чела {formatNum(q?.edgeM ?? 0, 2)} м · K дебелина{" "}
                  {thicknessFactor(order.pricing, p.thicknessCm)}
                </p>
              </div>
              <div className="px-3 py-1.5">
                {specs.length > 0 && <p className="text-[8pt] text-neutral-600">{specs.join(" · ")}</p>}
                {p.buildUpCm != null && <p className="text-[8pt] text-neutral-600">Подлепка: {p.buildUpCm} см</p>}
                {p.notes && <p className="text-[8pt] italic text-neutral-700">Бележка: {p.notes}</p>}
                {att.length > 0 && <p className="text-[8pt] text-neutral-600">Файлове: {att.map((a) => a.name).join(", ")}</p>}
                <LinesTable lines={q?.lines ?? []} money={money} total={q?.total ?? 0} />
              </div>
            </div>
          );
        })}
        <p className="mt-1 text-[7pt] text-neutral-400">{SIDE_LEGEND}</p>
      </section>

      {quote.serviceLines.length > 0 && (
        <section className="avoid-break mt-4">
          <h2 className="doc-title">Услуги</h2>
          <LinesTable lines={quote.serviceLines} money={money} total={quote.servicesTotal} />
        </section>
      )}

      <section className="avoid-break mt-4 grid grid-cols-2 gap-4">
        <Box title="Обобщение">
          <KV k="Нетна площ (готови изделия)" v={`${formatNum(quote.netAreaM2, 3)} м²`} />
          <KV k="Фактурна площ (с фира)" v={`${formatNum(billable, 3)} м²`} />
          <KV k="Отпадък" v={`${formatNum(billable - quote.netAreaM2, 3)} м²`} />
          <KV k="Обработени чела" v={`${formatNum(edgeM, 2)} м`} />
        </Box>
        <Box title="Суми">
          <KV k="Позиции" v={money(quote.positionsTotal)} />
          <KV k="Услуги" v={money(quote.servicesTotal)} />
          <KV k="Междинна сума" v={money(quote.subtotal)} />
          <KV k={`Отстъпка ${formatNum(quote.discountPct)}%`} v={`− ${money(quote.discount)}`} />
          <KV k="Доплащане до минимум" v={money(quote.minimumTopUp)} />
          <KV k="Без ДДС" v={money(quote.net)} />
          <KV k={`ДДС ${formatNum(quote.vatPct)}%`} v={money(quote.vat)} />
          <KV k="Общо с ДДС" v={<strong>{money(quote.gross)}</strong>} />
        </Box>
      </section>

      <section className="avoid-break mt-4">
        <h2 className="doc-title">Ценоразпис към момента на поръчката</h2>
        <div className="mt-1 grid grid-cols-2 gap-x-6 text-[8pt]">
          <KV k="Валута / ДДС" v={`${order.pricing.currency} / ${order.pricing.vatPct}%`} />
          <KV k="Минимална поръчка (без ДДС)" v={money(order.pricing.minOrderNet)} />
          <KV k="Мин. площ на брой" v={`${order.pricing.minPieceAreaM2} м²`} />
          <KV k="Множител подлепка" v={`×${order.pricing.buildUpMultiplier} (по подр. ${order.pricing.defaultBuildUpCm} см)`} />
          <KV k="Фира" v={Object.entries(order.pricing.wastePct).map(([k, v]) => `${productLabel(k as never)} ${v}%`).join(", ")} />
          <KV k="Коеф. дебелина" v={Object.entries(order.pricing.thicknessFactors).map(([k, v]) => `${k} см ×${v}`).join(", ")} />
          <KV k="Рязане" v={`${money(stone?.cuttingM ?? 0)}/м`} />
          <KV k="Водооткапващ канал" v={`${money(order.pricing.dripGrooveM)}/м`} />
          <KV k="Импрегниране" v={`${money(stone?.sealM2 ?? 0)}/м² · чело ${money(stone?.sealEdgeM ?? 0)}/м`} />
          {order.pricing.updatedAt && <KV k="Ценоразпис от" v={formatDateTime(order.pricing.updatedAt)} />}
        </div>
      </section>

      <section className="avoid-break mt-4 grid grid-cols-2 gap-4">
        <div>
          <h2 className="doc-title">История на статусите</h2>
          <table className="mt-1 w-full text-[8pt]">
            <tbody>
              {order.statusLog.map((s) => (
                <tr key={`${s.status}-${s.at}`} className="border-b border-neutral-200">
                  <td className="py-1">{formatDateTime(s.at)}</td>
                  <td className="py-1 font-medium">{statusInfo(s.status).label}</td>
                  <td className="py-1 text-right text-neutral-500">{s.by ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="doc-title">Прикачени файлове ({order.attachments.length})</h2>
          {order.attachments.length === 0 ? (
            <p className="mt-1 text-[8pt] text-neutral-500">Няма.</p>
          ) : (
            <table className="mt-1 w-full text-[8pt]">
              <tbody>
                {order.attachments.map((a) => (
                  <tr key={a.id} className="border-b border-neutral-200 align-top">
                    <td className="break-all py-1 pr-2">
                      <a href={a.url} className="text-darkGold underline">
                        {a.name}
                      </a>
                    </td>
                    <td className="whitespace-nowrap py-1 pr-2 text-neutral-500">{kb(a.size)}</td>
                    <td className="whitespace-nowrap py-1 pr-2">{a.positionId ? `Поз. ${posNo.get(a.positionId) ?? "?"}` : "Общ"}</td>
                    <td className="whitespace-nowrap py-1 text-right text-neutral-500">{formatDateTime(a.uploadedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {order.notes && (
        <section className="avoid-break mt-4">
          <h2 className="doc-title">Бележки</h2>
          <p className="mt-1 whitespace-pre-wrap text-[8.5pt]">{order.notes}</p>
        </section>
      )}

      <footer className="mt-6 border-t border-neutral-300 pt-2 text-[7pt] text-neutral-400">
        {company.name} · {company.address} · {company.phones.join(" · ")} — вътрешен документ, поръчка {order.id}
      </footer>
    </article>
  );
}

function LinesTable({ lines, money, total }: { lines: OrderQuote["serviceLines"]; money: (n: number) => string; total: number }) {
  return (
    <table className="mt-1 w-full border-collapse text-[8pt]">
      <thead>
        <tr className="border-b border-neutral-300 text-left text-[7pt] uppercase tracking-wider text-neutral-500">
          <th className="py-1 font-medium">Ред</th>
          <th className="py-1 text-right font-medium">Кол.</th>
          <th className="py-1 text-right font-medium">Ед. цена</th>
          <th className="py-1 text-right font-medium">Сума</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l) => (
          <tr key={l.key} className="border-b border-neutral-100">
            <td className="py-0.5 pr-2">{l.label}</td>
            <td className="whitespace-nowrap py-0.5 text-right">
              {formatNum(l.qty, 3)} {l.unit}
            </td>
            <td className="whitespace-nowrap py-0.5 pl-2 text-right">{money(l.unitPrice)}</td>
            <td className="whitespace-nowrap py-0.5 pl-2 text-right">{money(l.amount)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3} className="pt-1 text-right font-semibold">
            Общо
          </td>
          <td className="whitespace-nowrap pt-1 text-right font-semibold">{money(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function Box({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded border border-neutral-300 p-2.5">
      <h3 className="doc-label mb-1">{title}</h3>
      <dl className="space-y-0.5">{children}</dl>
    </div>
  );
}

function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-neutral-500">{k}</dt>
      <dd className="min-w-0 break-words text-right">{v}</dd>
    </div>
  );
}
