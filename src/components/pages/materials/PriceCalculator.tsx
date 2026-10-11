"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductType, Side } from "@/lib/orders/pricing";
import type { PublicOptions, PublicPosition, PublicQuoteResult } from "@/lib/orders/publicQuote";

type Row = {
  key: number;
  type: ProductType;
  lengthCm: string;
  depthCm: string;
  thicknessCm: number;
  qty: string;
  edges: Partial<Record<Side, string>>;
  cutouts: Record<string, number>;
  open: boolean;
};

const field =
  "w-full rounded-md border border-gray-700 bg-[#141414] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-royalGold focus:outline-none";
const label = "mb-1 block text-xs uppercase tracking-wider text-gray-400";

const money = (n: number, currency: string) =>
  new Intl.NumberFormat("bg-BG", { style: "currency", currency, minimumFractionDigits: 2 }).format(n);

let rowSeq = 0;
const newRow = (type: ProductType = "windowsill"): Row => ({
  key: ++rowSeq,
  type,
  lengthCm: "",
  depthCm: "",
  thicknessCm: 2,
  qty: "1",
  edges: {},
  cutouts: {},
  open: false,
});

function toPublic(rows: Row[], o: PublicOptions): PublicPosition[] | null {
  const out: PublicPosition[] = [];
  for (const r of rows) {
    const L = Number(r.lengthCm);
    const D = Number(r.depthCm);
    const q = Number(r.qty);
    const lim = o.limits;
    if (!(Number.isInteger(L) && L >= lim.minSizeCm && L <= lim.maxLengthCm)) return null;
    if (!(Number.isInteger(D) && D >= lim.minSizeCm && D <= lim.maxDepthCm)) return null;
    if (!(Number.isInteger(q) && q >= 1 && q <= lim.maxQty)) return null;
    out.push({ type: r.type, lengthCm: L, depthCm: D, thicknessCm: r.thicknessCm, qty: q, edges: r.edges, cutouts: r.cutouts });
  }
  return out;
}

