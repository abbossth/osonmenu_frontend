"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useTranslations } from "next-intl";
import { getFirebaseAuth } from "@/lib/firebase";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";

type AuthMode = "login" | "register";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapFirebaseError(code: string, t: ReturnType<typeof useTranslations>) {
  if (code === "auth/invalid-email") return t("errors.invalidEmail");
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return t("errors.invalidCredentials");
  }
  if (code === "auth/email-already-in-use") return t("errors.emailInUse");
  if (code === "auth/weak-password") return t("errors.weakPassword");
  return t("errors.generic");
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();

  const isRegister = mode === "register";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && firebaseUser) {
      router.replace("/profile");
    }
  }, [firebaseUser, loading, router]);

  const firstNameValue = firstName.trim();
  const lastNameValue = lastName.trim();
  const emailValue = email.trim().toLowerCase();

  const firstNameError =
    !isRegister || !touched.firstName
      ? null
      : !firstNameValue
        ? t("errors.requiredField")
        : firstNameValue.length < 2
          ? t("errors.minName")
          : null;
  const lastNameError =
    !isRegister || !touched.lastName
      ? null
      : !lastNameValue
        ? t("errors.requiredField")
        : lastNameValue.length < 2
          ? t("errors.minName")
          : null;
  const emailError =
    !touched.email
      ? null
      : !emailValue
        ? t("errors.requiredEmail")
        : !emailRegex.test(emailValue)
          ? t("errors.invalidEmail")
          : null;
  const passwordError =
    !touched.password
      ? null
      : !password
        ? t("errors.requiredPassword")
        : password.length < 6
          ? t("errors.weakPassword")
          : null;
  const confirmPasswordError =
    !isRegister || !touched.confirmPassword
      ? null
      : !confirmPassword
        ? t("errors.requiredField")
        : confirmPassword !== password
          ? t("errors.passwordMismatch")
          : null;

  const passwordStrength = useMemo(() => {
    if (!isRegister || !password) return "";
    if (password.length < 6) return t("passwordStrengthWeak");
    const hasMixed = /[A-Z]/.test(password) && /\d/.test(password);
    if (password.length >= 10 && hasMixed) return t("passwordStrengthStrong");
    return t("passwordStrengthMedium");
  }, [isRegister, password, t]);

  const heading = isRegister ? t("registerTitle") : t("loginTitle");
  const submitLabel = isRegister ? t("registerCta") : t("loginCta");
  const switchLabel = isRegister ? t("haveAccount") : t("noAccount");
  const switchLinkLabel = isRegister ? t("goToLogin") : t("goToRegister");
  const switchHref = isRegister ? "/auth/login" : "/auth/register";
  const passwordHint = isRegister ? t("passwordHint") : null;

  const hasFieldErrors = Boolean(
    emailError ||
      passwordError ||
      (isRegister && (firstNameError || lastNameError || confirmPasswordError)),
  );
  const isDisabled = submitting || loading;
  const hasRequiredValues = isRegister
    ? Boolean(firstNameValue && lastNameValue && emailValue && password && confirmPassword)
    : Boolean(emailValue && password);
  const canSubmit = !isDisabled && !hasFieldErrors && hasRequiredValues;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (isRegister && (!firstNameValue || !lastNameValue)) {
      setFormError(t("errors.requiredField"));
      return;
    }
    if (isRegister && (firstNameValue.length < 2 || lastNameValue.length < 2)) {
      setFormError(t("errors.minName"));
      return;
    }
    if (!emailValue) {
      setFormError(t("errors.requiredEmail"));
      return;
    }
    if (!emailRegex.test(emailValue)) {
      setFormError(t("errors.invalidEmail"));
      return;
    }
    if (!password) {
      setFormError(t("errors.requiredPassword"));
      return;
    }
    if (password.length < 6) {
      setFormError(t("errors.weakPassword"));
      return;
    }
    if (isRegister && confirmPassword !== password) {
      setFormError(t("errors.passwordMismatch"));
      return;
    }

    try {
      setSubmitting(true);

      if (isRegister) {
        const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), emailValue, password);
        const fullName = `${firstNameValue} ${lastNameValue}`;
        await updateProfile(credential.user, { displayName: fullName });
        const idToken = await credential.user.getIdToken();

        const res = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            email: emailValue,
            firebaseUid: credential.user.uid,
            firstName: firstNameValue,
            lastName: lastNameValue,
          }),
        });

        if (!res.ok) {
          throw new Error("register-api-failed");
        }

        setSuccessMessage(t("registerSuccess"));
        setTimeout(() => router.replace("/profile"), 1000);
        return;
      }

      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), emailValue, password);
      await credential.user.getIdToken();
      router.replace("/profile");
    } catch (err: unknown) {
      const code =
        typeof err === "object" && err && "code" in err && typeof err.code === "string"
          ? err.code
          : "unknown";
      setFormError(mapFirebaseError(code, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">{heading}</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{t("subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {isRegister ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t("firstName")}
              </label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, firstName: true }))}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:scale-[1.01] focus:ring-2 dark:bg-neutral-900 dark:text-white ${
                  firstNameError
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
                    : "border-neutral-300 focus:border-orange-500 focus:ring-orange-500/20 dark:border-neutral-700"
                }`}
                disabled={isDisabled}
              />
              {firstNameError ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{firstNameError}</p> : null}
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t("lastName")}
              </label>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, lastName: true }))}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:scale-[1.01] focus:ring-2 dark:bg-neutral-900 dark:text-white ${
                  lastNameError
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
                    : "border-neutral-300 focus:border-orange-500 focus:ring-orange-500/20 dark:border-neutral-700"
                }`}
                disabled={isDisabled}
              />
              {lastNameError ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{lastNameError}</p> : null}
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:scale-[1.01] focus:ring-2 dark:bg-neutral-900 dark:text-white ${
              emailError
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
                : "border-neutral-300 focus:border-orange-500 focus:ring-orange-500/20 dark:border-neutral-700"
            }`}
            placeholder="name@example.com"
            disabled={isDisabled}
          />
          {emailError ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{emailError}</p> : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t("password")}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              className={`w-full rounded-lg border bg-white px-3 py-2 pr-16 text-sm text-neutral-900 outline-none transition focus:scale-[1.01] focus:ring-2 dark:bg-neutral-900 dark:text-white ${
                passwordError
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
                  : "border-neutral-300 focus:border-orange-500 focus:ring-orange-500/20 dark:border-neutral-700"
              }`}
              placeholder="••••••••"
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {showPassword ? t("hidePassword") : t("showPassword")}
            </button>
          </div>
          {passwordError ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{passwordError}</p> : null}
          {passwordHint ? <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{passwordHint}</p> : null}
          {isRegister && passwordStrength ? <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">{passwordStrength}</p> : null}
        </div>

        {isRegister ? (
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t("confirmPassword")}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                className={`w-full rounded-lg border bg-white px-3 py-2 pr-16 text-sm text-neutral-900 outline-none transition focus:scale-[1.01] focus:ring-2 dark:bg-neutral-900 dark:text-white ${
                  confirmPasswordError
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
                    : "border-neutral-300 focus:border-orange-500 focus:ring-orange-500/20 dark:border-neutral-700"
                }`}
                placeholder="••••••••"
                disabled={isDisabled}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {showConfirmPassword ? t("hidePassword") : t("showPassword")}
              </button>
            </div>
            {confirmPasswordError ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{confirmPasswordError}</p> : null}
          </div>
        ) : null}

        {formError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {formError}
          </div>
        ) : null}
        {successMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            {successMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" className="opacity-25" stroke="currentColor" strokeWidth="3" />
                <path d="M22 12a10 10 0 00-10-10" className="opacity-90" stroke="currentColor" strokeWidth="3" />
              </svg>
              {t("loading")}
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </form>

      <p className="mt-5 text-sm text-neutral-600 dark:text-neutral-400">
        {switchLabel}{" "}
        <Link href={switchHref} className="font-semibold text-orange-600 transition hover:text-orange-500 dark:text-orange-400">
          {switchLinkLabel}
        </Link>
      </p>
    </div>
  );
}
