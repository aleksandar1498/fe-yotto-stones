"use client";

import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";

const ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Грешен имейл или парола.",
  "auth/invalid-email": "Невалиден имейл.",
  "auth/too-many-requests": "Твърде много опити. Опитайте по-късно.",
  "auth/operation-not-allowed": "Email/Password входът не е активиран във Firebase.",
};

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // AdminShell redirects to /admin once the auth state flips.
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      setError(ERRORS[code] || "Неуспешен вход. Опитайте отново.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-6 rounded-xl border border-gray-800 bg-[#111] p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <img src="/assets/images/logo-official-v2.svg" alt="Yotto Stones" className="max-w-[150px]" />
          <h1 className="text-2xl font-semibold text-white">Админ вход</h1>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm text-gray-400">Имейл</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-obsidian px-4 py-2.5 text-platinum outline-none focus:border-royalGold"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-gray-400">Парола</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-obsidian px-4 py-2.5 text-platinum outline-none focus:border-royalGold"
          />
        </label>

        {error && <p className="rounded-lg bg-red-900/40 px-4 py-2 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-darkGold py-3 font-semibold text-white transition hover:bg-darkGoldHover disabled:opacity-60"
        >
          {busy ? "Влизане…" : "Вход"}
        </button>
      </form>
    </div>
  );
}