export default function PriceCalculator({ groupId, materialId, materialName }: { groupId: number; materialId: number; materialName: string }) {
  const [options, setOptions] = useState<PublicOptions | null>(null);
  const [rows, setRows] = useState<Row[]>(() => [newRow()]);
  const [services, setServices] = useState<string[]>([]);
  const [result, setResult] = useState<PublicQuoteResult | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "", email: "", note: "", website: "" });
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    let alive = true;
    fetch(`/api/quote/options?groupId=${groupId}&materialId=${materialId}`)
      .then((r) => r.json())
      .then((d) => alive && d?.enabled && setOptions(d.options))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [groupId, materialId]);

  const positions = useMemo(() => (options ? toPublic(rows, options) : null), [rows, options]);
  const payload = useMemo(() => (positions ? { groupId, materialId, positions, services } : null), [positions, services, groupId, materialId]);

  useEffect(() => {
    if (!payload) {
      setResult(null);
      setQuoteError(null);
      return;
    }
    const id = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const d = await r.json();
        if (id !== seq.current) return;
        if (!r.ok) throw new Error(d?.error || "Грешка при изчислението.");
        setResult(d);
        setQuoteError(null);
      } catch (e) {
        if (id !== seq.current) return;
        setResult(null);
        setQuoteError(e instanceof Error ? e.message : "Грешка при изчислението.");
      } finally {
        if (id === seq.current) setLoading(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [payload]);

  const patch = useCallback((key: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r))), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payload) return;
    setSending(true);
    setSendError(null);
    try {
      const r = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote: payload,
          contact: { name: contact.name, phone: contact.phone, email: contact.email, note: contact.note },
          consent,
          website: contact.website,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Неуспешно изпращане.");
      setSent(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Неуспешно изпращане.");
    } finally {
      setSending(false);
    }
  };

  if (!options) return null;
  const lim = options.limits;

  return (
    <div className="space-y-5 rounded-xl border border-gray-800 bg-[#101010] p-5">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-royalGold">Калкулатор</p>
        <p className="text-xs text-gray-500">Изчислете ориентировъчна цена за {materialName}.</p>
      </div>

      {rows.map((r, i) => (
        <div key={r.key} className="space-y-3 rounded-lg border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Елемент {i + 1}</span>
            {rows.length > 1 && (
              <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="text-xs text-gray-500 hover:text-red-400">
                Премахни
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="col-span-2 sm:col-span-1">
              <label className={label}>Вид</label>
              <select className={field} value={r.type} onChange={(e) => patch(r.key, { type: e.target.value as ProductType })}>
                {options.productTypes.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Дължина, см</label>
              <input className={field} inputMode="numeric" placeholder={`до ${lim.maxLengthCm}`} value={r.lengthCm} onChange={(e) => patch(r.key, { lengthCm: e.target.value.replace(/\D/g, "") })} />
            </div>
            <div>
              <label className={label}>Дълбочина, см</label>
              <input className={field} inputMode="numeric" placeholder={`до ${lim.maxDepthCm}`} value={r.depthCm} onChange={(e) => patch(r.key, { depthCm: e.target.value.replace(/\D/g, "") })} />
            </div>
            <div>
              <label className={label}>Дебелина</label>
              <select className={field} value={r.thicknessCm} onChange={(e) => patch(r.key, { thicknessCm: Number(e.target.value) })}>
                {options.thicknesses.map((t) => (
                  <option key={t} value={t}>
                    {t} см
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Брой</label>
              <input className={field} inputMode="numeric" value={r.qty} onChange={(e) => patch(r.key, { qty: e.target.value.replace(/\D/g, "") })} />
            </div>
          </div>

          <button type="button" onClick={() => patch(r.key, { open: !r.open })} className="text-xs text-royalGold hover:underline">
            {r.open ? "Скрий обработка и отвори" : "Обработка на ръбовете и отвори"}
          </button>
          {r.open && (
            <div className="grid gap-3 sm:grid-cols-2">
              {options.sides.map((s) => (
                <div key={s.key}>
                  <label className={label}>{s.label}</label>
                  <select
                    className={field}
                    value={r.edges[s.key] ?? ""}
                    onChange={(e) => patch(r.key, { edges: { ...r.edges, [s.key]: e.target.value || undefined } })}
                  >
                    <option value="">Без обработка</option>
                    {options.profiles.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {options.cutouts.map((c) => (
                <div key={c.key}>
                  <label className={label}>{c.label} (бр. на елемент)</label>
                  <input
                    className={field}
                    inputMode="numeric"
                    value={r.cutouts[c.key] || ""}
                    placeholder="0"
                    onChange={(e) => {
                      const n = Math.min(lim.maxCutoutsPerPiece, Number(e.target.value.replace(/\D/g, "")) || 0);
                      patch(r.key, { cutouts: { ...r.cutouts, [c.key]: n } });
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {rows.length < lim.maxPositions && (
        <button type="button" onClick={() => setRows((rs) => [...rs, newRow(rs[rs.length - 1]?.type)])} className="text-sm text-royalGold hover:underline">
          + Добави елемент
        </button>
      )}

      <div>
        <p className={label}>Услуги</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {options.services.map((s) => (
            <label key={s.key} className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                className="accent-[#C9A13B]"
                checked={services.includes(s.key)}
                onChange={(e) => setServices((cur) => (e.target.checked ? [...cur, s.key] : cur.filter((k) => k !== s.key)))}
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4" aria-live="polite">
        {!positions ? (
          <p className="text-sm text-gray-500">Въведете размери и брой, за да видите цената.</p>
        ) : quoteError ? (
          <p className="text-sm text-red-400">{quoteError}</p>
        ) : result ? (
          <div className={loading ? "opacity-60" : ""}>
            <p className="text-3xl font-semibold text-white">{money(result.gross, result.currency)}</p>
            <p className="text-xs text-gray-400">
              с ДДС, вкл. избраните услуги · {new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 2 }).format(result.areaM2)} м²
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Изчисляване…</p>
        )}
        <p className="mt-2 text-xs italic text-gray-500">{options.disclaimer}</p>
      </div>

      {sent ? (
        <p className="rounded-md bg-emerald-900/40 p-3 text-sm text-emerald-300">Благодарим! Запитването е изпратено – ще се свържем с Вас.</p>
      ) : !showForm ? (
        <button
          type="button"
          disabled={!result || loading}
          onClick={() => setShowForm(true)}
          className="rounded-full bg-royalGold px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-darkGoldHover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Заяви оферта
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>Име *</label>
              <input className={field} required maxLength={lim.nameMax} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
            </div>
            <div>
              <label className={label}>Телефон *</label>
              <input className={field} required type="tel" maxLength={lim.phoneMax} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Имейл</label>
              <input className={field} type="email" maxLength={lim.emailMax} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Бележка</label>
              <textarea className={field} rows={3} maxLength={lim.noteMax} value={contact.note} onChange={(e) => setContact({ ...contact, note: e.target.value })} />
            </div>
          </div>
          {/* Honeypot – hidden from people, filled by bots. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
            value={contact.website}
            onChange={(e) => setContact({ ...contact, website: e.target.value })}
            name="website"
          />
          <label className="flex items-start gap-2 text-xs text-gray-400">
            <input type="checkbox" className="mt-0.5 accent-[#C9A13B]" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
            Съгласен/на съм личните ми данни да бъдат обработени, за да получа оферта.
          </label>
          {sendError && <p className="text-sm text-red-400">{sendError}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={sending || !payload || !consent}
              className="rounded-full bg-royalGold px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-darkGoldHover disabled:opacity-40"
            >
              {sending ? "Изпращане…" : "Изпрати запитване"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-white">
              Отказ
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
