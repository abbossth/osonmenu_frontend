import { NextRequest, NextResponse } from "next/server";
import { connectToMongoDB } from "@/lib/mongodb";
import { EstablishmentModel } from "@/models/Establishment";
import { normalizeSlug, verifyUser } from "@/app/api/_utils/menu-builder";
import { getAdminAuth } from "@/lib/firebase-admin";

type Params = { params: Promise<{ slug: string; memberId: string }> };
type PersistedTeamMember = {
  id: string;
  userId?: string;
  name?: string;
  email?: string;
  role?: "employee";
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

function emailCondition(email: string) {
  const normalized = email.trim().toLowerCase();
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { $regex: `^${escaped}$`, $options: "i" };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const authUser = await verifyUser(request);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const routeParams = await params;
    const slug = normalizeSlug(routeParams.slug);
    const memberId = normalizeString(decodeURIComponent(routeParams.memberId));
    if (!slug || !memberId) return NextResponse.json({ error: "Invalid params" }, { status: 400 });

    await connectToMongoDB();
    const collection = EstablishmentModel.collection;
    const place = await collection.findOne({
      slug,
      $or: [
        { ownerId: authUser.uid },
        { userId: authUser.uid },
        { "teamMembers.userId": authUser.uid },
        ...(authUser.email ? [{ "teamMembers.email": emailCondition(authUser.email) }] : []),
      ],
    }, { sort: { createdAt: 1 } });
    if (!place) return NextResponse.json({ error: "Establishment not found" }, { status: 404 });

    const ownerUid = place.ownerId || place.userId;
    const body = (await request.json()) as { note?: string; makeOwner?: boolean };
    if (memberId === "owner") {
      const note = normalizeString(body.note);
      await collection.updateOne({ _id: place._id }, { $set: { ownerNote: note } });
      return NextResponse.json({ ok: true });
    }

    const members: PersistedTeamMember[] = Array.isArray(place.teamMembers) ? (place.teamMembers as PersistedTeamMember[]) : [];
    const { normalized: normalizedMembers, changed } = normalizeMembers(members);
    if (changed) {
      await collection.updateOne({ _id: place._id }, { $set: { teamMembers: normalizedMembers } });
    }
    const targetMember = normalizedMembers.find((member) => {
      const email = member.email?.toLowerCase() || "";
      const userId = member.userId || "";
      return member.id === memberId || email === memberId.toLowerCase() || userId === memberId;
    });
    if (!targetMember) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const canEdit =
      authUser.uid === ownerUid ||
      (targetMember.userId && targetMember.userId === authUser.uid) ||
      (authUser.email && targetMember.email?.toLowerCase() === authUser.email);
    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (body.makeOwner) {
      let targetUserId = targetMember.userId || "";
      if (!targetUserId && targetMember.email) {
        try {
          const user = await getAdminAuth().getUserByEmail(targetMember.email);
          targetUserId = user.uid;
        } catch {
          targetUserId = "";
        }
      }

      if (!targetUserId) {
        return NextResponse.json(
          { error: "Employee account not found. User must register first." },
          { status: 400 },
        );
      }

      let previousOwnerEmail = "";
      let previousOwnerName = "";
      try {
        const previousOwner = await getAdminAuth().getUser(ownerUid);
        previousOwnerEmail = previousOwner.email?.toLowerCase() || "";
        previousOwnerName =
          previousOwner.displayName?.trim() ||
          previousOwner.email?.split("@")[0] ||
          "Employee";
      } catch {
        previousOwnerEmail = authUser.email || "";
        previousOwnerName = authUser.email?.split("@")[0] || "Employee";
      }

      const previousOwnerAsMember: PersistedTeamMember = {
        id: `member-${ownerUid}`,
        userId: ownerUid,
        name: previousOwnerName,
        email: previousOwnerEmail,
        role: "employee",
        note: "",
        createdAt: new Date(),
      };

      const withoutNewOwner = normalizedMembers.filter(
        (member) => member.id !== targetMember.id && member.userId !== targetUserId,
      );
      const previousOwnerIndex = withoutNewOwner.findIndex(
        (member) =>
          member.userId === ownerUid ||
          (previousOwnerEmail && (member.email || "").toLowerCase() === previousOwnerEmail),
      );
      const nextMembers = [...withoutNewOwner];
      if (previousOwnerIndex >= 0) {
        nextMembers[previousOwnerIndex] = {
          ...nextMembers[previousOwnerIndex],
          id: nextMembers[previousOwnerIndex].id || previousOwnerAsMember.id,
          userId: ownerUid,
          name: nextMembers[previousOwnerIndex].name || previousOwnerAsMember.name,
          email: nextMembers[previousOwnerIndex].email || previousOwnerAsMember.email,
          role: "employee",
        };
      } else {
        nextMembers.push(previousOwnerAsMember);
      }

      await collection.updateOne(
        { _id: place._id },
        {
          $set: {
            ownerId: targetUserId,
            userId: targetUserId,
            teamMembers: nextMembers,
          },
        },
      );
      return NextResponse.json({ ok: true, ownerId: targetUserId });
    }

    const note = normalizeString(body.note);
    await collection.updateOne(
      { _id: place._id },
      {
        $set: {
          teamMembers: normalizedMembers.map((member) =>
            member.id === targetMember.id ? { ...member, note } : member,
          ),
        },
      },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /api/places/[slug]/team/[memberId] PATCH] Failed", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const authUser = await verifyUser(request);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const routeParams = await params;
    const slug = normalizeSlug(routeParams.slug);
    const memberId = normalizeString(decodeURIComponent(routeParams.memberId));
    if (!slug || !memberId) return NextResponse.json({ error: "Invalid params" }, { status: 400 });

    await connectToMongoDB();
    const collection = EstablishmentModel.collection;
    const place = await collection.findOne({
      slug,
      $or: [
        { ownerId: authUser.uid },
        { userId: authUser.uid },
        { "teamMembers.userId": authUser.uid },
        ...(authUser.email ? [{ "teamMembers.email": emailCondition(authUser.email) }] : []),
      ],
    }, { sort: { createdAt: 1 } });
    if (!place) return NextResponse.json({ error: "No access to remove members" }, { status: 403 });

    const members: PersistedTeamMember[] = Array.isArray(place.teamMembers) ? (place.teamMembers as PersistedTeamMember[]) : [];
    const { normalized: normalizedMembers, changed } = normalizeMembers(members);
    const targetMember = normalizedMembers.find((member) => {
      const email = member.email?.toLowerCase() || "";
      const userId = member.userId || "";
      return member.id === memberId || email === memberId.toLowerCase() || userId === memberId;
    });
    if (!targetMember) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    if (changed) {
      await collection.updateOne({ _id: place._id }, { $set: { teamMembers: normalizedMembers } });
    }
    await collection.updateOne(
      { _id: place._id },
      { $set: { teamMembers: normalizedMembers.filter((member) => member.id !== targetMember.id) } },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /api/places/[slug]/team/[memberId] DELETE] Failed", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}

