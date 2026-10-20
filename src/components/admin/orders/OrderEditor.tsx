"use client";

import { useEffect, useMemo, useState } from "react";
import { type GroupEntry } from "@/lib/adminData";
import {
  ORDER_STATUSES,
  changeStatus,
  deleteOrder,
  ensureSections,
  isActiveStatus,
  newId,
  nextStatuses,
  previousStatus,
  quoteFor,
  saveOrder,
  statusInfo,
  subscribeOrder,
  type DocOverrides,
  type MaterialSection,
  type Order,
  type OrderDraft,
  type OrderStatus,
} from "@/lib/orders/ordersData";
import {
  UNIT_LABELS,
  formatMoney,
  formatNum,
  stoneKeyForGroup,
  type OrderService,
  type Position,
  type PricingSettings,
} from "@/lib/orders/pricing";
import { DEFAULT_LEAD_TIME_NOTE, defaultLeadTime, includedList } from "@/lib/orders/documents";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { ErrorBox, Field, Modal, NumInput, Spinner, dangerButton, inputClass, primaryButton, secondaryButton } from "../ui";
import Attachments from "./Attachments";
import PositionEditor from "./PositionEditor";
import PriceBreakdown from "./PriceBreakdown";
import { PricingFields, invalidPricing } from "./PricingSettingsForm";
import { StatusBadge, formatDateTime, orderNo } from "./common";

type Props = {
  orderId: string | null;
  template: OrderDraft | null;
  pricing: PricingSettings;
  groups: GroupEntry[];
  onClose: () => void;
  onSaved: (id: string, msg: string) => void;
  onDuplicate: (draft: OrderDraft) => void;
  onToast: (msg: string) => void;
};

type Errors = {
  client?: Record<string, string>;
  sections?: Record<string, string>;
  positions?: string;
  byPosition: Record<string, Record<string, string>>;
};

const card = "rounded-xl bg-white p-5 shadow-sm";
const sectionTitle = "mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-darkGold";

function blankPosition(sort: number, thicknessCm: number, type: Position["type"] = "windowsill", sectionId?: string): Position {
  return {
    id: newId(),
    sort,
    sectionId,
    type,
    lengthCm: 0,
    depthCm: 0,
    thicknessCm,
    qty: 1,
    edges: {},
    drip: {},
    cutouts: {},
    extras: [],
    impregnated: false,
  };
}

function blankSection(pricing: PricingSettings, sort: number): MaterialSection {
  return { id: newId(), sort, material: { label: "" }, stoneKey: Object.keys(pricing.stones)[0] ?? "", materialPriceM2: null };
}

// Every draft in the editor has explicit sections and every position points to one of them.
function normalizeDraft(d: OrderDraft): OrderDraft {
  const sections = ensureSections(d);
  const ids = new Set(sections.map((s) => s.id));
  return {
    ...d,
    sections,
    positions: d.positions.map((p) => (p.sectionId && ids.has(p.sectionId) ? p : { ...p, sectionId: sections[0].id })),
  };
}

// Drops bookkeeping fields so an order snapshot can be compared with the global price list.
const priceSignature = ({ updatedAt: _u, customizedAt: _c, ...rest }: PricingSettings) => JSON.stringify(rest);

function blankDraft(pricing: PricingSettings): OrderDraft {
  const section = blankSection(pricing, 0);
  return {
    status: "quoted",
    client: { name: "", phone: "", email: "", address: "" },
    material: section.material,
    stoneKey: section.stoneKey,
    materialPriceM2: null,
    sections: [section],
    positions: [blankPosition(0, 2, "windowsill", section.id)],
    services: [],
    discountPct: 0,
    notes: "",
    dueDate: "",
    sealChoice: "with",
    pricing,
  };
}

function draftFrom(o: Order): OrderDraft {
  return normalizeDraft({
    id: o.id,
    number: o.number,
    createdAt: o.createdAt,
    status: o.status,
    client: { email: "", address: "", ...o.client },
    material: o.material,
    stoneKey: o.stoneKey,
    materialPriceM2: o.materialPriceM2 ?? null,
    sections: o.sections,
    positions: o.positions,
    services: o.services,
    discountPct: o.discountPct,
    notes: o.notes ?? "",
    dueDate: o.dueDate ?? "",
    doc: o.doc,
    pricing: o.pricing,
    sealChoice: o.sealChoice ?? "with",
    closedAt: o.closedAt,
  });
}

// Copy as a fresh quote at today's prices: new ids everywhere, no attachments/history.
export function duplicateDraft(o: Order | OrderDraft, pricing: PricingSettings): OrderDraft {
  const src = ensureSections(o);
  const idMap = new Map(src.map((s) => [s.id, newId()]));
  const sections = src.map((s, i) => ({ ...structuredClone(s), id: idMap.get(s.id)!, sort: i }));
  return {
    status: "quoted",
    client: { ...o.client },
    material: { ...sections[0].material },
    stoneKey: sections[0].stoneKey,
    materialPriceM2: sections[0].materialPriceM2 ?? null,
    sections,
    positions: o.positions.map((p, i) => ({
      ...structuredClone(p),
      id: newId(),
      sort: i,
      sectionId: idMap.get(p.sectionId ?? "") ?? sections[0].id,
    })),
    services: o.services.map((s) => ({ ...s, id: newId(), unitPrice: pricing.services[s.key]?.price ?? s.unitPrice })),
    discountPct: o.discountPct,
    notes: o.notes ?? "",
    dueDate: "",
    sealChoice: o.sealChoice ?? "with",
    doc: o.doc ? structuredClone(o.doc) : undefined,
    pricing,
  };
}

