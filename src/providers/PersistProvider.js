"use client";

// Importing the persistor starts rehydration from localStorage. We deliberately
// do not wrap children in <PersistGate loading={null}>: it rendered nothing on
// the server, leaving every public page with empty HTML for search engines.
import "../lib/store";

export default function PersistProvider({ children }) {
  return children;
}