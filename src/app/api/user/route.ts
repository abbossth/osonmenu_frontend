import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { connectToMongoDB } from "@/lib/mongodb";
import { UserModel } from "@/models/User";

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

function normalizeName(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function PATCH(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as { firstName?: string; lastName?: string };
    const firstName = normalizeName(body.firstName);
    const lastName = normalizeName(body.lastName);

    if (!firstName || !lastName || firstName.length < 2 || lastName.length < 2) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    let decoded: { uid: string };
    try {
      decoded = await getAdminAuth().verifyIdToken(token);
    } catch (error) {
      console.error("[API /api/user PATCH] Invalid Firebase token", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToMongoDB();
    const fullName = `${firstName} ${lastName}`;

    const updated = await UserModel.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      { firstName, lastName, fullName },
      { new: true },
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        _id: String(updated._id),
        firebaseUid: updated.firebaseUid,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        fullName: updated.fullName,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    console.error("[API /api/user PATCH] Failed to update user profile", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
