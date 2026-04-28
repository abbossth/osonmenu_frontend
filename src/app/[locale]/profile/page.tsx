"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/providers/auth-provider";
import type { AppUser } from "@/components/providers/auth-provider";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Tabs, type ProfileTab } from "@/components/Profile/Tabs";
import { ProfileInfo } from "@/components/Profile/ProfileInfo";
import { ChangePassword } from "@/components/Profile/ChangePassword";
import { PlacesList } from "@/components/Places/PlacesList";
import { AddPlaceModal } from "@/components/Places/AddPlaceModal";
import type { Place } from "@/components/Places/PlaceCard";
import { updateProfile } from "firebase/auth";

type CreatePlacePayload = {
  name: string;
  slug: string;
  currency: "UZS" | "USD";
  language: "uz" | "ru" | "en";
};

class CreatePlaceError extends Error {
  constructor(public code: "duplicate_slug" | "generic") {
    super(code);
  }
}

export default function ProfilePage() {
  const t = useTranslations("ProfilePanel");
  const { firebaseUser, appUser, loading, logout, setAppUserData } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("places");
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesScope, setPlacesScope] = useState<"own" | "shared">("own");
  const [allSlugs, setAllSlugs] = useState<string[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const domain = typeof window === "undefined" ? "yourdomain.com" : window.location.host;
  const existingSlugs = useMemo(() => allSlugs, [allSlugs]);
  const ownPlaces = useMemo(() => {
    if (!firebaseUser?.uid) return [];
    return places.filter((place) => (place.ownerId || place.userId) === firebaseUser.uid);
  }, [firebaseUser?.uid, places]);
  const sharedPlaces = useMemo(() => {
    if (!firebaseUser?.uid) return places;
    return places.filter((place) => (place.ownerId || place.userId) !== firebaseUser.uid);
  }, [firebaseUser?.uid, places]);
  const scopedPlaces = placesScope === "own" ? ownPlaces : sharedPlaces;
  const fallbackProfileUser = useMemo<AppUser | null>(() => {
    if (appUser) return appUser;
    if (!firebaseUser?.uid || !firebaseUser.email) return null;

    const trimmedDisplayName = firebaseUser.displayName?.trim() ?? "";
    const nameParts = trimmedDisplayName ? trimmedDisplayName.split(/\s+/) : [];
    const firstName = nameParts[0] ?? firebaseUser.email.split("@")[0] ?? "User";
    const lastName = nameParts.slice(1).join(" ") || "User";

    return {
      _id: firebaseUser.uid,
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      createdAt: new Date(0).toISOString(),
    };
  }, [appUser, firebaseUser]);

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/auth/login");
    }
  }, [firebaseUser, loading, router]);

  useEffect(() => {
    async function fetchPlaces() {
      if (!firebaseUser) {
        setPlaces([]);
        setAllSlugs([]);
        setPlacesLoading(false);
        return;
      }
      try {
        const token = await firebaseUser.getIdToken();
        const [placesRes, slugsRes] = await Promise.all([
          fetch("/api/places", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/places?scope=slugs", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const placesData = (await placesRes.json()) as { places: Place[] };
        const slugsData = (await slugsRes.json()) as { slugs: string[] };
        setPlaces(placesData.places ?? []);
        setAllSlugs(slugsData.slugs ?? []);
      } finally {
        setPlacesLoading(false);
      }
    }
    void fetchPlaces();
  }, [firebaseUser]);

  useEffect(() => {
    if (placesLoading) return;
    if (typeof window === "undefined") return;
    const shouldOpen = window.sessionStorage.getItem("openCreatePlaceModal") === "1";
    if (!shouldOpen) return;
    window.sessionStorage.removeItem("openCreatePlaceModal");
    setActiveTab("places");
    setModalOpen(true);
  }, [placesLoading]);

  async function createPlace(payload: CreatePlacePayload) {
    if (!firebaseUser) throw new Error("Unauthorized");

    const optimisticPlace: Place = {
      _id: `temp-${Date.now()}`,
      ownerId: firebaseUser.uid,
      userId: firebaseUser.uid,
      name: payload.name,
      slug: payload.slug,
      currency: payload.currency,
      language: payload.language,
      createdAt: new Date().toISOString(),
    };

    setPlaces((prev) => [optimisticPlace, ...prev]);

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 409) {
          throw new CreatePlaceError("duplicate_slug");
        }
        throw new CreatePlaceError("generic");
      }

      const data = (await res.json()) as { place: Place };
      setPlaces((prev) => prev.map((item) => (item._id === optimisticPlace._id ? data.place : item)));
      return data.place;
    } catch (error) {
      setPlaces((prev) => prev.filter((item) => item._id !== optimisticPlace._id));
      if (error instanceof CreatePlaceError) {
        throw error;
      }
      throw new CreatePlaceError("generic");
    }
  }

  async function updateUserProfile(payload: { firstName: string; lastName: string }) {
    if (!firebaseUser) {
      throw new Error("Unauthorized");
    }

    const token = await firebaseUser.getIdToken();
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to update profile");
    }

    const data = (await res.json()) as { user: AppUser };
    const updatedUser = data.user;
    setAppUserData(updatedUser);
    await updateProfile(firebaseUser, { displayName: updatedUser.fullName });
    return updatedUser;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">{t("title")}</h1>
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            placesLabel={t("tabs.places")}
            profileLabel={t("tabs.profile")}
          />
        </div>

        <div className="mt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activeTab === "places" ? (
                placesLoading ? (
                  <div className="space-y-4">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("places.loading")}</p>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="animate-pulse rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                        >
                          <div className="h-5 w-40 rounded bg-neutral-200 dark:bg-neutral-700" />
                          <div className="mt-4 space-y-2">
                            <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
                            <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
                            <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
                            <div className="h-4 w-1/3 rounded bg-neutral-200 dark:bg-neutral-700" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="inline-flex rounded-full border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
                      <button
                        type="button"
                        onClick={() => setPlacesScope("own")}
                        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                          placesScope === "own"
                            ? "bg-orange-500 text-white"
                            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        }`}
                      >
                        {t("places.tabs.own")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlacesScope("shared")}
                        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                          placesScope === "shared"
                            ? "bg-orange-500 text-white"
                            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        }`}
                      >
                        {t("places.tabs.shared")}
                      </button>
                    </div>
                    <PlacesList
                      title={placesScope === "own" ? t("places.titleOwn") : t("places.titleShared")}
                      addButton={t("places.add")}
                      emptyText={placesScope === "own" ? t("places.empty") : t("places.emptyShared")}
                      places={scopedPlaces}
                      onAddClick={() => setModalOpen(true)}
                      showAddButton={placesScope === "own"}
                      labels={{
                        url: t("establishment.url"),
                        currency: t("establishment.currency"),
                        language: t("establishment.language"),
                        createdAt: t("establishment.createdAt"),
                        editMenu: t("establishment.editMenu"),
                      }}
                      domain={domain}
                    />
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                    <ProfileInfo
                      key={appUser?._id ?? firebaseUser?.uid ?? "profile-form"}
                      title={t("profile.userData")}
                      firstNameLabel={t("profile.firstName")}
                      lastNameLabel={t("profile.lastName")}
                      emailLabel={t("profile.email")}
                      saveLabel={t("profile.save")}
                      successLabel={t("profile.success")}
                      unsavedLabel={t("profile.unsaved")}
                      requiredError={t("errors.requiredField")}
                      minNameError={t("errors.minName")}
                      genericError={t("errors.generic")}
                      user={fallbackProfileUser}
                      onSave={updateUserProfile}
                    />
                    <ChangePassword
                      title={t("profile.changePassword")}
                      newPasswordLabel={t("profile.newPassword")}
                      confirmPasswordLabel={t("profile.confirmPassword")}
                      newPasswordPlaceholder={t("profile.newPasswordPlaceholder")}
                      confirmPasswordPlaceholder={t("profile.confirmPasswordPlaceholder")}
                      showPasswordLabel={t("profile.showPassword")}
                      hidePasswordLabel={t("profile.hidePassword")}
                      updateButton={t("profile.updatePassword")}
                      minLengthError={t("errors.passwordMin")}
                      mismatchError={t("errors.passwordMismatch")}
                      successMessage={t("profile.passwordUpdated")}
                      genericError={t("errors.generic")}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={loggingOut}
                      onClick={async () => {
                        try {
                          setLoggingOut(true);
                          await logout();
                          router.replace("/auth/login");
                        } finally {
                          setLoggingOut(false);
                        }
                      }}
                      className="inline-flex rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      {loggingOut ? "..." : t("profile.logout")}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AddPlaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={createPlace}
        existingSlugs={existingSlugs}
        labels={{
          title: t("places.modal.title"),
          name: t("establishment.name"),
          slug: "Qisqa nom",
          currency: t("establishment.currency"),
          language: t("establishment.language"),
          save: t("places.modal.save"),
          cancel: t("places.modal.cancel"),
          required: t("errors.requiredField"),
          invalidSlug: "Qisqa nom faqat kichik harf, raqam va chiziqcha bilan yozilsin",
          duplicateSlug: "Bu qisqa nom band, boshqa nom kiriting",
          genericError: t("errors.generic"),
          success: t("places.modal.success"),
          urlPrefix: `${domain}/p/`,
        }}
      />
    </div>
  );
}