function validate(d: OrderDraft): Errors {
  const e: Errors = { byPosition: {} };
  const client: Record<string, string> = {};
  if (!d.client.name.trim()) client.name = "Въведете име.";
  if (d.client.phone.replace(/\D/g, "").length < 6) client.phone = "Въведете валиден телефон.";
  if (d.client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.client.email)) client.email = "Невалиден имейл.";
  if (Object.keys(client).length) e.client = client;
  const sections: Record<string, string> = {};
  for (const s of ensureSections(d)) if (!s.stoneKey || !d.pricing.stones[s.stoneKey]) sections[s.id] = "Изберете вид камък.";
  if (Object.keys(sections).length) e.sections = sections;
  if (d.positions.length === 0) e.positions = "Добавете поне една позиция.";
  for (const p of d.positions) {
    const pe: Record<string, string> = {};
    if (!(p.lengthCm > 0)) pe.lengthCm = "> 0";
    else if (p.lengthCm > 400) pe.lengthCm = "макс. 400 см";
    if (!(p.depthCm > 0)) pe.depthCm = "> 0";
    else if (p.depthCm > 200) pe.depthCm = "макс. 200 см";
    if (!(p.thicknessCm > 0)) pe.thicknessCm = "> 0";
    if (!(p.qty >= 1)) pe.qty = "мин. 1";
    if (Object.keys(pe).length) e.byPosition[p.id] = pe;
  }
  return e;
}
const hasErrors = (e: Errors) => !!(e.client || e.sections || e.positions || Object.keys(e.byPosition).length);

