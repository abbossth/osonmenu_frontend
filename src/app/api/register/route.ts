import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { connectToMongoDB } from "@/lib/mongodb";
import { UserModel } from "@/models/User";

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minNameLength = 2;

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    const body = (await request.json()) as {
      email?: string;
      firebaseUid?: string;
      firstName?: string;
      lastName?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const firebaseUid = body.firebaseUid?.trim();
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();

    if (
      !email ||
      !firebaseUid ||
      !firstName ||
      !lastName ||
      firstName.length < minNameLength ||
      lastName.length < minNameLength ||
      !emailRegex.test(email)
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (decoded.uid !== firebaseUid || decoded.email?.toLowerCase() !== email) {
      return NextResponse.json({ error: "Token data mismatch" }, { status: 403 });
    }

    await connectToMongoDB();

    const existing = await UserModel.findOne({
      $or: [{ firebaseUid }, { email }],
    }).lean();

    if (existing) {
      return NextResponse.json(
        {
          user: {
            _id: String(existing._id),
            firebaseUid: existing.firebaseUid,
            email: existing.email,
            firstName: existing.firstName,
            lastName: existing.lastName,
            fullName: existing.fullName,
            stripeCustomerId: existing.stripeCustomerId || "",
            subscriptionStatus: existing.subscriptionStatus || "inactive",
            currentPlan: existing.currentPlan || "",
            currentPeriodEnd: existing.currentPeriodEnd || null,
            createdAt: existing.createdAt,
          },
        },
        { status: 200 },
      );
    }

    const created = await UserModel.create({ firebaseUid, email, firstName, lastName, fullName });

    return NextResponse.json(
      {
        user: {
          _id: String(created._id),
          firebaseUid: created.firebaseUid,
          email: created.email,
          firstName: created.firstName,
          lastName: created.lastName,
          fullName: created.fullName,
            stripeCustomerId: created.stripeCustomerId || "",
            subscriptionStatus: created.subscriptionStatus || "inactive",
            currentPlan: created.currentPlan || "",
            currentPeriodEnd: created.currentPeriodEnd || null,
          createdAt: created.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const isDuplicateKey =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "number" &&
      (error as { code: number }).code === 11000;

    if (isDuplicateKey) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    console.error("[API /api/register POST] Registration failed", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
