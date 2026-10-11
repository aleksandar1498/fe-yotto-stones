"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type AdminAuth = { user: User | null; loading: boolean; logout: () => Promise<void> };

const AdminAuthContext = createContext<AdminAuth>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      }),
    []
  );

  return (
    <AdminAuthContext.Provider value={{ user, loading, logout: () => signOut(auth) }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
