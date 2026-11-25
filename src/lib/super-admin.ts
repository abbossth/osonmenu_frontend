import type { NextRequest } from "next/server";
import { verifyUser } from "@/app/api/_utils/menu-builder";

/**
 * Super-admin — barcha restoranlarni yoqib/o'chira oladigan foydalanuvchilar.
 * `.env` / Vercel: SUPER_ADMIN_UIDS=uid1,uid2   (Firebase Authentication → Users → User UID)
 *
 * Email emas, UID ishlatiladi: email/parol akkauntlarida email tasdiqlanmagan bo'lishi mumkin.
 */
export function getSuperAdminUids() {
  return (process.env.SUPER_ADMIN_UIDS ?? "")
    .split(",")
    .map((entry) => entry.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

export function isSuperAdminUid(uid: string | null | undefined) {
  if (!uid) return false;
  return getSuperAdminUids().includes(uid);
}

/** Token tekshiradi. Natija: null — kirilmagan; { isAdmin: false } — admin emas. */
export async function verifySuperAdmin(request: NextRequest) {
  let user: { uid: string; email: string } | null = null;
  try {
    user = await verifyUser(request);
  } catch {
    user = null;
  }
  if (!user) return null;
  return { ...user, isAdmin: isSuperAdminUid(user.uid) };
}
