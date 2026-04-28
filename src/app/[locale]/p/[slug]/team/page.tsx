"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BottomNav } from "@/components/MenuUI/BottomNav";
import { useAuth } from "@/components/providers/auth-provider";
import type { MenuPlace } from "@/components/MenuBuilder/types";

type MenuResponse = { place?: MenuPlace };

type TeamMember = {
  id: string;
  userId?: string;
  name: string;
  role: "Owner" | "Employee";
  email: string;
  note: string;
};

export default function TeamPage() {
  const params = useParams<{ slug: string; locale: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const locale = params.locale === "ru" || params.locale === "en" ? params.locale : "uz";
  const [place, setPlace] = useState<MenuPlace | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [infoMemberId, setInfoMemberId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [note, setNote] = useState("");
  const [ownerCandidate, setOwnerCandidate] = useState<TeamMember | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      setLoading(true);
      const headers: HeadersInit = {};
      if (firebaseUser) {
        try {
          headers.Authorization = `Bearer ${await firebaseUser.getIdToken()}`;
        } catch {}
      }
      try {
        const [menuRes, teamRes] = await Promise.all([
          fetch(`/api/places/${slug}/menu`, { headers }),
          fetch(`/api/places/${slug}/team`, { headers }),
        ]);
        if (menuRes.ok) {
          const menuData = (await menuRes.json()) as MenuResponse;
          if (menuData.place) setPlace(menuData.place);
        }
        if (teamRes.ok) {
          const teamData = (await teamRes.json()) as { members?: TeamMember[] };
          setMembers(Array.isArray(teamData.members) ? teamData.members : []);
        }
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [firebaseUser, slug]);

  const accentColor = place?.color?.trim() || "#f7906c";
  const infoMember = members.find((m) => m.id === infoMemberId) ?? null;

  async function addMember() {
    if (!firebaseUser) return;
    if (!newName.trim() || !newEmail.trim()) return;
    setActionError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/places/${slug}/team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to add");
      }
      const data = (await res.json()) as { member: TeamMember };
      setMembers((current) => [...current, data.member]);
      setNewName("");
      setNewEmail("");
      setAddOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add member";
      setActionError(message);
    }
  }

  async function saveInfo() {
    if (!firebaseUser || !infoMember) return;
    setActionError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/places/${slug}/team/${infoMember.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to save");
      }
      setMembers((current) =>
        current.map((member) => (member.id === infoMember.id ? { ...member, note } : member)),
      );
      setInfoMemberId(null);
      setNote("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save note";
      setActionError(message);
    }
  }

  async function removeMember(memberId: string) {
    if (!firebaseUser) return;
    setActionError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/places/${slug}/team/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to remove");
      }
      setMembers((current) => current.filter((entry) => entry.id !== memberId));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove member";
      setActionError(message);
    }
  }

  async function makeOwner(member: TeamMember) {
    if (!firebaseUser || member.role === "Owner") return;
    setActionError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/places/${slug}/team/${member.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ makeOwner: true }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to transfer ownership");
      }
      setOwnerCandidate(null);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to transfer ownership";
      setActionError(message);
    }
  }

  return (
    <div className="min-h-screen bg-[#ececea] text-neutral-900">
      <div className="mx-auto w-full max-w-[620px] px-4 pb-24 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-2 shadow-sm">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/p/${slug}/more`)}
            className="cursor-pointer text-2xl leading-none text-neutral-700"
          >
            ×
          </button>
          <p className="text-sm font-semibold tracking-wide text-neutral-700">{place?.name ?? "Restaurant"}</p>
          <div className="h-8 w-8 rounded-full bg-neutral-200" />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/p/${slug}/more`)}
            className="inline-flex cursor-pointer items-center gap-2 text-3xl font-semibold text-neutral-800"
          >
            <span aria-hidden>←</span>
            <span>Team</span>
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
            style={{ backgroundColor: accentColor }}
          >
            Add employee +
          </button>
        </div>

        {actionError ? <p className="mt-2 text-sm text-red-500">{actionError}</p> : null}
        {loading ? <p className="mt-2 text-sm text-neutral-500">Loading team...</p> : null}

        <div className="mt-4 space-y-3">
          {members.map((member) => (
            <div key={member.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-neutral-800">{member.name}</p>
                  <p className="text-sm text-neutral-500">{member.role}</p>
                  <p className="mt-1 text-sm text-neutral-700">{member.email}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setInfoMemberId(member.id);
                      setNote(member.note || "");
                    }}
                    className="mt-2 cursor-pointer rounded-lg bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-400"
                  >
                    Add information
                  </button>
                  {member.role !== "Owner" ? (
                    <button
                      type="button"
                      onClick={() => setOwnerCandidate(member)}
                      className="mt-2 block cursor-pointer rounded-lg bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-400"
                    >
                      Make owner
                    </button>
                  ) : null}
                </div>
                {member.role !== "Owner" ? (
                  <button
                    type="button"
                    onClick={() => void removeMember(member.id)}
                    className="cursor-pointer text-red-400"
                  >
                    🗑
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav locale={locale} slug={slug} active="more" accentColor={accentColor} />

      {addOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" onClick={() => setAddOpen(false)}>
          <div className="w-full max-w-[460px] rounded-3xl bg-white p-6" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-4xl font-semibold text-neutral-800">Add employee</h2>
            <div className="mt-4 space-y-3">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Name *"
                className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 outline-none"
              />
              <input
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="Email *"
                className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 outline-none"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="cursor-pointer rounded-xl bg-orange-50 px-6 py-2 font-semibold text-orange-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void addMember()}
                className="cursor-pointer rounded-xl px-6 py-2 font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {infoMember ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" onClick={() => setInfoMemberId(null)}>
          <div className="w-full max-w-[460px] rounded-3xl bg-white p-6" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-center text-4xl font-semibold text-neutral-800">Additional information</h2>
            <p className="mt-2 text-sm text-neutral-500">This will be visible to other employees</p>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-3 h-36 w-full resize-none rounded-xl bg-neutral-100 px-3 py-2.5 outline-none"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setInfoMemberId(null)}
                className="cursor-pointer rounded-xl bg-orange-50 px-6 py-2 font-semibold text-orange-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveInfo()}
                className="cursor-pointer rounded-xl px-6 py-2 font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {ownerCandidate ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" onClick={() => setOwnerCandidate(null)}>
          <div className="w-full max-w-[460px] rounded-3xl bg-white p-6" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-center text-4xl font-semibold text-neutral-800">Make owner</h2>
            <p className="mt-3 text-center text-sm text-neutral-500">
              Are you sure? This user will become the only owner of this establishment.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOwnerCandidate(null)}
                className="cursor-pointer rounded-xl bg-orange-50 px-6 py-2 font-semibold text-orange-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void makeOwner(ownerCandidate)}
                className="cursor-pointer rounded-xl px-6 py-2 font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

