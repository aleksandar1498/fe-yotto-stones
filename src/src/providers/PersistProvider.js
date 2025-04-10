"use client";

import { PersistGate } from "redux-persist/integration/react";

import { persistor } from "../lib/store";

export default function PersistProvider({ children }) {
  return <PersistGate loading={null} persistor={persistor}>{children}</PersistGate>;
}
