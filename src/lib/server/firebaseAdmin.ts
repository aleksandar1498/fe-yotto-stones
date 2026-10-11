import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";

const DEFAULT_DATABASE_URL = "https://yotto-stones-default-rtdb.europe-west1.firebasedatabase.app";

let cached: Database | null | undefined;

// FIREBASE_SERVICE_ACCOUNT holds the service-account JSON (raw or base64). Missing/invalid → null, callers answer 503.
export function adminDb(): Database | null {
  if (cached !== undefined) return cached;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return (cached = null);
  try {
    const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const account = JSON.parse(json);
    const app: App =
      getApps().find((a) => a.name === "yotto-admin") ??
      initializeApp(
        { credential: cert(account), databaseURL: process.env.FIREBASE_DATABASE_URL || DEFAULT_DATABASE_URL },
        "yotto-admin"
      );
    cached = getDatabase(app);
  } catch (e) {
    console.error("firebase-admin init failed", e);
    cached = null;
  }
  return cached;
}
