"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BottomNav } from "@/components/MenuUI/BottomNav";
import { HeaderUserBadge } from "@/components/MenuUI/HeaderUserBadge";
import { useAuth } from "@/components/providers/auth-provider";
import type { MenuPlace } from "@/components/MenuBuilder/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faChevronDown, faTrashCan, faXmark } from "@fortawesome/free-solid-svg-icons";

type MenuResponse = { place?: MenuPlace };
type LocaleCode = "uz" | "ru" | "en";
const LOCALES: LocaleCode[] = ["uz", "ru", "en"];

export default function ComponentsLocalesPage() {
  const t = useTranslations("ProfilePanel.menuBuilder.components");
  const params = useParams<{ slug: string; locale: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const locale = params.locale === "ru" || params.locale === "en" ? params.locale : "uz";
  const [place, setPlace] = useState<MenuPlace | null>(null);
  const [primary, setPrimary] = useState<LocaleCode>("uz");
  const [enabled, setEnabled] = useState<LocaleCode[]>(["uz"]);
  const [initialPrimary, setInitialPrimary] = useState<LocaleCode>("uz");
  const [initialEnabled, setInitialEnabled] = useState<LocaleCode[]>(["uz"]);
  const [candidateToAdd, setCandidateToAdd] = useState<LocaleCode>("ru");
  const [removeTarget, setRemoveTarget] = useState<LocaleCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const authorizedFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const token = firebaseUser ? await firebaseUser.getIdToken() : "";
      return fetch(input, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init.headers ?? {}),
        },
      });
    },
    [firebaseUser],
  );

  useEffect(() => {
    async function load() {
      if (!slug) return;
      const res = await authorizedFetch(`/api/places/${slug}/menu`);
      if (!res.ok) return;
      const data = (await res.json()) as MenuResponse;
      if (!data.place) return;
      const loadedPrimary = data.place.language;
      const loadedEnabledRaw = (data.place.enabledLanguages as string[] | undefined) ?? ["uz"];
      const loadedEnabled = loadedEnabledRaw.filter(
        (entry): entry is LocaleCode => entry === "uz" || entry === "ru" || entry === "en",
      );
      const safeEnabled: LocaleCode[] = loadedEnabled.length ? loadedEnabled : ["uz"];
      setPlace(data.place);
      setPrimary(loadedPrimary);
      setEnabled(safeEnabled);
      setInitialPrimary(loadedPrimary);
      setInitialEnabled(safeEnabled);
      setCandidateToAdd(LOCALES.find((entry) => !safeEnabled.includes(entry)) ?? "ru");
    }
    void load();
  }, [slug, authorizedFetch]);

  const accentColor = place?.color?.trim() || "#f7906c";
  const localeLabel = useMemo(
    () => ({
      uz: "Uzbek (O'zbek)",
      ru: "Russian (Русский)",
      en: "English (English)",
    }),
    [],
  );
  const addableLocales = useMemo(() => LOCALES.filter((entry) => !enabled.includes(entry)), [enabled]);
  const hasChanges = useMemo(() => {
    const current = [...enabled].sort().join(",");
    const baseline = [...initialEnabled].sort().join(",");
    return primary !== initialPrimary || current !== baseline;
  }, [enabled, initialEnabled, initialPrimary, primary]);

  async function persistLocales(nextPrimary: LocaleCode, nextEnabled: LocaleCode[]) {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    const res = await authorizedFetch("/api/components/locales", {
      method: "PATCH",
      body: JSON.stringify({ slug, language: nextPrimary, enabledLanguages: nextEnabled }),
    });
    if (!res.ok) {
      setSaveError(t("locales.saveError"));
      setSaving(false);
      return false;
    }
    setPrimary(nextPrimary);
    setEnabled(nextEnabled);
    setInitialPrimary(nextPrimary);
    setInitialEnabled(nextEnabled);
    setCandidateToAdd(LOCALES.find((entry) => !nextEnabled.includes(entry)) ?? "ru");
    setSaveSuccess(true);
    setSaving(false);
    return true;
  }

  function addLanguage() {
    if (!addableLocales.includes(candidateToAdd) || saving) return;
    const nextEnabled = enabled.includes(candidateToAdd) ? enabled : [...enabled, candidateToAdd];
    void persistLocales(primary, nextEnabled);
  }

  function setAsPrimary(nextPrimary: LocaleCode) {
    if (saving) return;
    const nextEnabled = enabled.includes(nextPrimary) ? enabled : [...enabled, nextPrimary];
    void persistLocales(nextPrimary, nextEnabled);
  }

  function removeLanguage(code: LocaleCode) {
    if (code === primary || saving) return;
    const nextEnabled = enabled.filter((entry) => entry !== code);
    void persistLocales(primary, nextEnabled);
    setRemoveTarget(null);
  }

  async function saveLocales() {
    if (!hasChanges || saving) return;
    await persistLocales(primary, enabled);
  }

  return (
    <div className="min-h-screen bg-[#ececea] text-neutral-900">
      <div className="mx-auto w-full max-w-[620px] px-4 pb-24 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-2 shadow-sm">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/p/${slug}/components`)}
            className="cursor-pointer text-2xl leading-none text-neutral-700"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-base" />
          </button>
          <p className="text-sm font-semibold tracking-wide text-neutral-700">{place?.name ?? "Restaurant"}</p>
          <HeaderUserBadge firebaseUser={firebaseUser} ownerId={place?.ownerId} accentColor={accentColor} />
        </div>

        <h1 className="mt-5 text-2xl font-semibold text-neutral-800">{t("sections.locales")}</h1>

        <div className="mt-4 space-y-4">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="space-y-3">
              {enabled.map((code) => (
                <div key={code} className="flex items-center justify-between gap-3 rounded-xl px-2 py-1">
                  <p className="text-lg font-medium text-neutral-800">{localeLabel[code]}</p>
                  <div className="flex items-center gap-2">
                    {primary === code ? (
                      <span className="rounded-lg px-3 py-1 text-xs font-semibold text-neutral-700">{t("locales.mainLanguage")}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAsPrimary(code)}
                        className="rounded-lg bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-500 transition hover:bg-orange-200"
                      >
                        {t("locales.makePrimary")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(code)}
                      disabled={code === primary}
                      className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={t("locales.remove")}
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <h3 className="text-xl font-semibold text-neutral-800">{t("locales.addAnother")}</h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="relative flex-1">
                <select
                  value={candidateToAdd}
                  onChange={(event) => setCandidateToAdd(event.target.value as LocaleCode)}
                  disabled={addableLocales.length === 0 || saving}
                  className="w-full appearance-none rounded-xl bg-neutral-100 px-4 py-3 pr-10 text-sm text-neutral-700 outline-none disabled:opacity-40"
                >
                  {addableLocales.length ? (
                    addableLocales.map((entry) => (
                      <option key={entry} value={entry}>
                        {localeLabel[entry]}
                      </option>
                    ))
                  ) : (
                    <option value={candidateToAdd}>{t("locales.noMoreLanguages")}</option>
                  )}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                </span>
              </div>
              <button
                type="button"
                onClick={addLanguage}
                disabled={addableLocales.length === 0 || saving}
                className="rounded-xl bg-orange-100 px-4 py-3 text-sm font-semibold text-orange-500 transition hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("locales.addLanguage")}
              </button>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => void saveLocales()}
              disabled={!hasChanges || saving}
              className="cursor-pointer rounded-xl px-7 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: accentColor }}
            >
              {saving ? "..." : t("actions.save")}
            </button>
            {hasChanges ? <p className="mt-2 text-xs text-neutral-500">{t("locales.unsaved")}</p> : null}
            {saveSuccess ? <p className="mt-2 text-xs font-medium text-emerald-600">{t("locales.saved")}</p> : null}
            {saveError ? <p className="mt-2 text-xs font-medium text-red-600">{saveError}</p> : null}
          </div>
        </div>

        {removeTarget ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRemoveTarget(null)}>
            <div className="w-full max-w-[430px] rounded-3xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-semibold text-neutral-900">{t("locales.removeTitle", { language: localeLabel[removeTarget] })}</h3>
                <button
                  type="button"
                  onClick={() => setRemoveTarget(null)}
                  className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              <p className="mt-3 text-sm text-neutral-600">{t("locales.removeDescription")}</p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRemoveTarget(null)}
                  className="rounded-xl bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-500"
                >
                  {t("locales.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => removeLanguage(removeTarget)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {t("locales.remove")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <BottomNav locale={locale} slug={slug} active="components" accentColor={accentColor} />
    </div>
  );
}

