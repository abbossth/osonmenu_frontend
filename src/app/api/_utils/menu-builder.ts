import { Types } from "mongoose";
import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { connectToMongoDB } from "@/lib/mongodb";
import { EstablishmentModel } from "@/models/Establishment";

export type MenuItemInput = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  badge: "popular" | "new" | null;
};

export function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export async function verifyUserId(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return null;
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

export async function verifyUser(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return null;
  const decoded = await getAdminAuth().verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: typeof decoded.email === "string" ? decoded.email.toLowerCase() : "",
  };
}

export function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeSlug(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeBadge(value: unknown): "popular" | "new" | null {
  if (value === "popular" || value === "new") return value;
  return null;
}

export function normalizePrice(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return NaN;
}

export async function findUserEstablishment(slug: string, userId: string) {
  await connectToMongoDB();
  const directMatch = await EstablishmentModel.findOne({
    slug,
    $or: [{ ownerId: userId }, { userId }, { "teamMembers.userId": userId }],
  }).sort({ createdAt: 1 });
  if (directMatch) return directMatch;

  try {
    const authUser = await getAdminAuth().getUser(userId);
    const email = authUser.email?.toLowerCase();
    if (!email) return null;
    return EstablishmentModel.findOne({
      slug,
      "teamMembers.email": { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    }).sort({ createdAt: 1 });
  } catch {
    return null;
  }
}

export function asObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return new Types.ObjectId(id);
}

