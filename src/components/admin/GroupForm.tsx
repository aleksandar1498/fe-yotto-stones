"use client";

import { useState, type FormEvent } from "react";
import { saveGroupDetails, uploadMaterialImage, type GroupEntry } from "@/lib/adminData";
import { Field, ImagePicker, Modal, inputClass, primaryButton, secondaryButton } from "./ui";

export default function GroupForm({
  group,
  onClose,
  onSaved,
}: {
  group: GroupEntry;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState({
    name: group.name ?? "",
    title: group.title ?? "",
    category: group.category ?? "",
    shortDescription: group.shortDescription ?? "",
    description: group.description ?? "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) return setError("Име и категория са задължителни.");
    setSaving(true);
    setError("");
    try {
      let mainImageUrl = group.mainImageUrl;
      if (file) mainImageUrl = (await uploadMaterialImage(form.category, file, `main-${form.category}`)).imageUrl;
      await saveGroupDetails(group.key, {
        name: form.name.trim(),
        title: form.title.trim(),
        category: form.category.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        mainImageUrl,
      });
      onSaved(`Групата „${form.name.trim()}“ е запазена.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка при запис.");
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={`Редакция на група: ${group.name}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose} disabled={saving}>
            Отказ
          </button>
          <button type="submit" form="group-form" className={primaryButton} disabled={saving}>
            {saving ? "Запазване…" : "Запази"}
          </button>
        </>
      }
    >
      <form id="group-form" onSubmit={submit} className="space-y-5">
        <Field label="Основна снимка">
          <ImagePicker currentSrc={group.mainImageUrl} file={file} onFile={setFile} />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Име">
            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Заглавие">
            <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Категория" hint="Използва се и за папката в Storage">
            <input className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)} />
          </Field>
        </div>
        <Field label="Кратко описание">
          <textarea rows={2} className={inputClass} value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
        </Field>
        <Field label="Описание">
          <textarea rows={4} className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Modal>
  );
}
