"use client";

import { useState } from "react";
import { saveDocumentSettings } from "@/lib/orders/ordersData";
import {
  DEFAULT_DOCUMENT_SETTINGS,
  TERM_PLACEHOLDERS,
  TERM_SCOPES,
  fillPlaceholders,
  type Company,
  type DocumentSettings,
  type TermScope,
} from "@/lib/orders/documents";
import { Field, Modal, NumInput, inputClass, primaryButton, secondaryButton } from "../ui";

type Props = { settings: DocumentSettings; onClose: () => void; onSaved: () => void };

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wider text-darkGold first:mt-0">{children}</h3>;
}

const iconButton = "rounded px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-obsidian disabled:opacity-30";

export default function DocumentSettingsForm({ settings, onClose, onSaved }: Props) {
  const [s, setS] = useState<DocumentSettings>(() => structuredClone(settings));
  const [phones, setPhones] = useState(() => settings.company.phones.join("\n"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (patch: Partial<DocumentSettings>) => setS((cur) => ({ ...cur, ...patch }));
  const setCompany = (patch: Partial<Company>) => setS((cur) => ({ ...cur, company: { ...cur.company, ...patch } }));
  const setTerm = (i: number, patch: Partial<DocumentSettings["terms"][number]>) =>
    setS((cur) => ({ ...cur, terms: cur.terms.map((t, j) => (j === i ? { ...t, ...patch } : t)) }));
  const moveTerm = (i: number, dir: -1 | 1) =>
    setS((cur) => {
      const terms = [...cur.terms];
      [terms[i], terms[i + dir]] = [terms[i + dir], terms[i]];
      return { ...cur, terms };
    });
  const removeTerm = (i: number) => setS((cur) => ({ ...cur, terms: cur.terms.filter((_, j) => j !== i) }));
  const addTerm = () => setS((cur) => ({ ...cur, terms: [...cur.terms, { text: "", scope: "all" }] }));

  async function save() {
    setError("");
    const next: DocumentSettings = {
      ...s,
      company: { ...s.company, phones: phones.split(/\n|,/).map((p) => p.trim()).filter(Boolean) },
      terms: s.terms.map((t) => ({ ...t, text: t.text.trim() })).filter((t) => t.text),
    };
    const problems: string[] = [];
    if (!next.company.name.trim()) problems.push("името на фирмата е задължително");
    if (!next.company.phones.length) problems.push("въведете поне един телефон");
    if (next.advancePct < 0 || next.advancePct > 100) problems.push("авансът трябва да е между 0 и 100%");
    if ([next.offerValidityDays, next.freeStorageDays, next.warrantyMonths].some((v) => v < 0)) problems.push("сроковете не може да са отрицателни");
    const unknown = next.terms
      .flatMap((t) => [...t.text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))
      .filter((k) => !TERM_PLACEHOLDERS.some((p) => p.key === k));
    if (unknown.length) problems.push(`непознати полета в условията: ${[...new Set(unknown)].map((k) => `{${k}}`).join(", ")}`);
    if (problems.length) {
      setError(`Проверете: ${problems.join("; ")}.`);
      return;
    }
    setSaving(true);
    try {
      await saveDocumentSettings(next);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  function resetDefaults() {
    const d = structuredClone(DEFAULT_DOCUMENT_SETTINGS);
    setS(d);
    setPhones(d.company.phones.join("\n"));
  }

  return (
    <Modal
      title="Документи и условия"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="mr-auto text-sm text-gray-500 hover:text-obsidian" onClick={resetDefaults} disabled={saving}>
            Върни текстовете по подразбиране
          </button>
          <button className={secondaryButton} onClick={onClose} disabled={saving}>
            Отказ
          </button>
          <button className={primaryButton} onClick={save} disabled={saving}>
            {saving ? "Запазване…" : "Запази"}
          </button>
        </>
      }
    >
      <p className="mb-4 rounded-lg bg-sky-50 p-3 text-xs text-sky-800">
        Тези данни се използват в PDF документите (за клиента и вътрешния). Промените важат веднага за всички поръчки при следващо
        отваряне на документа.
      </p>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <H>Фирма</H>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Име на фирмата">
          <input className={inputClass} value={s.company.name} onChange={(e) => setCompany({ name: e.target.value })} />
        </Field>
        <Field label="Подзаглавие">
          <input className={inputClass} value={s.company.tagline} onChange={(e) => setCompany({ tagline: e.target.value })} />
        </Field>
        <Field label="Имейл">
          <input className={inputClass} type="email" value={s.company.email} onChange={(e) => setCompany({ email: e.target.value })} />
        </Field>
        <Field label="Уебсайт">
          <input className={inputClass} value={s.company.website} onChange={(e) => setCompany({ website: e.target.value })} />
        </Field>
        <Field label="Адрес">
          <input className={inputClass} value={s.company.address} onChange={(e) => setCompany({ address: e.target.value })} />
        </Field>
        <Field label="Телефони" hint="по един на ред">
          <textarea className={inputClass} rows={2} value={phones} onChange={(e) => setPhones(e.target.value)} />
        </Field>
      </div>

      <H>Срокове и плащане</H>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TERM_PLACEHOLDERS.map((p) => (
          <Field key={p.key} label={p.label} hint={`в текста: {${p.key}}`}>
            <NumInput integer min={0} value={s[p.key]} onChange={(v) => set({ [p.key]: v ?? 0 })} />
          </Field>
        ))}
      </div>

      <H>Условия на договора</H>
      <p className="mb-3 text-xs text-gray-500">
        Номерирани в реда, в който са подредени. Стойностите от „Срокове и плащане“ се вмъкват чрез полетата в къдрави скоби,
        напр. <code className="rounded bg-gray-100 px-1">{"{advancePct}"}</code>. „Само оферти“ се показват при статус Запитване и
        Оферта; „Само договор-поръчки“ – след потвърждение.
      </p>
      <ol className="space-y-3">
        {s.terms.map((t, i) => {
          const preview = fillPlaceholders(t.text, s);
          return (
            <li key={i} className="rounded-lg border border-gray-200 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="w-6 text-sm font-semibold text-darkGold">{i + 1}.</span>
                <select
                  className={`${inputClass} !w-auto py-1 text-sm`}
                  value={t.scope}
                  onChange={(e) => setTerm(i, { scope: e.target.value as TermScope })}
                  aria-label={`Обхват на условие ${i + 1}`}
                >
                  {TERM_SCOPES.map((sc) => (
                    <option key={sc.key} value={sc.key}>
                      {sc.label}
                    </option>
                  ))}
                </select>
                <div className="ml-auto flex gap-1">
                  <button className={iconButton} onClick={() => moveTerm(i, -1)} disabled={i === 0} aria-label="Нагоре" title="Нагоре">
                    ↑
                  </button>
                  <button
                    className={iconButton}
                    onClick={() => moveTerm(i, 1)}
                    disabled={i === s.terms.length - 1}
                    aria-label="Надолу"
                    title="Надолу"
                  >
                    ↓
                  </button>
                  <button
                    className={`${iconButton} hover:!bg-red-50 hover:!text-red-700`}
                    onClick={() => removeTerm(i)}
                    aria-label="Изтрий"
                    title="Изтрий"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <textarea
                className={inputClass}
                rows={3}
                value={t.text}
                onChange={(e) => setTerm(i, { text: e.target.value })}
                placeholder="Текст на условието"
                aria-label={`Текст на условие ${i + 1}`}
              />
              {preview !== t.text && <p className="mt-1 text-xs text-gray-500">Преглед: {preview}</p>}
            </li>
          );
        })}
      </ol>
      {!s.terms.length && <p className="text-sm text-gray-400">Няма условия – секцията няма да се показва в документа.</p>}
      <button className={`${secondaryButton} mt-3`} onClick={addTerm}>
        + Добави условие
      </button>
    </Modal>
  );
}
