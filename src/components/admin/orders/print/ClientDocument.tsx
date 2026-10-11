import type { Order } from "@/lib/orders/ordersData";
import { formatMoney, formatNum, type OrderQuote } from "@/lib/orders/pricing";
import {
  SIDE_LEGEND,
  contractTerms,
  dimensions,
  docNumber,
  formatLongDate,
  includedWork,
  isOffer,
  positionSpecs,
  productLabel,
  type DocumentSettings,
} from "@/lib/orders/documents";

type Props = { order: Order; quote: OrderQuote; settings: DocumentSettings; materialImage?: string };

const Check = () => (
  <span className="mt-[3px] inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border border-royalGold text-[7px] text-darkGold">
    ✓
  </span>
);

// Client-facing offer / order contract. Shows billable area only (waste included), never net area or unit costs.
export default function ClientDocument({ order, quote, settings, materialImage }: Props) {
  const { company } = settings;
  const terms = contractTerms(settings, isOffer(order.status));
  const money = (n: number) => formatMoney(n, quote.currency);
  const offer = isOffer(order.status);
  const issued = order.updatedAt || order.createdAt;
  const validUntil = issued + settings.offerValidityDays * 86400000;
  const advance = Math.round(quote.gross * settings.advancePct) / 100;
  const quotes = new Map(quote.positions.map((q) => [q.positionId, q]));
  const totalArea = quote.positions.reduce((a, q) => a + q.billableAreaM2, 0);
  const included = [...includedWork(order, quote.positions), ...quote.serviceLines.map((l) => l.label)];

  return (
    <article className="text-[10.5pt] leading-snug text-neutral-800">
      {/* Header */}
      <header className="flex items-start justify-between gap-6 border-b-2 border-royalGold pb-5">
        <div>
          <img src="/assets/images/logo-official-v2.svg" alt={company.name} className="h-16 w-auto" />
          <p className="mt-2 text-[8.5pt] uppercase tracking-[0.25em] text-neutral-500">{company.tagline}</p>
        </div>
        <div className="text-right">
          <p className="text-[8.5pt] font-semibold uppercase tracking-[0.3em] text-darkGold">{offer ? "Оферта" : "Договор-поръчка"}</p>
          <p className="text-3xl font-light tracking-wide text-obsidian">№ {docNumber(order.number)}</p>
          <p className="mt-2 text-[9pt] text-neutral-600">
            Дата: <span className="font-medium text-neutral-800">{formatLongDate(issued)}</span>
          </p>
          {offer && (
            <p className="text-[9pt] text-neutral-600">
              Валидна до: <span className="font-medium text-neutral-800">{formatLongDate(validUntil)}</span>
            </p>
          )}
        </div>
      </header>

      {/* Parties & material */}
      <section className="avoid-break mt-6 grid grid-cols-2 gap-5">
        <div className="rounded-lg bg-neutral-50 p-4">
          <h2 className="doc-label">Възложител</h2>
          <p className="mt-1 text-[12pt] font-semibold text-obsidian">{order.client.name}</p>
          <p>{order.client.phone}</p>
          {order.client.email && <p>{order.client.email}</p>}
          {order.client.address && <p className="mt-1 text-neutral-600">Обект: {order.client.address}</p>}
        </div>
        <div className="flex gap-4 rounded-lg bg-neutral-50 p-4">
          {materialImage && <img src={materialImage} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />}
          <div className="min-w-0">
            <h2 className="doc-label">Материал</h2>
            <p className="mt-1 text-[12pt] font-semibold text-obsidian">{order.material.label || "—"}</p>
            <p className="text-neutral-600">{order.pricing.stones[order.stoneKey]?.label ?? ""} · естествен камък</p>
          </div>
        </div>
      </section>

      {/* Ready date */}
      <section className="avoid-break mt-5 flex items-center justify-between gap-6 rounded-lg border border-royalGold/60 px-5 py-3">
        <div>
          <p className="doc-label">Срок на изпълнение</p>
          <p className="text-[12pt] font-semibold text-obsidian">
            {order.dueDate ? `Готовност до ${formatLongDate(order.dueDate)}` : "По договаряне след окончателно замерване"}
          </p>
        </div>
        <p className="max-w-[45%] text-right text-[8.5pt] text-neutral-500">Срокът тече от окончателното замерване и получаването на аванса.</p>
      </section>

      {/* Positions */}
      <section className="mt-6">
        <h2 className="doc-title">Изделия</h2>
        <table className="mt-2 w-full border-collapse text-[9.5pt]">
          <thead>
            <tr className="border-b border-neutral-300 text-left text-[8pt] uppercase tracking-wider text-neutral-500">
              <th className="w-7 py-2 font-medium">№</th>
              <th className="py-2 font-medium">Изделие и обработка</th>
              <th className="py-2 text-right font-medium">Размери</th>
              <th className="py-2 pl-3 text-right font-medium">Бр.</th>
              <th className="py-2 pl-3 text-right font-medium">Площ</th>
              <th className="py-2 pl-3 text-right font-medium">Сума</th>
            </tr>
          </thead>
          <tbody>
            {order.positions.map((p, i) => {
              const q = quotes.get(p.id);
              const specs = positionSpecs(p, order.pricing);
              return (
                <tr key={p.id} className="avoid-break border-b border-neutral-200 align-top">
                  <td className="py-2.5 text-neutral-500">{i + 1}</td>
                  <td className="py-2.5 pr-3">
                    <p className="font-semibold text-obsidian">
                      {productLabel(p.type)}
                      {p.label ? ` – ${p.label}` : ""}
                    </p>
                    {specs.length > 0 ? (
                      <ul className="mt-0.5 space-y-0.5 text-[8.5pt] text-neutral-600">
                        {specs.map((s) => (
                          <li key={s}>· {s}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[8.5pt] text-neutral-500">Рязане по размер</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-right">{dimensions(p)}</td>
                  <td className="py-2.5 pl-3 text-right">{p.qty}</td>
                  <td className="whitespace-nowrap py-2.5 pl-3 text-right">{formatNum(q?.billableAreaM2 ?? 0, 3)} м²</td>
                  <td className="whitespace-nowrap py-2.5 pl-3 text-right font-semibold text-obsidian">{money(q?.total ?? 0)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="text-[9pt] text-neutral-600">
              <td />
              <td className="pt-2" colSpan={3}>
                Обща площ за разкрой
              </td>
              <td className="whitespace-nowrap pt-2 pl-3 text-right">{formatNum(totalArea, 3)} м²</td>
              <td className="whitespace-nowrap pt-2 pl-3 text-right font-semibold text-obsidian">{money(quote.positionsTotal)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-2 text-[7.5pt] text-neutral-400">{SIDE_LEGEND}</p>
      </section>

      {/* Services */}
      {quote.serviceLines.length > 0 && (
        <section className="avoid-break mt-5">
          <h2 className="doc-title">Услуги</h2>
          <table className="mt-2 w-full border-collapse text-[9.5pt]">
            <tbody>
              {quote.serviceLines.map((l) => (
                <tr key={l.key} className="border-b border-neutral-200">
                  <td className="py-2">{l.label}</td>
                  <td className="whitespace-nowrap py-2 text-right text-neutral-600">
                    {formatNum(l.qty)} {l.unit}
                  </td>
                  <td className="w-32 whitespace-nowrap py-2 text-right font-semibold text-obsidian">{money(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Included + totals */}
      <section className="avoid-break mt-6 grid grid-cols-[1fr_17rem] gap-6">
        <div>
          <h2 className="doc-title">Включено в цената</h2>
          <ul className="mt-2 space-y-1.5 text-[9.5pt]">
            {included.map((x) => (
              <li key={x} className="flex gap-2">
                <Check />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="self-start rounded-lg bg-obsidian p-5 text-platinum">
          <dl className="space-y-1.5 text-[9.5pt]">
            <TotalRow label="Изделия" value={money(quote.positionsTotal)} />
            {quote.servicesTotal > 0 && <TotalRow label="Услуги" value={money(quote.servicesTotal)} />}
            {quote.discount > 0 && <TotalRow label={`Отстъпка ${formatNum(quote.discountPct)}%`} value={`− ${money(quote.discount)}`} />}
            {quote.minimumTopUp > 0 && <TotalRow label="До минимална стойност" value={money(quote.minimumTopUp)} />}
            <div className="!my-2 border-t border-white/15" />
            <TotalRow label="Сума без ДДС" value={money(quote.net)} />
            <TotalRow label={`ДДС ${formatNum(quote.vatPct)}%`} value={money(quote.vat)} />
          </dl>
          <div className="mt-3 border-t border-royalGold/50 pt-3">
            <p className="text-[8pt] uppercase tracking-[0.25em] text-royalGold">Обща сума</p>
            <p className="text-2xl font-semibold text-white">{money(quote.gross)}</p>
          </div>
          <p className="mt-3 text-[8.5pt] text-neutral-400">
            Аванс {settings.advancePct}% при потвърждение: <span className="text-platinum">{money(advance)}</span>
          </p>
        </div>
      </section>

      {/* Terms */}
      {terms.length > 0 && (
        <section className="mt-8">
          <h2 className="doc-title">Общи условия</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[8pt] leading-relaxed text-neutral-600 marker:text-darkGold">
            {terms.map((t, i) => (
              <li key={i} className="avoid-break pl-1">
                {t}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Signatures */}
      <section className="avoid-break mt-10 grid grid-cols-2 gap-16 text-[9pt]">
        {[
          ["Изпълнител", company.name],
          ["Възложител", order.client.name],
        ].map(([role, name]) => (
          <div key={role}>
            <div className="h-12 border-b border-neutral-400" />
            <p className="mt-1 font-semibold text-obsidian">{role}</p>
            <p className="text-neutral-500">{name} · подпис</p>
          </div>
        ))}
      </section>

      {/* Contacts */}
      <footer className="avoid-break mt-10 rounded-lg bg-obsidian px-6 py-5 text-platinum">
        <div className="flex items-center justify-between gap-6">
          <img src="/assets/images/logo-official-v2.svg" alt="" className="h-9 w-auto brightness-0 invert" />
          <p className="text-[8pt] uppercase tracking-[0.3em] text-royalGold">Благодарим за доверието</p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-white/10 pt-4 text-[8.5pt]">
          <div>
            <p className="doc-label !text-royalGold">Телефони</p>
            {company.phones.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div>
            <p className="doc-label !text-royalGold">Онлайн</p>
            <p>{company.email}</p>
            <p>{company.website}</p>
          </div>
          <div>
            <p className="doc-label !text-royalGold">Адрес</p>
            <p>{company.address}</p>
          </div>
        </div>
      </footer>
    </article>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-neutral-400">{label}</dt>
      <dd className="whitespace-nowrap">{value}</dd>
    </div>
  );
}
