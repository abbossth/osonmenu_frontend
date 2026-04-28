import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { connectToMongoDB } from "@/lib/mongodb";
import { EstablishmentModel } from "@/models/Establishment";
import { normalizeSlug, verifyUser } from "@/app/api/_utils/menu-builder";

type Params = { params: Promise<{ slug: string }> };
type PersistedTeamMember = {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: "employee";
  note?: string;
  createdAt?: Date;
};

function toStableMemberId(member: PersistedTeamMember, index: number) {
  const seed = (member.userId || member.email || `${index}`).toLowerCase();
  const normalized = seed.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `member-${normalized || index}`;
}

function normalizeMembers(members: PersistedTeamMember[]) {
  let changed = false;
  const normalized = members.map((member, index) => {
    const currentId = typeof member.id === "string" ? member.id.trim() : "";
    if (currentId) return member;
    changed = true;
    return { ...member, id: toStableMemberId(member, index) };
  });
  return { normalized, changed };
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toMemberResponse(member: {
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
  role?: "employee";
  note?: string;
  createdAt?: Date;
}) {
  return {
    id: member.id || "",
    userId: member.userId || "",
    name: member.name || "",
    email: member.email || "",
    role: "Employee" as const,
    note: member.note || "",
    createdAt: member.createdAt ?? new Date(),
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authUser = await verifyUser(request);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const routeParams = await params;
    const slug = normalizeSlug(routeParams.slug);
    if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

    await connectToMongoDB();
    const collection = EstablishmentModel.collection;
    const place = await collection.findOne({
      slug,
      $or: [
        { ownerId: authUser.uid },
        { userId: authUser.uid },
        { "teamMembers.userId": authUser.uid },
        ...(authUser.email ? [{ "teamMembers.email": authUser.email }] : []),
      ],
    }, { sort: { createdAt: 1 } });
    if (!place) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });

    const ownerUid = place.ownerId || place.userId;
    const isOwner = ownerUid === authUser.uid;
    let ownerEmail = "";
    try {
      const owner = await getAdminAuth().getUser(ownerUid);
      ownerEmail = owner.email || "";
    } catch {}

    const members: PersistedTeamMember[] = Array.isArray(place.teamMembers) ? (place.teamMembers as PersistedTeamMember[]) : [];
    const { normalized: normalizedMembers, changed } = normalizeMembers(members);
    if (changed) {
      await collection.updateOne({ _id: place._id }, { $set: { teamMembers: normalizedMembers } });
    }

    return NextResponse.json({
      isOwner,
      members: [
        {
          id: "owner",
          userId: ownerUid,
          name: typeof place.name === "string" ? place.name : "Owner",
          email: ownerEmail,
          role: "Owner" as const,
          note: typeof place.ownerNote === "string" ? place.ownerNote : "",
        },
        ...normalizedMembers.map(toMemberResponse),
      ],
    });
  } catch (error) {
    console.error("[API /api/places/[slug]/team GET] Failed", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const authUser = await verifyUser(request);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const routeParams = await params;
    const slug = normalizeSlug(routeParams.slug);
    if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

    const body = (await request.json()) as { name?: string; email?: string };
    const name = normalizeString(body.name);
    const email = normalizeString(body.email).toLowerCase();
    if (!name || !email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await connectToMongoDB();
    const collection = EstablishmentModel.collection;
    const place = await collection.findOne({
      slug,
      $or: [
        { ownerId: authUser.uid },
        { userId: authUser.uid },
        { "teamMembers.userId": authUser.uid },
        ...(authUser.email ? [{ "teamMembers.email": authUser.email }] : []),
      ],
    }, { sort: { createdAt: 1 } });
    if (!place) return NextResponse.json({ error: "No access to add members" }, { status: 403 });

    const existingMembers: PersistedTeamMember[] = Array.isArray(place.teamMembers) ? (place.teamMembers as PersistedTeamMember[]) : [];
    const { normalized: normalizedMembers, changed } = normalizeMembers(existingMembers);
    const membersForCheck = changed ? normalizedMembers : existingMembers;
    if (changed) {
      await collection.updateOne({ _id: place._id }, { $set: { teamMembers: normalizedMembers } });
    }
    let memberUserId = "";
    try {
      const userRecord = await getAdminAuth().getUserByEmail(email);
      memberUserId = userRecord.uid;
    } catch {
      return NextResponse.json({ error: "Employee account not found. User must register first." }, { status: 400 });
    }

    const duplicated = membersForCheck.some((member) => {
      const memberEmail = member.email?.toLowerCase() || "";
      const byEmail = memberEmail === email;
      const byUid = Boolean(memberUserId && member.userId === memberUserId);
      return byEmail || byUid;
    });
    if (duplicated) {
      return NextResponse.json({ error: "Member already exists" }, { status: 409 });
    }

    const createdMember: PersistedTeamMember = {
      id: `member-${Date.now()}`,
      userId: memberUserId,
      name,
      email,
      role: "employee",
      note: "",
      createdAt: new Date(),
    };

    await collection.updateOne({ _id: place._id }, { $push: { teamMembers: createdMember } } as never);

    const updatedPlace = await collection.findOne({ _id: place._id }, { projection: { teamMembers: 1 } });
    const updatedMembers: PersistedTeamMember[] = Array.isArray(updatedPlace?.teamMembers)
      ? (updatedPlace.teamMembers as PersistedTeamMember[])
      : [];
    const persisted =
      updatedMembers.find((member) => member.id === createdMember.id) ??
      updatedMembers.find((member) => member.email?.toLowerCase() === email) ??
      createdMember;

    return NextResponse.json({ member: toMemberResponse(persisted) }, { status: 201 });
  } catch (error) {
    console.error("[API /api/places/[slug]/team POST] Failed", error);
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
  }
}

