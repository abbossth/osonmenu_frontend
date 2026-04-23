import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function normalizeEnv(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  const withoutQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;
  return withoutQuotes.trim();
}

export function getAdminAuth() {
  const projectId = normalizeEnv(process.env.FIREBASE_ADMIN_PROJECT_ID);
  const clientEmail = normalizeEnv(process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  const privateKey = normalizeEnv(process.env.FIREBASE_ADMIN_PRIVATE_KEY)
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase admin environment variables: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY.",
    );
  }

  const adminApp =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

  return getAuth(adminApp);
}
