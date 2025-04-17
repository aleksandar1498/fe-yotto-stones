"use client";

import { usePathname } from "next/navigation";

export const useAutoBreadcrumbs = () => {
  const pathname = usePathname();

  const base = "https://www.yottostones-bg.com";

  // Split pathname into segments, filter empty
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const url = `${base}/${segments.slice(0, index + 1).join("/")}`;
    const name = formatSegmentName(segment);
    return { name, url };
  });

  return [{ name: "Начало", url: base }, ...breadcrumbs];
};

// Helper to format segment names cleanly
const formatSegmentName = (segment) => {
  return decodeURIComponent(segment)
    .replace(/-/g, " ") // Replace hyphens with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize words
};
