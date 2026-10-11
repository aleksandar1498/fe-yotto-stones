"use client";

import { useEffect, useState, type ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-obsidian outline-none transition focus:border-darkGold focus:ring-1 focus:ring-darkGold";

export const primaryButton =
  "rounded-lg bg-darkGold px-5 py-2 text-sm font-semibold text-white transition hover:bg-darkGoldHover disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButton =
  "rounded-lg border border-darkGold px-5 py-2 text-sm font-semibold text-darkGold transition hover:bg-darkGold hover:text-white disabled:opacity-60";

export const dangerButton =
  "rounded-lg bg-red-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60";

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center" onClick={onClose}>
      <div
        className={`my-8 w-full ${wide ? "max-w-4xl" : "max-w-lg"} rounded-xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between rounded-t-xl bg-obsidian px-6 py-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Затвори">
            ✖
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block truncate whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-gray-600" title={label}>{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>
      )}
    </label>
  );
}

// Decimal input that accepts "," and keeps partial input like "1." while typing; emits null when empty/invalid.
export function NumInput({
  value,
  onChange,
  className = inputClass,
  integer = false,
  min,
  ...rest
}: {
  value: number | null | undefined;
  onChange: (n: number | null) => void;
  className?: string;
  integer?: boolean;
  min?: number;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
  title?: string;
}) {
  const [text, setText] = useState(value == null ? "" : String(value));

  useEffect(() => {
    const parsed = text.trim() === "" ? null : Number(text.replace(",", "."));
    if (parsed !== value) setText(value == null ? "" : String(value));
    // Only resync when the external value changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      {...rest}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      className={className}
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.,-]/g, "");
        setText(raw);
        if (raw.trim() === "") return onChange(null);
        let n = Number(raw.replace(",", "."));
        if (!Number.isFinite(n)) return;
        if (integer) n = Math.trunc(n);
        if (min != null && n < min) n = min;
        onChange(n);
      }}
    />
  );
}

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div role="status" className="fixed bottom-6 right-6 z-[60] rounded-lg bg-obsidian px-5 py-3 text-sm text-platinum shadow-2xl">
      <span className="mr-2 text-royalGold">●</span>
      {message}
    </div>
  );
}

export function Spinner({ label = "Зареждане…" }: { label?: string }) {
  return <p className="py-16 text-center text-sm uppercase tracking-[0.2em] text-darkGold">{label}</p>;
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{children}</p>;
}

// Image picker with live preview; the actual upload happens when the parent form saves.
export function ImagePicker({
  currentSrc,
  file,
  onFile,
}: {
  currentSrc?: string;
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const src = preview || currentSrc;

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-gray-400">Няма снимка</span>}
      </div>
      <div className="space-y-2 text-sm">
        <label className={`${secondaryButton} inline-block cursor-pointer`}>
          {src ? "Смени снимка" : "Качи снимка"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {file && (
          <p className="text-xs text-gray-500">
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB){" "}
            <button type="button" className="text-red-600 hover:underline" onClick={() => onFile(null)}>
              отказ
            </button>
          </p>
        )}
        <p className="text-xs text-gray-400">JPG / PNG / WEBP, до 5 MB</p>
      </div>
    </div>
  );
}
