"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminAuthProvider, useAdminAuth } from "@/providers/AdminAuthProvider";

const LOGIN_PATH = "/admin/login";

function Guard({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const onLogin = pathname === LOGIN_PATH;

  useEffect(() => {
    if (loading) return;
    if (!user && !onLogin) router.replace(LOGIN_PATH);
    if (user && onLogin) router.replace("/admin");
  }, [user, loading, onLogin, router]);

  if (loading || (!user && !onLogin) || (user && onLogin)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian text-platinum">
        <p className="text-sm uppercase tracking-[0.2em] text-royalGold">Зареждане…</p>
      </div>
    );
  }

  // Login and printable documents render without the admin chrome.
  if (onLogin || pathname?.startsWith("/admin/print")) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-obsidian text-platinum shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="flex items-center gap-4">
            <img src="/assets/images/logo-official-v2.svg" alt="Yotto Stones" className="max-w-[110px]" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-royalGold">Админ</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-gray-400 sm:inline">{user?.email}</span>
            <Link href="/" target="_blank" className="text-royalGold hover:underline">
              Към сайта ↗
            </Link>
            <button
              onClick={() => logout()}
              className="rounded-lg border border-royalGold px-4 py-1.5 text-royalGold transition hover:bg-royalGold hover:text-obsidian"
            >
              Изход
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <Guard>{children}</Guard>
    </AdminAuthProvider>
  );
}
