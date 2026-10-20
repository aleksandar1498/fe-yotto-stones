"use client";

import { useState, type FormEvent } from "react";
import { saveMaterial, slugify, uploadMaterialImage, type GroupEntry, type Material } from "@/lib/adminData";
import { materialImageSrc } from "@/lib/materialImage";
import { materialPriceM2 } from "@/lib/orders/publicQuote";
import { Field, ImagePicker, Modal, inputClass, primaryButton, secondaryButton } from "./ui";

type FormState = {
  name: string;
  displayName: string;
  price: string;
  origin: string;
  material: string;
  surface: string;
  sizes: string;
  description: string;
  seoDescription: string;
  galleryImageUrls: string;
  trending: boolean;
  grain: "none" | "directional";
};

function initialState(group: GroupEntry, m?: Material): FormState {
  return {
    name: m?.name ?? "",
    displayName: m?.displayName ?? "",
    price: m?.price != null && materialPriceM2(m.price) != null ? String(m.price) : "",
    origin: m?.origin ?? "",
    material: m?.material ?? (m ? "" : group.name),
    surface: m?.surface ?? "",
    sizes: m?.sizes ?? "",
    description: m?.description ?? "",
    seoDescription: m?.seoDescription ?? "",
    galleryImageUrls: (m?.galleryImageUrls ?? []).join("\n"),
    trending: !!m?.trending,
    grain: m?.grain === "directional" ? "directional" : "none",
  };
}

export default function MaterialForm({
  group,
  material,
  onClose,
  onSaved,
}: {
  group: GroupEntry;
  material?: Material;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const isNew = !material;
  const [form, setForm] = useState<FormState>(() => initialState(group, material));
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const name = slugify(form.name || form.displayName);
    if (!name) return setError("Въведете име (slug) или показвано име.");
    if (isNew && !file) return setError("Качете снимка за новия материал.");
    if (group.materials.some((m) => m.name === name && m.id !== material?.id)) {
      return setError(`Вече има материал с име „${name}“ в тази група.`);
    }
    const priceNumber = materialPriceM2(form.price);
    if (form.price.trim() !== "" && priceNumber == null) return setError("Цената трябва да е положително число (€/м²) или празна.");

    setSaving(true);
    setError("");
    try {
      let image = { imageName: material?.imageName, imageUrl: material?.imageUrl };
      if (file) image = await uploadMaterialImage(group.category, file, name);

      const id = await saveMaterial(group.key, {
        // Keep fields this form doesn't edit (gallery, grain, trending, ...).
        ...material,
        id: material?.id,
        name,
        displayName: form.displayName.trim() || name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        ...image,
        price: priceNumber ?? undefined,
        origin: form.origin.trim(),
        material: form.material.trim(),
        surface: form.surface.trim(),
        sizes: form.sizes.trim(),
        description: form.description.trim(),
        seoDescription: form.seoDescription.trim(),
        galleryImageUrls: form.galleryImageUrls.split("\n").map((s) => s.trim()).filter(Boolean),
        trending: form.trending || undefined,
        grain: form.grain === "directional" ? "directional" : undefined,
      });
      onSaved(isNew ? `Материал #${id} е добавен.` : `Материал #${id} е запазен.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка при запис.");
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={isNew ? `Нов материал – ${group.name}` : `Редакция: ${material.displayName || material.name} (#${material.id})`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose} disabled={saving}>
            Отказ
          </button>
          <button type="submit" form="material-form" className={primaryButton} disabled={saving}>
            {saving ? "Запазване…" : "Запази"}
          </button>
        </>
      }
    >
      <form id="material-form" onSubmit={submit} className="space-y-5">
        <Field label="Снимка">
          <ImagePicker currentSrc={material ? materialImageSrc(material, group.id) : ""} file={file} onFile={setFile} />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Показвано име" hint="Напр. Bianco Carrara">
            <input className={inputClass} value={form.displayName} onChange={(e) => set("displayName", e.target.value)} />
          </Field>
          <Field label="Име (slug)" hint={`Латиница, без интервали. Ще бъде: ${slugify(form.name || form.displayName) || "—"}`}>
            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Цена материал (€/м² плоча, без ДДС)" hint="Празно = цената за вида камък от ценоразписа">
            <input className={inputClass} inputMode="decimal" placeholder="напр. 120" value={form.price} onChange={(e) => set("price", e.target.value)} />
          </Field>
          <Field label="Произход">
            <input className={inputClass} value={form.origin} onChange={(e) => set("origin", e.target.value)} />
          </Field>
          <Field label="Материал">
            <input className={inputClass} value={form.material} onChange={(e) => set("material", e.target.value)} />
          </Field>
          <Field label="Повърхност">
            <input className={inputClass} value={form.surface} onChange={(e) => set("surface", e.target.value)} />
          </Field>
          <Field label="Размери">
            <input className={inputClass} value={form.sizes} onChange={(e) => set("sizes", e.target.value)} />
          </Field>
          <Field label="Текстура (за разкрой)" hint="Дирекционна = детайлите не се завъртат при разкроя">
            <select className={inputClass} value={form.grain} onChange={(e) => set("grain", e.target.value as FormState["grain"])}>
              <option value="none">Недирекционна</option>
              <option value="directional">Дирекционна (жилките се спазват)</option>
            </select>
          </Field>
          <label className="flex items-center gap-3 self-end pb-2 text-sm font-medium text-obsidian">
            <input
              type="checkbox"
              className="h-4 w-4 accent-darkGold"
              checked={form.trending}
              onChange={(e) => set("trending", e.target.checked)}
            />
            Премиум (показва се в „Най-търсени“)
          </label>
        </div>

        <Field label="Описание">
          <textarea rows={4} className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field label="SEO описание">
          <textarea rows={2} className={inputClass} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
        </Field>
        <Field label="Галерия (URL адреси)" hint="По един URL на ред">
          <textarea rows={3} className={inputClass} value={form.galleryImageUrls} onChange={(e) => set("galleryImageUrls", e.target.value)} />
        </Field>

        {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Modal>
  );
}
