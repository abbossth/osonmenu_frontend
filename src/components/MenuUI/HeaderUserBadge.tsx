"use client";

import type { User } from "firebase/auth";

type HeaderUserBadgeProps = {
  firebaseUser: User | null;
  ownerId?: string;
  accentColor?: string;
};

export function HeaderUserBadge({ firebaseUser, ownerId, accentColor = "#f7906c" }: HeaderUserBadgeProps) {
  const displayNameRaw = (firebaseUser?.displayName || firebaseUser?.email?.split("@")[0] || "User").trim();
  const displayName = displayNameRaw.length > 15 ? `${displayNameRaw.slice(0, 15)}...` : displayNameRaw;
  const initials = displayNameRaw
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  const role = firebaseUser?.uid && ownerId && firebaseUser.uid === ownerId ? "Owner" : "Employee";

  return (
    <div className="flex items-center gap-2">
      <div
        className="grid h-8 w-8 place-items-center rounded-full text-xs font-semibold text-white"
        style={{ backgroundColor: accentColor }}
      >
        {initials || "U"}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-neutral-700">{displayName}</p>
        <p className="truncate text-xs text-neutral-500">{role}</p>
      </div>
    </div>
  );
}
