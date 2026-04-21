"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

type AppUser = {
  _id: string;
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: string;
};

type AuthContextValue = {
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function splitDisplayName(displayName: string | null) {
  if (!displayName?.trim()) {
    return { firstName: "User", lastName: "User" };
  }

  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "User" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    try {
      const firebaseAuth = getFirebaseAuth();
      unsub = onAuthStateChanged(firebaseAuth, async (user) => {
        setFirebaseUser(user);

        if (!user) {
          setAppUser(null);
          setLoading(false);
          return;
        }

        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/me", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = (await res.json()) as { user: AppUser | null };
          if (data.user) {
            setAppUser(data.user);
            return;
          }

          // Backfill MongoDB record for older Firebase-only users.
          const { firstName, lastName } = splitDisplayName(user.displayName);
          const registerRes = await fetch("/api/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: user.email,
              firebaseUid: user.uid,
              firstName,
              lastName,
            }),
          });

          if (!registerRes.ok) {
            setAppUser(null);
            return;
          }

          const registerData = (await registerRes.json()) as { user: AppUser | null };
          setAppUser(registerData.user);
        } catch {
          setAppUser(null);
        } finally {
          setLoading(false);
        }
      });
    } catch {}

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      appUser,
      loading,
      logout: async () => {
        const firebaseAuth = getFirebaseAuth();
        await signOut(firebaseAuth);
        setAppUser(null);
      },
    }),
    [appUser, firebaseUser, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
