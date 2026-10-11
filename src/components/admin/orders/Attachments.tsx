"use client";

import { useRef, useState } from "react";
import {
  ATTACHMENT_ACCEPT,
  deleteAttachment,
  tagAttachment,
  uploadAttachment,
  validateAttachment,
  type Attachment,
} from "@/lib/orders/ordersData";
import { PRODUCT_TYPES, formatNum, type Position } from "@/lib/orders/pricing";
import { Modal, dangerButton, inputClass, secondaryButton } from "../ui";

type Props = {
  orderId: string | null;
  attachments: Attachment[];
  positions: Position[];
  readOnly?: boolean;
  onToast: (msg: string) => void;
};

const isImage = (a: { contentType: string }) => a.contentType.startsWith("image/");
const sizeLabel = (b: number) => (b > 1024 * 1024 ? `${formatNum(b / 1024 / 1024, 1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function Attachments({ orderId, attachments, positions, readOnly, onToast }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [tagFor, setTagFor] = useState("");
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Attachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const posLabel = (id?: string) => {
    const i = positions.findIndex((p) => p.id === id);
    if (i < 0) return "";
    const p = positions[i];
    return `${i + 1}. ${PRODUCT_TYPES.find((t) => t.key === p.type)?.label}${p.label ? ` – ${p.label}` : ""}`;
  };

  async function upload(files: File[]) {
    if (!orderId || files.length === 0) return;
    const errs = files.map(validateAttachment).filter((e): e is string => !!e);
    const valid = files.filter((f) => !validateAttachment(f));
    setErrors(errs);
    if (valid.length === 0) return;
    setUploading({ done: 0, total: valid.length });
    let ok = 0;
    // Sequential keeps progress honest and avoids hammering Storage from slow mobile connections.
    for (const f of valid) {
      try {
        await uploadAttachment(orderId, f, tagFor || undefined);
        ok++;
      } catch (e) {
        errs.push(`${f.name}: ${e instanceof Error ? e.message : String(e)}`);
        setErrors([...errs]);
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
    if (input.current) input.current.value = "";
    if (ok) onToast(`Качени файлове: ${ok}`);
  }

  if (!orderId) {
    return <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">Запазете поръчката, за да прикачите снимки, чертежи и PDF файлове.</p>;
  }

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void upload(Array.from(e.dataTransfer.files));
          }}
          className={`flex flex-col gap-3 rounded-lg border-2 border-dashed p-4 sm:flex-row sm:items-center ${
            dragOver ? "border-darkGold bg-royalGold/10" : "border-gray-300"
          }`}
        >
          <div className="flex-1 text-sm text-gray-600">
            Пуснете файлове тук или{" "}
            <button className="font-semibold text-darkGold hover:underline" onClick={() => input.current?.click()} disabled={!!uploading}>
              изберете
            </button>
            . Снимки и PDF, до 15 MB.
          </div>
          <select className={`${inputClass} sm:w-64`} value={tagFor} onChange={(e) => setTagFor(e.target.value)} aria-label="Към позиция">
            <option value="">Към цялата поръчка</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {posLabel(p.id)}
              </option>
            ))}
          </select>
          <input
            ref={input}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            className="hidden"
            onChange={(e) => void upload(Array.from(e.target.files ?? []))}
          />
        </div>
      )}
      {uploading && (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-darkGold transition-all" style={{ width: `${(uploading.done / uploading.total) * 100}%` }} />
          </div>
          <p className="text-xs text-gray-500">
            Качване {uploading.done}/{uploading.total}…
          </p>
        </div>
      )}
      {errors.length > 0 && (
        <ul className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {attachments.length === 0 ? (
        <p className="text-sm text-gray-400">Няма прикачени файлове.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {attachments.map((a) => (
            <li key={a.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <button className="block aspect-[4/3] w-full bg-gray-50" onClick={() => setPreview(a)} title="Преглед">
                {isImage(a) ? (
                  <img src={a.url} alt={a.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full flex-col items-center justify-center text-red-700">
                    <span className="text-3xl">📄</span>
                    <span className="text-xs font-semibold">PDF</span>
                  </span>
                )}
              </button>
              <div className="space-y-1 p-2">
                <p className="truncate text-xs font-semibold text-obsidian" title={a.name}>
                  {a.name}
                </p>
                <p className="text-[11px] text-gray-400">{sizeLabel(a.size)}</p>
                {readOnly ? (
                  a.positionId && <p className="truncate text-[11px] text-gray-500">{posLabel(a.positionId)}</p>
                ) : (
                  <div className="flex gap-1">
                    <select
                      className="min-w-0 flex-1 rounded border border-gray-200 px-1 py-0.5 text-[11px]"
                      value={a.positionId && positions.some((p) => p.id === a.positionId) ? a.positionId : ""}
                      onChange={(e) =>
                        tagAttachment(orderId, a.id, e.target.value || null).catch((err) => onToast(`Грешка: ${err.message}`))
                      }
                      aria-label="Позиция"
                    >
                      <option value="">Цялата поръчка</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {posLabel(p.id)}
                        </option>
                      ))}
                    </select>
                    <button
                      className="rounded px-1.5 text-xs text-gray-400 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setConfirmDelete(a)}
                      aria-label={`Изтрий ${a.name}`}
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {preview && (
        <Modal
          title={preview.name}
          onClose={() => setPreview(null)}
          wide
          footer={
            <a href={preview.url} target="_blank" rel="noreferrer" className={secondaryButton}>
              Отвори в нов прозорец
            </a>
          }
        >
          {isImage(preview) ? (
            <img src={preview.url} alt={preview.name} className="mx-auto max-h-[60vh] object-contain" />
          ) : (
            <iframe src={preview.url} title={preview.name} className="h-[60vh] w-full rounded border" />
          )}
        </Modal>
      )}
      {confirmDelete && (
        <Modal
          title="Изтриване на файл"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <button className={secondaryButton} onClick={() => setConfirmDelete(null)} disabled={busy}>
                Отказ
              </button>
              <button
                className={dangerButton}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await deleteAttachment(orderId, confirmDelete);
                    onToast("Файлът е изтрит.");
                    setConfirmDelete(null);
                  } catch (e) {
                    onToast(`Грешка: ${e instanceof Error ? e.message : String(e)}`);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Изтриване…" : "Изтрий"}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700">
            Да се изтрие ли <strong>{confirmDelete.name}</strong>? Файлът се премахва и от хранилището.
          </p>
        </Modal>
      )}
    </div>
  );
}