export default function OrderEditor({ orderId, template, pricing, groups, onClose, onSaved, onDuplicate, onToast }: Props) {
  const { user } = useAdminAuth();
  const [existing, setExisting] = useState<Order | null | undefined>(orderId ? undefined : null);
  const [loadError, setLoadError] = useState("");
  const [draft, setDraft] = useState<OrderDraft | null>(() => (orderId ? null : normalizeDraft(template ?? blankDraft(pricing))));
  const [dirty, setDirty] = useState(!orderId && !!template);
  const [errors, setErrors] = useState<Errors | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirm, setConfirm] = useState<
    | null
    | { kind: "status"; status: OrderStatus }
    | { kind: "delete" }
    | { kind: "leave" }
    | { kind: "reprice" }
    | { kind: "removeSection"; id: string }
  >(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [defaultThickness, setDefaultThickness] = useState(2);
  const [servicePick, setServicePick] = useState("");

  useEffect(() => {
    if (!orderId) return;
    return subscribeOrder(
      orderId,
      (o) => {
        setExisting(o);
        // Initialise the form once; later remote updates (attachments, status) refresh `existing` only.
        setDraft((d) => d ?? (o ? draftFrom(o) : null));
      },
      (e) => setLoadError(e.message)
    );
  }, [orderId]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const sealChoice = draft?.sealChoice === "without" ? "without" : "with";
  const quote = useMemo(
    () => (draft ? quoteFor(draft, { includeSeal: sealChoice !== "without" }) : null),
    [draft, sealChoice]
  );
  // Both variants are priced while editing so the admin can choose the final total.
  const quoteWithSeal = useMemo(() => (draft ? quoteFor(draft, { includeSeal: true }) : null), [draft]);
  const quoteWithoutSeal = useMemo(() => (draft ? quoteFor(draft, { includeSeal: false }) : null), [draft]);
  const liveErrors = useMemo(() => (draft && errors ? validate(draft) : null), [draft, errors]);

  if (loadError) return <ErrorBox>Грешка при зареждане на поръчката: {loadError}</ErrorBox>;
  if (existing === undefined || (orderId && !draft && existing)) return <Spinner label="Зареждане на поръчката…" />;
  if (orderId && existing === null) {
    return (
      <div className="space-y-4">
        <ErrorBox>Поръчката не е намерена (може да е изтрита).</ErrorBox>
        <button className={secondaryButton} onClick={onClose}>
          ← Към списъка
        </button>
      </div>
    );
  }
  if (!draft || !quote) return null;

  const status = existing?.status ?? draft.status;
  const readOnly = !isActiveStatus(status);
  const shownErrors = liveErrors ?? { byPosition: {} };
  const pricingChanged = (draft.pricing.updatedAt ?? 0) !== (pricing.updatedAt ?? 0);
  const customized = !!draft.pricing.customizedAt;
  const sections = draft.sections ?? ensureSections(draft);
  const hasSealVariant =
    !!quoteWithSeal && !!quoteWithoutSeal && Math.abs(quoteWithSeal.gross - quoteWithoutSeal.gross) > 0.004;

  const update = (patch: Partial<OrderDraft>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setDirty(true);
  };
  // Positions are kept grouped by material (in section order) so numbering matches the documents.
  const orderPositions = (list: Position[], secs: MaterialSection[] = sections) => {
    const rank = new Map(secs.map((s, i) => [s.id, i]));
    return list
      .map((p, i) => ({ p, i }))
      .sort((a, b) => (rank.get(a.p.sectionId ?? "") ?? 0) - (rank.get(b.p.sectionId ?? "") ?? 0) || a.i - b.i)
      .map(({ p }, i) => ({ ...p, sort: i }));
  };
  const setPositions = (fn: (list: Position[]) => Position[]) => update({ positions: orderPositions(fn(draft.positions)) });
  const withSections = (secs: MaterialSection[], positions = draft.positions): Partial<OrderDraft> => {
    const sorted = secs.map((s, i) => ({ ...s, sort: i }));
    return {
      sections: sorted,
      material: sorted[0].material,
      stoneKey: sorted[0].stoneKey,
      materialPriceM2: sorted[0].materialPriceM2 ?? null,
      positions: orderPositions(positions, sorted),
    };
  };
  const updateSection = (id: string, patch: Partial<MaterialSection>) =>
    update(withSections(sections.map((s) => (s.id === id ? { ...s, ...patch } : s))));
  const addSection = () => {
    const s = blankSection(draft.pricing, sections.length);
    update(withSections([...sections, s], [...draft.positions, blankPosition(draft.positions.length, defaultThickness, "windowsill", s.id)]));
  };
  const removeSection = (id: string) =>
    update(withSections(sections.filter((s) => s.id !== id), draft.positions.filter((p) => p.sectionId !== id)));
  const moveSection = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const copy = [...sections];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    update(withSections(copy));
  };
  const addPosition = (sectionId: string, t: Position["type"]) => {
    // New pieces inherit the material's "all impregnated" state; mixed/empty sections start off.
    const own = draft.positions.filter((p) => p.sectionId === sectionId);
    const inheritSeal = own.length > 0 && own.every((p) => p.impregnated !== false);
    setPositions((l) => [
      ...l,
      {
        ...blankPosition(l.length, t === "countertop" && defaultThickness < 3 ? 3 : defaultThickness, t, sectionId),
        impregnated: inheritSeal,
      },
    ]);
  };

  // Parent switch for one material: on = every position, off = per-position control.
  const setSectionSealed = (sectionId: string, value: boolean) =>
    setPositions((l) => l.map((p) => (p.sectionId === sectionId ? { ...p, impregnated: value } : p)));

  const repriceWithCurrent = () =>
    update({
      pricing,
      services: draft.services.map((s) => ({ ...s, unitPrice: pricing.services[s.key]?.price ?? s.unitPrice })),
    });
  const applyOrderPricing = (next: PricingSettings) => {
    const old = draft.pricing;
    const same = priceSignature(next) === priceSignature(pricing);
    update({
      pricing: same ? pricing : { ...next, customizedAt: Date.now() },
      // Services still at the old list price follow the new one; hand-edited service prices stay as they are.
      services: draft.services.map((s) => {
        const was = old.services[s.key]?.price;
        const now = next.services[s.key]?.price;
        return was != null && now != null && s.unitPrice === was ? { ...s, unitPrice: now } : s;
      }),
    });
    setPricingOpen(false);
  };

  const doc: DocOverrides = draft.doc ?? {};
  const setDoc = (patch: Partial<DocOverrides>) => update({ doc: { ...doc, ...patch } });
  const autoIncluded = includedList({ ...draft, sections, doc: undefined }, quote);

  async function save() {
    if (!draft) return;
    const e = validate(draft);
    setErrors(e);
    if (hasErrors(e)) {
      onToast("Поправете отбелязаните полета.");
      return;
    }
    setSaving(true);
    try {
      const saved = await saveOrder({ ...draft, id: draft.id ?? existing?.id }, existing);
      setDirty(false);
      setDraft((d) => (d ? { ...d, id: saved.id, number: saved.number, createdAt: saved.createdAt } : d));
      onSaved(saved.id, existing ? "Поръчката е запазена." : `Поръчка ${orderNo(saved.number)} е създадена.`);
    } catch (err) {
      onToast(`Грешка при запис: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function doStatus(next: OrderStatus) {
    if (!existing) return;
    setStatusBusy(true);
    try {
      await changeStatus(existing, next, user?.email ?? undefined);
      setDraft((d) => (d ? { ...d, status: next } : d));
      onToast(`Статус: ${statusInfo(next).label}`);
    } catch (err) {
      onToast(`Грешка: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setStatusBusy(false);
      setConfirm(null);
    }
  }

  const close = () => (dirty ? setConfirm({ kind: "leave" }) : onClose());
  const attachmentsFor = (pid: string) => existing?.attachments.filter((a) => a.positionId === pid).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button className="mb-2 text-sm text-gray-500 hover:text-darkGold" onClick={close}>
            ← Към списъка
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-obsidian">Поръчка {orderNo(existing?.number)}</h1>
            <StatusBadge status={status} />
            {dirty && <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Незапазени промени</span>}
          </div>
          {existing && (
            <p className="mt-1 text-xs text-gray-500">
              Създадена {formatDateTime(existing.createdAt)} · Обновена {formatDateTime(existing.updatedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {existing && (
            <>
              <a className={secondaryButton} href={`/admin/print/${existing.id}?type=client`} target="_blank" rel="noopener">
                ⎙ PDF за клиента
              </a>
              <a className={secondaryButton} href={`/admin/print/${existing.id}?type=internal`} target="_blank" rel="noopener">
                ⎙ PDF вътрешен
              </a>
              <button className={secondaryButton} onClick={() => onDuplicate(duplicateDraft(existing, pricing))}>
                ⧉ Дублирай като нова
              </button>
            </>
          )}
          {!readOnly && (
            <button className={primaryButton} onClick={save} disabled={saving || (!dirty && !!existing)}>
              {saving ? "Запазване…" : existing ? "Запази" : "Създай поръчка"}
            </button>
          )}
        </div>
      </div>

      {readOnly && (
        <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
          Поръчката е приключена ({statusInfo(status).label.toLowerCase()}) и е само за преглед. Използвайте „Дублирай като нова“ за
          повторна поръчка.
        </p>
      )}

      {/* Status workflow */}
      {existing && (
        <div className={card}>
          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const flow = ORDER_STATUSES.filter((s) => s.active);
              const finals = ORDER_STATUSES.filter((s) => !s.active && s.key !== "cancelled");
              const closedFinal = finals.find((s) => s.key === status);
              const steps = [
                ...flow.map((s) => ({ key: s.key as string, label: s.label as string })),
                closedFinal
                  ? { key: closedFinal.key as string, label: closedFinal.label as string }
                  : { key: "final", label: finals.map((s) => s.label).join(" / ") },
              ];
              const reachedIdx = closedFinal ? steps.length - 1 : steps.findIndex((x) => x.key === status);
              return steps.map((s, i) => {
                const done = status !== "cancelled" && i <= reachedIdx;
                return (
                  <span key={s.key} className={`flex items-center gap-2 text-xs ${done ? "font-semibold text-obsidian" : "text-gray-400"}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${s.key === status ? "bg-darkGold ring-4 ring-royalGold/30" : done ? "bg-darkGold" : "bg-gray-300"}`} />
                    {s.label}
                    {i < steps.length - 1 && <span className="text-gray-300">—</span>}
                  </span>
                );
              });
            })()}
          </div>
          {!readOnly && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
              {nextStatuses(status).map((s) =>
                s === "cancelled" ? (
                  <button
                    key={s}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    disabled={statusBusy || dirty}
                    onClick={() => setConfirm({ kind: "status", status: s })}
                  >
                    Откажи поръчката
                  </button>
                ) : (
                  <button
                    key={s}
                    className={primaryButton}
                    disabled={statusBusy || dirty}
                    onClick={() => (isActiveStatus(s) ? doStatus(s) : setConfirm({ kind: "status", status: s }))}
                  >
                    → {statusInfo(s).label}
                  </button>
                )
              )}
              {previousStatus(status) && (
                <button
                  className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                  disabled={statusBusy || dirty}
                  onClick={() => doStatus(previousStatus(status)!)}
                >
                  ↶ Върни към „{statusInfo(previousStatus(status)!).label}“
                </button>
              )}
              {dirty && <span className="text-xs text-amber-600">Запазете промените, преди да смените статуса.</span>}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-6">
          {/* Client */}
          <fieldset disabled={readOnly} className={`${card} space-y-3`}>
            <h2 className={sectionTitle}>Клиент</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label="Име *" error={shownErrors.client?.name}>
                <input
                  className={inputClass}
                  value={draft.client.name}
                  maxLength={120}
                  onChange={(e) => update({ client: { ...draft.client, name: e.target.value } })}
                />
              </Field>
              <Field label="Адрес на обекта">
                <input
                  className={inputClass}
                  value={draft.client.address ?? ""}
                  maxLength={200}
                  onChange={(e) => update({ client: { ...draft.client, address: e.target.value } })}
                />
              </Field>
              <Field label="Телефон *" error={shownErrors.client?.phone}>
                <input
                  className={inputClass}
                  type="tel"
                  value={draft.client.phone}
                  maxLength={30}
                  onChange={(e) => update({ client: { ...draft.client, phone: e.target.value } })}
                />
              </Field>
              <Field label="Имейл" error={shownErrors.client?.email}>
                <input
                  className={inputClass}
                  type="email"
                  value={draft.client.email ?? ""}
                  maxLength={120}
                  onChange={(e) => update({ client: { ...draft.client, email: e.target.value } })}
                />
              </Field>
            </div>
          </fieldset>

          {/* Materials, each with its own positions */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-obsidian">
                Материали ({sections.length}) · Позиции ({draft.positions.length})
              </h2>
              {!readOnly && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-gray-500">
                    Дебелина за нови
                    <select
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                      value={defaultThickness}
                      onChange={(e) => setDefaultThickness(Number(e.target.value))}
                    >
                      {Object.keys(draft.pricing.thicknessFactors).map((t) => (
                        <option key={t} value={t}>
                          {t} см
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className={primaryButton} onClick={addSection}>
                    + Добави материал
                  </button>
                </div>
              )}
            </div>
            {shownErrors.positions && <ErrorBox>{shownErrors.positions}</ErrorBox>}
            {sections.map((s, si) => {
              const group = groups.find((g) => g.key === s.material.groupKey);
              const own = draft.positions.filter((p) => p.sectionId === s.id);
              const sq = quote.sections.find((x) => x.sectionId === s.id);
              const allSealed = own.length > 0 && own.every((p) => p.impregnated !== false);
              const someSealed = own.some((p) => p.impregnated !== false);
              return (
                <div key={s.id} className={`${card} space-y-4 border-l-4 border-royalGold`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className={`${sectionTitle} !mb-0`}>
                      Материал {si + 1}
                      {s.material.label ? <span className="ml-2 normal-case tracking-normal text-obsidian">{s.material.label}</span> : null}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <label
                        className="flex items-center gap-1.5 text-xs text-gray-600"
                        title="Импрегниране/запечатка за всички позиции от този материал"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-darkGold"
                          checked={allSealed}
                          disabled={readOnly || own.length === 0}
                          onChange={(e) => setSectionSealed(s.id, e.target.checked)}
                        />
                        Импрегниране
                        {someSealed && !allSealed && <span className="text-amber-700">(част.)</span>}
                      </label>
                      <span className="text-gray-500">
                        {own.length} поз. · {formatNum(sq?.billableAreaM2 ?? 0, 3)} м² ·{" "}
                        <strong className="text-obsidian">{formatMoney(sq?.total ?? 0, quote.currency)}</strong>
                      </span>
                      {!readOnly && sections.length > 1 && (
                        <>
                          <button className="rounded px-2 text-gray-500 hover:text-darkGold disabled:opacity-30" disabled={si === 0} onClick={() => moveSection(si, -1)} aria-label="Премести материала нагоре">
                            ▲
                          </button>
                          <button
                            className="rounded px-2 text-gray-500 hover:text-darkGold disabled:opacity-30"
                            disabled={si === sections.length - 1}
                            onClick={() => moveSection(si, 1)}
                            aria-label="Премести материала надолу"
                          >
                            ▼
                          </button>
                          <button
                            className="rounded px-2 text-gray-400 hover:text-red-700"
                            onClick={() => (own.length ? setConfirm({ kind: "removeSection", id: s.id }) : removeSection(s.id))}
                            aria-label="Премахни материала"
                          >
                            ✖
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <fieldset disabled={readOnly} className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Група от каталога">
                          <select
                            className={inputClass}
                            value={s.material.groupKey ?? ""}
                            onChange={(e) => {
                              const g = groups.find((x) => x.key === e.target.value);
                              updateSection(s.id, {
                                material: g ? { groupKey: g.key, groupId: g.id, label: g.name } : { label: "" },
                                stoneKey: (g && stoneKeyForGroup(draft.pricing, g.id)) || s.stoneKey,
                              });
                            }}
                          >
                            <option value="">— по избор —</option>
                            {groups.map((g) => (
                              <option key={g.key} value={g.key}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Материал">
                          <select
                            className={inputClass}
                            value={s.material.materialId ?? ""}
                            disabled={readOnly || !group}
                            onChange={(e) => {
                              const m = group?.materials.find((x) => String(x.id) === e.target.value);
                              if (!group) return;
                              updateSection(s.id, {
                                material: {
                                  groupKey: group.key,
                                  groupId: group.id,
                                  materialId: m?.id,
                                  label: m ? `${group.name} ${m.displayName || m.name}` : group.name,
                                },
                              });
                            }}
                          >
                            <option value="">{group ? "— изберете —" : "първо група"}</option>
                            {group?.materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.displayName || m.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      {s.material.materialId != null && group && <MaterialPreview group={group} materialId={s.material.materialId} />}
                      {!group && (
                        <Field label="Описание на материала" hint="ако камъкът не е в каталога">
                          <input
                            className={inputClass}
                            value={s.material.label}
                            maxLength={120}
                            onChange={(e) => updateSection(s.id, { material: { label: e.target.value } })}
                          />
                        </Field>
                      )}
                    </div>
                    <div className="grid content-start gap-3 sm:grid-cols-2">
                      <Field label="Ценова категория *" error={shownErrors.sections?.[s.id]}>
                        <select className={inputClass} value={s.stoneKey} onChange={(e) => updateSection(s.id, { stoneKey: e.target.value })}>
                          {Object.entries(draft.pricing.stones).map(([k, st]) => (
                            <option key={k} value={k}>
                              {st.label} – {formatMoney(st.materialM2, draft.pricing.currency)}/м²
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Цена материал, €/м²" hint="празно = по ценоразпис">
                        <NumInput
                          value={s.materialPriceM2 ?? null}
                          min={0}
                          placeholder={String(draft.pricing.stones[s.stoneKey]?.materialM2 ?? "")}
                          onChange={(n) => updateSection(s.id, { materialPriceM2: n && n > 0 ? n : null })}
                        />
                      </Field>
                    </div>
                  </fieldset>

                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-obsidian">Позиции от този материал ({own.length})</p>
                      {!readOnly && (
                        <div className="flex flex-wrap gap-2">
                          {(["windowsill", "countertop", "threshold"] as const).map((t) => (
                            <button key={t} className={secondaryButton} onClick={() => addPosition(s.id, t)}>
                              + {t === "windowsill" ? "Перваз" : t === "countertop" ? "Плот" : "Праг"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {own.length === 0 && (
                      <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">Няма позиции.</div>
                    )}
                    {own.length > 0 && (
                      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full min-w-[880px] border-collapse text-sm">
                          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                              <th className="w-10 py-2 pl-2 pr-2">№</th>
                              <th className="py-2 pr-2">Тип</th>
                              <th className="py-2 pr-2">Означение</th>
                              <th className="py-2 pr-2">Дължина</th>
                              <th className="py-2 pr-2">Ширина</th>
                              <th className="py-2 pr-2">Брой</th>
                              <th className="py-2 pr-2 text-right">Сума</th>
                              <th className="py-2 pr-2 text-right">Действия</th>
                            </tr>
                          </thead>
                          <tbody>
                            {own.map((p, i) => (
                              <PositionEditor
                                key={p.id}
                                position={p}
                                index={i}
                                count={own.length}
                                number={draft.positions.indexOf(p) + 1}
                                pricing={draft.pricing}
                                stoneKey={s.stoneKey}
                                quote={quote.positions.find((q) => q.positionId === p.id)}
                                currency={quote.currency}
                                errors={shownErrors.byPosition[p.id]}
                                readOnly={readOnly}
                                attachmentsCount={attachmentsFor(p.id)}
                                onChange={(np) => setPositions((l) => l.map((x) => (x.id === np.id ? np : x)))}
                                onDuplicate={() =>
                                  setPositions((l) => {
                                    const at = l.findIndex((x) => x.id === p.id);
                                    const copy = { ...structuredClone(p), id: newId() };
                                    return [...l.slice(0, at + 1), copy, ...l.slice(at + 1)];
                                  })
                                }
                                onDelete={() => setPositions((l) => l.filter((x) => x.id !== p.id))}
                                onMove={(dir) =>
                                  setPositions((l) => {
                                    const other = own[i + dir];
                                    if (!other) return l;
                                    const a = l.findIndex((x) => x.id === p.id);
                                    const b = l.findIndex((x) => x.id === other.id);
                                    const copy = [...l];
                                    [copy[a], copy[b]] = [copy[b], copy[a]];
                                    return copy;
                                  })
                                }
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Services, discount, notes */}
          <fieldset disabled={readOnly} className={`${card} space-y-4`}>
            <h2 className={sectionTitle}>Услуги и условия</h2>
            {draft.services.length > 0 && (
              <div className="space-y-2">
                {draft.services.map((s) => (
                  <ServiceRow
                    key={s.id}
                    s={s}
                    readOnly={readOnly}
                    onChange={(ns) => update({ services: draft.services.map((x) => (x.id === ns.id ? ns : x)) })}
                    onRemove={() => update({ services: draft.services.filter((x) => x.id !== s.id) })}
                  />
                ))}
              </div>
            )}
            {!readOnly && (
              <div className="flex gap-2">
                <select className={`${inputClass} sm:w-72`} value={servicePick} onChange={(e) => setServicePick(e.target.value)} aria-label="Услуга">
                  <option value="">+ Добави услуга…</option>
                  {Object.entries(draft.pricing.services).map(([k, s]) => (
                    <option key={k} value={k}>
                      {s.label} ({formatMoney(s.price, draft.pricing.currency)}/{s.unit === "flat" ? "фикс." : UNIT_LABELS[s.unit]})
                    </option>
                  ))}
                  <option value="__custom">Друга услуга…</option>
                </select>
                <button
                  className={secondaryButton}
                  disabled={!servicePick}
                  onClick={() => {
                    const preset = draft.pricing.services[servicePick];
                    const totalEdgeM = quote.positions.reduce((a, q) => a + q.edgeM, 0);
                    const totalPieces = draft.positions.reduce((a, p) => a + (p.qty || 0), 0);
                    const svc: OrderService = preset
                      ? {
                          id: newId(),
                          key: servicePick,
                          label: preset.label,
                          unit: preset.unit,
                          unitPrice: preset.price,
                          // Sensible starting quantity: installation by metres of front edge, removal by pieces.
                          qty:
                            preset.unit === "m"
                              ? Math.round(
                                  draft.positions.reduce((a, p) => a + (p.lengthCm / 100) * (p.qty || 0), 0) * 100
                                ) / 100 || Math.round(totalEdgeM * 100) / 100
                              : preset.unit === "pcs"
                                ? totalPieces
                                : preset.unit === "m2"
                                  ? quote.netAreaM2
                                  : 1,
                        }
                      : { id: newId(), key: "custom", label: "", unit: "flat", unitPrice: 0, qty: 1 };
                    update({ services: [...draft.services, svc] });
                    setServicePick("");
                  }}
                >
                  Добави
                </button>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Отстъпка, %">
                <NumInput
                  value={draft.discountPct}
                  min={0}
                  onChange={(n) => update({ discountPct: Math.min(100, n ?? 0) })}
                />
              </Field>
              <Field label="Срок за изпълнение">
                <input className={inputClass} type="date" value={draft.dueDate ?? ""} onChange={(e) => update({ dueDate: e.target.value })} />
              </Field>
            </div>
            <Field label="Бележки към поръчката">
              <textarea className={inputClass} rows={3} value={draft.notes ?? ""} maxLength={4000} onChange={(e) => update({ notes: e.target.value })} />
            </Field>
          </fieldset>

          {/* Client document texts (per order) */}
          <fieldset disabled={readOnly} className={`${card} space-y-4`}>
            <div>
              <h2 className={`${sectionTitle} mb-1`}>Документ за клиента</h2>
              <p className="text-xs text-gray-500">Текстове само за тази поръчка. Празно поле = текстът по подразбиране.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Срок на изпълнение">
                <input
                  className={inputClass}
                  value={doc.leadTime ?? ""}
                  maxLength={200}
                  placeholder={defaultLeadTime(draft.dueDate)}
                  onChange={(e) => setDoc({ leadTime: e.target.value })}
                />
              </Field>
              <Field label="Пояснение към срока">
                <input
                  className={inputClass}
                  value={doc.leadTimeNote ?? ""}
                  maxLength={300}
                  placeholder={DEFAULT_LEAD_TIME_NOTE}
                  onChange={(e) => setDoc({ leadTimeNote: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Включено в цената (по един ред на точка)">
              <textarea
                className={inputClass}
                rows={Math.max(4, (doc.included?.length ?? autoIncluded.length) + 1)}
                value={(doc.included ?? []).join("\n")}
                placeholder={autoIncluded.join("\n")}
                onChange={(e) => setDoc({ included: e.target.value ? e.target.value.split("\n") : undefined })}
              />
            </Field>
            {!readOnly && (
              <div className="flex flex-wrap gap-2 text-xs">
                <button type="button" className="font-semibold text-darkGold hover:underline" onClick={() => setDoc({ included: autoIncluded })}>
                  Попълни автоматичния списък за редакция
                </button>
                {doc.included && (
                  <button type="button" className="text-gray-500 hover:underline" onClick={() => setDoc({ included: undefined })}>
                    Върни автоматичния списък
                  </button>
                )}
              </div>
            )}
          </fieldset>

          {/* Attachments */}
          <div className={card}>
            <h2 className={sectionTitle}>Прикачени файлове {existing?.attachments.length ? `(${existing.attachments.length})` : ""}</h2>
            <Attachments
              orderId={existing?.id ?? null}
              attachments={existing?.attachments ?? []}
              positions={draft.positions}
              readOnly={readOnly}
              onToast={onToast}
            />
          </div>

          {/* Status log + delete */}
          {existing && (
            <div className={card}>
              <h2 className={sectionTitle}>История на статуса</h2>
              <ol className="space-y-1 text-sm">
                {existing.statusLog.map((l, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-3">
                    <span className="w-36 text-xs text-gray-500">{formatDateTime(l.at)}</span>
                    <StatusBadge status={l.status} />
                    {l.by && <span className="text-xs text-gray-400">{l.by}</span>}
                  </li>
                ))}
              </ol>
              <div className="mt-6 border-t border-gray-100 pt-4">
                <button className="text-sm text-red-700 hover:underline" onClick={() => setConfirm({ kind: "delete" })}>
                  Изтрий поръчката окончателно
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Price breakdown */}
        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <div className={card}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-darkGold">Калкулация</h2>
              <span className="text-xs text-gray-400">цени без ДДС</span>
            </div>
            {customized && !readOnly && (
              <div className="mb-4 rounded-lg bg-sky-50 p-3 text-xs text-sky-800">
                Цените са коригирани ръчно за тази поръчка ({formatDateTime(draft.pricing.customizedAt!)}).{" "}
                <button className="font-semibold underline" onClick={() => setConfirm({ kind: "reprice" })}>
                  Върни текущия ценоразпис
                </button>
              </div>
            )}
            {!customized && pricingChanged && !readOnly && (
              <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                Поръчката е изчислена с ценоразпис от{" "}
                {draft.pricing.updatedAt ? formatDateTime(draft.pricing.updatedAt) : "примерните цени"}.{" "}
                <button className="font-semibold underline" onClick={repriceWithCurrent}>
                  Преизчисли с текущите цени
                </button>
              </div>
            )}
            {hasSealVariant && quoteWithSeal && quoteWithoutSeal && (
              <div className="mb-4 space-y-2 rounded-lg border border-royalGold/40 bg-royalGold/5 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-darkGold">Крайна сума</span>
                  <span className="text-[11px] text-gray-500">{quote.vatPct > 0 ? "с ДДС" : "без ДДС"}</span>
                </div>
                <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="sealChoice"
                      className="accent-darkGold"
                      checked={sealChoice === "without"}
                      onChange={() => update({ sealChoice: "without" })}
                      disabled={readOnly}
                    />
                    Без импрегниране
                  </span>
                  <strong className="whitespace-nowrap text-obsidian">{formatMoney(quoteWithoutSeal.gross, quote.currency)}</strong>
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="sealChoice"
                      className="accent-darkGold"
                      checked={sealChoice === "with"}
                      onChange={() => update({ sealChoice: "with" })}
                      disabled={readOnly}
                    />
                    С импрегниране
                  </span>
                  <strong className="whitespace-nowrap text-obsidian">{formatMoney(quoteWithSeal.gross, quote.currency)}</strong>
                </label>
                <p className="text-[11px] text-gray-500">Документите за клиента се изготвят по избрания вариант.</p>
              </div>
            )}
            <PriceBreakdown
              quote={quote}
              positions={draft.positions}
              sections={sections.map((s, i) => ({ id: s.id, label: s.material.label || draft.pricing.stones[s.stoneKey]?.label || `Материал ${i + 1}` }))}
            />
            {!readOnly && (
              <button className={`${secondaryButton} mt-4 w-full`} onClick={() => setPricingOpen(true)}>
                Цени за тази поръчка…
              </button>
            )}
          </div>
        </aside>
      </div>

      {pricingOpen && (
        <OrderPricingModal
          value={draft.pricing}
          current={pricing}
          groups={groups}
          onClose={() => setPricingOpen(false)}
          onApply={applyOrderPricing}
        />
      )}
      {confirm?.kind === "reprice" && (
        <Modal
          title="Текущ ценоразпис"
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className={secondaryButton} onClick={() => setConfirm(null)}>
                Отказ
              </button>
              <button
                className={primaryButton}
                onClick={() => {
                  repriceWithCurrent();
                  setConfirm(null);
                }}
              >
                Приложи текущите цени
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700">Ръчно зададените цени за тази поръчка ще бъдат заменени с текущия ценоразпис.</p>
        </Modal>
      )}
      {confirm?.kind === "removeSection" && (
        <Modal
          title="Премахване на материал"
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className={secondaryButton} onClick={() => setConfirm(null)}>
                Отказ
              </button>
              <button
                className={dangerButton}
                onClick={() => {
                  removeSection(confirm.id);
                  setConfirm(null);
                }}
              >
                Премахни
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700">Материалът и всички негови позиции ще бъдат премахнати от поръчката.</p>
        </Modal>
      )}

      {confirm?.kind === "status" && (
        <Modal
          title={confirm.status === "cancelled" ? "Отказ на поръчката" : `Приключване: ${statusInfo(confirm.status).label}`}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className={secondaryButton} onClick={() => setConfirm(null)} disabled={statusBusy}>
                Назад
              </button>
              <button
                className={confirm.status === "cancelled" ? dangerButton : primaryButton}
                disabled={statusBusy}
                onClick={() => doStatus(confirm.status)}
              >
                {statusBusy ? "…" : "Потвърди"}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700">
            Поръчката ще бъде преместена в историята и ще стане само за преглед. Винаги можете да я дублирате като нова.
          </p>
        </Modal>
      )}
      {confirm?.kind === "delete" && existing && (
        <Modal
          title="Изтриване на поръчка"
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className={secondaryButton} onClick={() => setConfirm(null)} disabled={statusBusy}>
                Отказ
              </button>
              <button
                className={dangerButton}
                disabled={statusBusy}
                onClick={async () => {
                  setStatusBusy(true);
                  try {
                    await deleteOrder(existing);
                    setDirty(false);
                    onToast(`Поръчка ${orderNo(existing.number)} е изтрита.`);
                    onClose();
                  } catch (err) {
                    onToast(`Грешка: ${err instanceof Error ? err.message : String(err)}`);
                    setStatusBusy(false);
                    setConfirm(null);
                  }
                }}
              >
                Изтрий
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700">
            Поръчка <strong>{orderNo(existing.number)}</strong> и всички прикачени файлове ще бъдат изтрити безвъзвратно. За отказана поръчка
            използвайте „Откажи“ – така остава в историята.
          </p>
        </Modal>
      )}
      {confirm?.kind === "leave" && (
        <Modal
          title="Незапазени промени"
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className={secondaryButton} onClick={() => setConfirm(null)}>
                Остани
              </button>
              <button
                className={dangerButton}
                onClick={() => {
                  setDirty(false);
                  onClose();
                }}
              >
                Излез без запис
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700">Имате незапазени промени. Да се откажат ли?</p>
        </Modal>
      )}
    </div>
  );
}

function OrderPricingModal({
  value,
  current,
  groups,
  onClose,
  onApply,
}: {
  value: PricingSettings;
  current: PricingSettings;
  groups: GroupEntry[];
  onClose: () => void;
  onApply: (p: PricingSettings) => void;
}) {
  const [p, setP] = useState<PricingSettings>(() => structuredClone(value));
  const [error, setError] = useState("");
  return (
    <Modal
      title="Цени за тази поръчка"
      onClose={onClose}
      footer={
        <>
          <button className="mr-auto text-sm text-gray-500 hover:underline" onClick={() => setP(structuredClone(current))}>
            Зареди текущия ценоразпис
          </button>
          <button className={secondaryButton} onClick={onClose}>
            Отказ
          </button>
          <button
            className={primaryButton}
            onClick={() => {
              const err = invalidPricing(p);
              if (err) return setError(err);
              onApply(p);
            }}
          >
            Приложи
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Промените важат само за тази поръчка и не променят общия ценоразпис в „Настройки“.
        </p>
        {error && <ErrorBox>{error}</ErrorBox>}
        <PricingFields value={p} onChange={setP} groups={groups} />
      </div>
    </Modal>
  );
}

function MaterialPreview({ group, materialId }: { group: GroupEntry; materialId: number }) {
  const m = group.materials.find((x) => x.id === materialId);
  if (!m) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-2">
      {m.imageUrl && (
        <img src={m.imageUrl} alt={m.name} className="h-14 w-14 rounded object-cover" loading="lazy" />
      )}
      <div className="text-xs text-gray-600">
        <p className="font-semibold text-obsidian">{m.displayName || m.name}</p>
        {m.origin && <p>Произход: {m.origin}</p>}
        {m.price != null && m.price !== "" && <p>Каталог: {String(m.price)}</p>}
      </div>
    </div>
  );
}

function ServiceRow({
  s,
  readOnly,
  onChange,
  onRemove,
}: {
  s: OrderService;
  readOnly?: boolean;
  onChange: (s: OrderService) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_90px_110px_100px_auto] sm:items-center">
      <input
        className={inputClass}
        value={s.label}
        placeholder="Описание"
        onChange={(e) => onChange({ ...s, label: e.target.value })}
        aria-label="Услуга"
      />
      <div className="flex items-center gap-1 sm:contents">
        <NumInput className={`${inputClass} w-20 sm:w-full`} value={s.qty} min={0} onChange={(n) => onChange({ ...s, qty: n ?? 0 })} aria-label="Количество" />
        <span className="text-xs text-gray-500 sm:hidden">{UNIT_LABELS[s.unit]}</span>
        <NumInput
          className={`${inputClass} w-24 sm:w-full`}
          value={s.unitPrice}
          min={0}
          onChange={(n) => onChange({ ...s, unitPrice: n ?? 0 })}
          aria-label="Единична цена"
        />
      </div>
      <span className="hidden text-right text-sm font-semibold sm:block">{formatMoney(s.qty * s.unitPrice)}</span>
      {!readOnly && (
        <button className="rounded px-2 text-gray-400 hover:text-red-700" onClick={onRemove} aria-label="Премахни услугата">
          ✖
        </button>
      )}
    </div>
  );
}
