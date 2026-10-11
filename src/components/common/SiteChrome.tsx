"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// The admin area is a standalone tool: hide the public navbar, footer, chat and cookie banner there.
export default function SiteChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return <>{children}</>;

  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}
