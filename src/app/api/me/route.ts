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

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    await connectToMongoDB();

    const user = await UserModel.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        _id: String(user._id),
        firebaseUid: user.firebaseUid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
