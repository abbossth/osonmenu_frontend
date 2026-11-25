"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Link } from "@/i18n/navigation";
import {
  addDays,
  addMonths,
  endOfDayTashkent,
  getAccessState,
  parseDateInputTashkent,
} from "@/lib/establishment-access";

/* ---------------- Turlar ---------------- */
type Place = {
  _id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  phone: string;
  city: string;
  logoUrl: string;
  createdAt: string | null;
  isBlocked: boolean;
  paidUntil: string | null;
  blockedMessage: string;
  monthlyFee: number;
  adminNote: string;
};

type HistoryEntry = {
  _id: string;
  type: "extend" | "block" | "unblock" | "update";
  amount: number;
  period: string;
  from: string | null;
  until: string | null;
  note: string;
  byEmail: string;
  createdAt: string | null;
};

type StatusKey = "manual" | "expired" | "soon" | "active" | "unlimited";
type Filter = "all" | "active" | "soon" | "blocked" | "unlimited";
type Period = { months: number } | { days: number } | { custom: true };

/* ---------------- Yordamchilar ---------------- */
const SOON_DAYS = 3;
const TZ = 5 * 60 * 60 * 1000;
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

function fmtDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = new Date(new Date(value).getTime() + TZ);
  return `${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function fmtDateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(new Date(value).getTime() + TZ);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${fmtDate(value)}, ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}
function fmtMoney(n: number) {
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(n || 0)).replace(/ /g, " ")} so'm`;
}
function toInputDate(date: Date) {
  const d = new Date(date.getTime() + TZ);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

function statusOf(place: Place, now: number) {
  const a = getAccessState(place, now);
  let key: StatusKey;
  if (a.reason === "manual") key = "manual";
  else if (a.reason === "expired") key = "expired";
  else if (!place.paidUntil) key = "unlimited";
  else if ((a.daysLeft ?? 0) <= SOON_DAYS) key = "soon";
  else key = "active";

  const days = a.daysLeft ?? 0;
  const sub =
    key === "expired"
      ? days === 0 ? "Bugun tugadi" : `${Math.abs(days)} kun oldin tugagan`
      : key === "manual"
        ? place.paidUntil && days > 0 ? `To'langan: ${fmtDate(place.paidUntil)} gacha` : ""
        : key === "unlimited" ? "Muddat belgilanmagan" : `${days} kun qoldi`;
  return { key, blocked: a.blocked, sub, daysLeft: a.daysLeft };
}

const STATUS_UI: Record<StatusKey, { label: string; badge: string; sub: string }> = {
  manual: { label: "O'chirilgan", badge: "bg-red-500/15 text-red-400", sub: "text-neutral-400" },
  expired: { label: "Muddati tugagan", badge: "bg-red-500/15 text-red-400", sub: "text-red-400" },
  soon: { label: "Tez tugaydi", badge: "bg-amber-500/15 text-amber-400", sub: "text-amber-400" },
  active: { label: "Faol", badge: "bg-emerald-500/15 text-emerald-400", sub: "text-neutral-400" },
  unlimited: { label: "Muddatsiz", badge: "bg-sky-500/15 text-sky-400", sub: "text-neutral-500" },
};
const RANK: Record<StatusKey, number> = { expired: 0, soon: 1, manual: 2, unlimited: 3, active: 4 };

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-orange-500";
const btn = {
  base: "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition disabled:cursor-default disabled:opacity-50",
  primary: "bg-gradient-to-br from-orange-500 to-amber-500 text-white hover:brightness-110",
  ok: "bg-emerald-500 text-emerald-950 hover:brightness-110",
  bad: "bg-red-500 text-white hover:brightness-110",
  softOk: "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25",
  softBad: "bg-red-500/15 text-red-400 hover:bg-red-500/25",
  ghost: "border border-white/10 text-neutral-200 hover:bg-white/5",
};
const sm = "px-2.5 py-1.5 text-[13px]";

/* ---------------- Sahifa ---------------- */
export default function SuperAdminPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [errorText, setErrorText] = useState("");
  const [deniedUid, setDeniedUid] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null);

  const [extendTarget, setExtendTarget] = useState<Place | null>(null);
  const [blockTarget, setBlockTarget] = useState<Place | null>(null);
  const [editTarget, setEditTarget] = useState<Place | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Place | null>(null);

  const showToast = useCallback((text: string, bad = false) => {
    setToast({ text, bad });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      if (!firebaseUser) throw new Error("Kirilmagan");
      const token = await firebaseUser.getIdToken();
      const res = await fetch(path, {
        ...init,
        headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data?.error || "Xatolik yuz berdi"), { status: res.status, data });
      return data;
    },
    [firebaseUser],
  );

  const load = useCallback(
    () =>
      api("/api/superadmin/places").then(
        (data: { places: Place[] }) => {
          setPlaces(data.places);
          setState("ready");
        },
        (err: Error & { status?: number; data?: { uid?: string } }) => {
          if (err.status === 403) {
            setDeniedUid(err.data?.uid ?? firebaseUser?.uid ?? "");
            setState("denied");
          } else {
            setErrorText(err.message);
            setState("error");
          }
        },
      ),
    [api, firebaseUser],
  );

  useEffect(() => {
    if (authLoading || !firebaseUser) return;
    void load();
  }, [authLoading, firebaseUser, load]);

  // Muddatlar real vaqtda yangilanib tursin
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const replacePlace = (updated: Place) =>
    setPlaces((list) => list.map((p) => (p._id === updated._id ? updated : p)));

  async function act(place: Place, body: Record<string, unknown>, success: string) {
    const data = (await api(`/api/superadmin/places/${place._id}`, {
      method: "POST",
      body: JSON.stringify(body),
    })) as { place: Place };
    replacePlace(data.place);
    showToast(success);
  }

  const rows = useMemo(() => places.map((p) => ({ place: p, st: statusOf(p, now) })), [places, now]);

  const stats = useMemo(() => {
    const live = rows.filter((r) => !r.st.blocked);
    return {
      total: rows.length,
      active: live.length,
      soon: rows.filter((r) => r.st.key === "soon").length,
      blocked: rows.filter((r) => r.st.blocked).length,
      unlimited: rows.filter((r) => r.st.key === "unlimited").length,
      revenue: live.reduce((s, r) => s + (r.place.monthlyFee || 0), 0),
    };
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter(({ place, st }) => {
        if (filter === "active" && st.blocked) return false;
        if (filter === "soon" && st.key !== "soon") return false;
        if (filter === "blocked" && !st.blocked) return false;
        if (filter === "unlimited" && st.key !== "unlimited") return false;
        if (!q) return true;
        return [place.name, place.slug, place.ownerEmail, place.ownerName, place.phone, place.city].some((v) =>
          (v || "").toLowerCase().includes(q),
        );
      })
      .sort((a, b) => {
        if (RANK[a.st.key] !== RANK[b.st.key]) return RANK[a.st.key] - RANK[b.st.key];
        const ua = a.place.paidUntil ? new Date(a.place.paidUntil).getTime() : Infinity;
        const ub = b.place.paidUntil ? new Date(b.place.paidUntil).getTime() : Infinity;
        return ua - ub || a.place.name.localeCompare(b.place.name);
      });
  }, [rows, query, filter]);

  /* ---------- Holat ekranlari ---------- */
  if (authLoading || (firebaseUser && state === "loading")) {
    return (
      <Shell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-orange-500" />
        </div>
      </Shell>
    );
  }
  if (!firebaseUser) {
    return (
      <Shell>
        <CenterCard title="Tizimga kiring">
          <p className="text-sm text-neutral-400">Admin panel faqat super-admin akkaunti bilan ochiladi.</p>
          <Link href="/auth/login" className={`${btn.base} ${btn.primary} w-full`}>
            Kirish
          </Link>
        </CenterCard>
      </Shell>
    );
  }
  if (state === "denied") {
    return (
      <Shell>
        <CenterCard title="Ruxsat yo'q">
          <p className="text-sm leading-relaxed text-neutral-400">
            Bu akkaunt super-admin emas. Vercel → Settings → Environment Variables ga quyidagini qo&apos;shib, qayta deploy qiling:
          </p>
          <code className="block break-all rounded-xl bg-white/5 px-3 py-2 text-xs">SUPER_ADMIN_UIDS={deniedUid}</code>
          <button
            type="button"
            className={`${btn.base} ${btn.ghost} w-full`}
            onClick={() => navigator.clipboard?.writeText(deniedUid).then(() => showToast("UID nusxalandi"))}
          >
            UID ni nusxalash
          </button>
        </CenterCard>
        <Toast toast={toast} />
      </Shell>
    );
  }
  if (state === "error") {
    return (
      <Shell>
        <CenterCard title="Xatolik">
          <p className="text-sm text-red-400">{errorText}</p>
          <button type="button" className={`${btn.base} ${btn.ghost} w-full`} onClick={() => void load()}>
            Qayta urinish
          </button>
        </CenterCard>
      </Shell>
    );
  }

  /* ---------- Asosiy panel ---------- */
  const filters: Array<[Filter, string, number]> = [
    ["all", "Hammasi", stats.total],
    ["active", "Faol", stats.active],
    ["soon", "Tez tugaydi", stats.soon],
    ["blocked", "Bloklangan", stats.blocked],
    ["unlimited", "Muddatsiz", stats.unlimited],
  ];

  return (
    <Shell email={firebaseUser.email ?? ""}>
      <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-5">
        <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Stat label="Jami restoranlar" value={stats.total} />
          <Stat label="Faol" value={stats.active} tone="ok" />
          <Stat label={`Tez tugaydi (≤ ${SOON_DAYS} kun)`} value={stats.soon} tone="warn" />
          <Stat label="Bloklangan" value={stats.blocked} tone="bad" />
          <Stat label="Muddatsiz" value={stats.unlimited} tone="info" />
          <Stat label="Oylik tushum (faollar)" value={fmtMoney(stats.revenue)} />
        </section>

        <section className="mb-4 flex flex-wrap items-center gap-2">
          <input
            className={`${inputCls} min-w-[240px] flex-1`}
            type="search"
            placeholder="Qidirish: nomi, slug, egasi, telefon, shahar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-white/10 bg-[#17171a] p-1">
            {filters.map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${filter === key ? "bg-white/10 text-white" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                {label} <span className="text-neutral-500">{count}</span>
              </button>
            ))}
          </div>
          <button type="button" className={`${btn.base} ${btn.ghost}`} onClick={() => void load()}>
            ↻ Yangilash
          </button>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#17171a]">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.6fr)_auto] gap-4 border-b border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-neutral-400 lg:grid">
            <div>Restoran</div>
            <div>Holat</div>
            <div>To&apos;langan muddat</div>
            <div>Oylik to&apos;lov</div>
            <div>Egasi</div>
            <div className="w-[300px] text-right">Amallar</div>
          </div>

          {visible.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-neutral-500">Restoran topilmadi.</div>
          ) : (
            visible.map(({ place, st }) => {
              const ui = STATUS_UI[st.key];
              const canResume = place.isBlocked && (!place.paidUntil || new Date(place.paidUntil).getTime() > now);
              return (
                <div
                  key={place._id}
                  className="grid grid-cols-1 gap-3 border-b border-white/5 px-4 py-3.5 last:border-0 hover:bg-white/[0.02] lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.6fr)_auto] lg:items-center lg:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {place.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={place.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-bold text-neutral-400">
                        {place.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-medium">{place.name}</div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <a
                          href={`/uz/p/${place.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-orange-400 hover:underline"
                        >
                          /{place.slug}
                        </a>
                        {place.city ? <span className="truncate">· {place.city}</span> : null}
                      </div>
                    </div>
                  </div>

                  <Cell label="Holat">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${ui.badge}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {ui.label}
                    </span>
                  </Cell>

                  <Cell label="To'langan muddat">
                    <div>
                      <div className="tabular-nums">{fmtDate(place.paidUntil)}</div>
                      {st.sub ? <div className={`text-xs ${ui.sub}`}>{st.sub}</div> : null}
                    </div>
                  </Cell>

                  <Cell label="Oylik to'lov">
                    <span className="tabular-nums">{place.monthlyFee ? fmtMoney(place.monthlyFee) : "—"}</span>
                  </Cell>

                  <Cell label="Egasi">
                    <div className="min-w-0">
                      <div className="truncate">{place.ownerName || "—"}</div>
                      <div className="truncate text-xs text-neutral-500">
                        {place.ownerEmail}
                        {place.phone ? (
                          <>
                            {place.ownerEmail ? " · " : ""}
                            <a className="text-orange-400 hover:underline" href={`tel:${place.phone.replace(/[^\d+]/g, "")}`}>
                              {place.phone}
                            </a>
                          </>
                        ) : null}
                      </div>
                      {place.adminNote ? <div className="truncate text-xs italic text-neutral-500">“{place.adminNote}”</div> : null}
                    </div>
                  </Cell>

                  <div className="flex flex-wrap gap-1.5 lg:w-[300px] lg:justify-end">
                    {st.blocked ? (
                      <>
                        {canResume && place.isBlocked ? (
                          <AsyncButton
                            className={`${btn.base} ${btn.softOk} ${sm}`}
                            onClick={() =>
                              act(place, { action: "unblock" }, `${place.name} qayta yoqildi`).catch((e: Error) =>
                                showToast(e.message, true),
                              )
                            }
                          >
                            Qayta yoqish
                          </AsyncButton>
                        ) : null}
                        <button type="button" className={`${btn.base} ${btn.ok} ${sm}`} onClick={() => setExtendTarget(place)}>
                          Muddat bilan yoqish
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className={`${btn.base} ${btn.softOk} ${sm}`} onClick={() => setExtendTarget(place)}>
                          {place.paidUntil ? "Uzaytirish" : "Muddat berish"}
                        </button>
                        <button type="button" className={`${btn.base} ${btn.softBad} ${sm}`} onClick={() => setBlockTarget(place)}>
                          O&apos;chirish
                        </button>
                      </>
                    )}
                    <button type="button" className={`${btn.base} ${btn.ghost} ${sm}`} onClick={() => setHistoryTarget(place)}>
                      Tarix
                    </button>
                    <button
                      type="button"
                      className={`${btn.base} ${btn.ghost} ${sm}`}
                      title="Oylik to'lov va izoh"
                      onClick={() => setEditTarget(place)}
                    >
                      ✎
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {extendTarget ? (
        <ExtendDialog
          place={extendTarget}
          onClose={() => setExtendTarget(null)}
          onSubmit={async (body, untilText) => {
            await act(extendTarget, { action: "extend", ...body }, `${extendTarget.name}: ${untilText} gacha yoqildi`);
            setExtendTarget(null);
          }}
        />
      ) : null}
      {blockTarget ? (
        <BlockDialog
          place={blockTarget}
          onClose={() => setBlockTarget(null)}
          onSubmit={async (body) => {
            await act(blockTarget, { action: "block", ...body }, `${blockTarget.name} o'chirildi`);
            setBlockTarget(null);
          }}
        />
      ) : null}
      {editTarget ? (
        <EditDialog
          place={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={async (body) => {
            await act(editTarget, { action: "update", ...body }, "Saqlandi");
            setEditTarget(null);
          }}
        />
      ) : null}
      {historyTarget ? (
        <HistoryDialog place={historyTarget} api={api} onClose={() => setHistoryTarget(null)} />
      ) : null}

      <Toast toast={toast} />
    </Shell>
  );
}

/* ---------------- Kichik komponentlar ---------------- */
function Shell({ children, email }: { children: ReactNode; email?: string }) {
  return (
    <div className="min-h-screen bg-[#0f0f10] text-[14px] text-neutral-100">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0f0f10]/85 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex items-center gap-2 text-base">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-orange-500 to-amber-500" />
          OsonMenu <b className="text-orange-400">Super Admin</b>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          {email ? <span className="hidden truncate text-sm text-neutral-400 sm:inline">{email}</span> : null}
          <Link href="/profile" className={`${btn.base} ${btn.ghost} ${sm}`}>
            Profil
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}

function CenterCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-white/10 bg-[#17171a] p-7">
        <h1 className="text-xl font-bold">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "ok" | "warn" | "bad" | "info" }) {
  const bar = { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-red-500", info: "bg-sky-500" }[tone ?? "ok"];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#17171a] px-4 py-3.5">
      <span className={`absolute inset-y-0 left-0 w-[3px] ${tone ? bar : "bg-white/10"}`} />
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="mt-1.5 text-xl font-bold tabular-nums md:text-2xl">{value}</div>
    </div>
  );
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 lg:block">
      <span className="text-xs text-neutral-500 lg:hidden">{label}</span>
      <div className="min-w-0 text-right lg:text-left">{children}</div>
    </div>
  );
}

function Toast({ toast }: { toast: { text: string; bad?: boolean } | null }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 z-50 max-w-[calc(100%-32px)] -translate-x-1/2 rounded-xl border bg-[#1f1f23] px-4 py-2.5 text-sm shadow-2xl ${toast.bad ? "border-red-500" : "border-white/10"}`}
    >
      {toast.text}
    </div>
  );
}

function AsyncButton({ onClick, className, children }: { onClick: () => Promise<unknown>; className: string; children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className={className}
      onClick={async () => {
        setBusy(true);
        try {
          await onClick();
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`max-h-[92vh] w-full overflow-auto rounded-3xl border border-white/10 bg-[#17171a] p-5 sm:p-6 ${wide ? "max-w-2xl" : "max-w-lg"}`}>
        <h2 className="text-lg font-bold">{title}</h2>
        {subtitle ? <div className="mt-1 text-sm text-neutral-400">{subtitle}</div> : null}
        <div className="mt-4 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-neutral-400">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-neutral-500">{hint}</span> : null}
    </label>
  );
}

function DialogActions({
  onClose,
  busy,
  submitLabel,
  submitClass,
}: {
  onClose: () => void;
  busy: boolean;
  submitLabel: string;
  submitClass: string;
}) {
  return (
    <div className="mt-1 flex justify-end gap-2">
      <button type="button" className={`${btn.base} ${btn.ghost}`} onClick={onClose}>
        Bekor qilish
      </button>
      <button type="submit" disabled={busy} className={`${btn.base} ${submitClass}`}>
        {busy ? "Saqlanmoqda…" : submitLabel}
      </button>
    </div>
  );
}

function useSubmit(handler: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await handler();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
}

/* ---------------- Muddat bilan yoqish ---------------- */
const PERIODS: Array<{ label: string; value: Period }> = [
  { label: "7 kun", value: { days: 7 } },
  { label: "1 oy", value: { months: 1 } },
  { label: "3 oy", value: { months: 3 } },
  { label: "6 oy", value: { months: 6 } },
  { label: "1 yil", value: { months: 12 } },
  { label: "Aniq sana", value: { custom: true } },
];

function ExtendDialog({
  place,
  onClose,
  onSubmit,
}: {
  place: Place;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>, untilText: string) => Promise<void>;
}) {
  // Dialog ochilgan vaqt — render davomida o'zgarmas "hozir"
  const [openedAt] = useState(() => Date.now());
  const [periodIndex, setPeriodIndex] = useState(1);
  const period = PERIODS[periodIndex].value;
  const isCustom = "custom" in period;
  const currentUntil = useMemo(() => (place.paidUntil ? new Date(place.paidUntil) : null), [place.paidUntil]);
  const canExtend = Boolean(currentUntil && currentUntil.getTime() > openedAt) && !isCustom;
  const [extendFromCurrent, setExtendFromCurrent] = useState(true);
  const [customDate, setCustomDate] = useState(() => toInputDate(addMonths(new Date(openedAt), 1)));
  const defaultAmount = (p: Period) =>
    !place.monthlyFee ? "" : "months" in p ? String(place.monthlyFee * p.months)
      : "days" in p ? String(Math.round((place.monthlyFee * p.days) / 30 / 1000) * 1000) : "";
  const [amount, setAmount] = useState(() => defaultAmount(PERIODS[1].value));
  const [note, setNote] = useState("");

  const until = useMemo(() => {
    const base = canExtend && extendFromCurrent ? currentUntil! : new Date(openedAt);
    if ("custom" in period) return parseDateInputTashkent(customDate);
    if ("months" in period) return endOfDayTashkent(addMonths(base, period.months));
    return endOfDayTashkent(addDays(base, period.days));
  }, [period, canExtend, extendFromCurrent, currentUntil, customDate, openedAt]);

  const { busy, error, submit } = useSubmit(async () => {
    if (!until || until.getTime() <= Date.now()) throw new Error("Muddat kelajakdagi sana bo'lishi kerak.");
    const body: Record<string, unknown> = { amount: Number(amount) || 0, note, extendFromCurrent: canExtend && extendFromCurrent };
    if ("custom" in period) body.until = customDate;
    else if ("months" in period) body.months = period.months;
    else body.days = period.days;
    await onSubmit(body, fmtDate(until));
  });

  return (
    <Modal title="Muddat bilan yoqish" subtitle={`${place.name} · /${place.slug}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Muddat">
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p, i) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setPeriodIndex(i);
                  setAmount(defaultAmount(p.value));
                }}
                className={`rounded-full border px-3.5 py-1.5 text-sm ${i === periodIndex ? "border-orange-500 bg-orange-500/15 text-orange-300" : "border-white/10 bg-white/5 text-neutral-200"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Field>

        {isCustom ? (
          <Field label="Qaysi sanagacha (shu kun oxirigacha ishlaydi)">
            <input
              type="date"
              className={inputCls}
              value={customDate}
              min={toInputDate(new Date(openedAt))}
              onChange={(e) => setCustomDate(e.target.value)}
              required
            />
          </Field>
        ) : null}

        {canExtend ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-orange-500"
              checked={extendFromCurrent}
              onChange={(e) => setExtendFromCurrent(e.target.checked)}
            />
            Joriy muddat ustiga qo&apos;shish (<b>{fmtDate(currentUntil)}</b> dan boshlab)
          </label>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="To'langan summa (so'm)">
            <input type="number" min={0} step={1000} className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Izoh">
            <input className={inputCls} maxLength={200} placeholder="Naqd / Click / Payme…" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>

        <div className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm">
          Yangi muddat: <b className="text-emerald-400">{until ? fmtDate(until) : "—"}</b>{" "}
          {until ? (
            <span className="text-neutral-400">(bugundan {Math.ceil((until.getTime() - openedAt) / 86_400_000)} kun)</span>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <DialogActions onClose={onClose} busy={busy} submitLabel="Yoqish" submitClass={btn.ok} />
      </form>
    </Modal>
  );
}

/* ---------------- O'chirish ---------------- */
function BlockDialog({
  place,
  onClose,
  onSubmit,
}: {
  place: Place;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("To'lov qilinmadi");
  const { busy, error, submit } = useSubmit(() => onSubmit({ message, note: reason }));
  return (
    <Modal
      title="Menyuni o'chirish"
      subtitle={
        <>
          <b className="text-neutral-200">{place.name}</b> menyusi darhol yopiladi. Mijozlar &quot;Menyu vaqtincha mavjud emas&quot;
          xabarini ko&apos;radi, egasi esa ogohlantirish oladi. To&apos;langan muddat saqlanib qoladi.
        </>
      }
      onClose={onClose}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Menyuda ko'rsatiladigan qo'shimcha xabar (ixtiyoriy)">
          <input className={inputCls} maxLength={160} placeholder="Masalan: Tez orada qaytamiz!" value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <Field label="Sabab (faqat tarix uchun)">
          <select className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)}>
            <option>To&apos;lov qilinmadi</option>
            <option>Restoran so&apos;rovi</option>
            <option>Qoidabuzarlik</option>
            <option>Boshqa</option>
          </select>
        </Field>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <DialogActions onClose={onClose} busy={busy} submitLabel="O'chirish" submitClass={btn.bad} />
      </form>
    </Modal>
  );
}

/* ---------------- Oylik to'lov / izoh ---------------- */
function EditDialog({
  place,
  onClose,
  onSubmit,
}: {
  place: Place;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [fee, setFee] = useState(place.monthlyFee ? String(place.monthlyFee) : "");
  const [adminNote, setAdminNote] = useState(place.adminNote);
  const { busy, error, submit } = useSubmit(() => onSubmit({ monthlyFee: Number(fee) || 0, adminNote }));
  return (
    <Modal title="Tahrirlash" subtitle={`${place.name} · /${place.slug}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Oylik to'lov (so'm)" hint="Muddat berishda summa avtomatik hisoblanadi">
          <input type="number" min={0} step={1000} className={inputCls} placeholder="200000" value={fee} onChange={(e) => setFee(e.target.value)} />
        </Field>
        <Field label="Izoh (faqat adminlar ko'radi)">
          <textarea className={inputCls} rows={3} maxLength={500} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
        </Field>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <DialogActions onClose={onClose} busy={busy} submitLabel="Saqlash" submitClass={btn.primary} />
      </form>
    </Modal>
  );
}

/* ---------------- Tarix ---------------- */
const HISTORY_UI: Record<HistoryEntry["type"], { icon: string; cls: string; label: string }> = {
  extend: { icon: "✓", cls: "bg-emerald-500/15 text-emerald-400", label: "Yoqildi / to'lov" },
  unblock: { icon: "↺", cls: "bg-emerald-500/15 text-emerald-400", label: "Qayta yoqildi" },
  block: { icon: "✕", cls: "bg-red-500/15 text-red-400", label: "O'chirildi" },
  update: { icon: "✎", cls: "bg-sky-500/15 text-sky-400", label: "Tahrirlandi" },
};

function HistoryDialog({
  place,
  api,
  onClose,
}: {
  place: Place;
  api: (path: string) => Promise<{ history: HistoryEntry[] }>;
  onClose: () => void;
}) {
  const [items, setItems] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api(`/api/superadmin/places/${place._id}/history`)
      .then((d) => setItems(d.history))
      .catch((e: Error) => setError(e.message));
  }, [api, place._id]);
  const total = (items ?? []).reduce((s, h) => s + (h.amount || 0), 0);

  return (
    <Modal
      wide
      title={`Tarix: ${place.name}`}
      subtitle={items ? `Jami to'lovlar: ${fmtMoney(total)} · ${items.length} ta yozuv` : undefined}
      onClose={onClose}
    >
      <ul className="flex max-h-[55vh] flex-col gap-2 overflow-auto">
        {error ? <li className="text-sm text-red-400">{error}</li> : null}
        {!items && !error ? <li className="text-sm text-neutral-500">Yuklanmoqda…</li> : null}
        {items && items.length === 0 ? <li className="text-sm text-neutral-500">Tarix bo&apos;sh</li> : null}
        {items?.map((h) => {
          const ui = HISTORY_UI[h.type] ?? HISTORY_UI.update;
          const details = [h.period && `Muddat: ${h.period}`, h.until && `→ ${fmtDate(h.until)} gacha`, h.note]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={h._id} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-xl bg-white/5 px-3 py-2.5">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${ui.cls}`}>{ui.icon}</span>
              <div className="min-w-0 text-sm">
                <div>
                  {ui.label}
                  {details ? <span className="text-neutral-400"> — {details}</span> : null}
                </div>
                <div className="text-xs text-neutral-500">
                  {fmtDateTime(h.createdAt)}
                  {h.byEmail ? ` · ${h.byEmail}` : ""}
                </div>
              </div>
              <div className="whitespace-nowrap text-sm font-bold text-emerald-400">{h.amount ? fmtMoney(h.amount) : ""}</div>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-end">
        <button type="button" className={`${btn.base} ${btn.ghost}`} onClick={onClose}>
          Yopish
        </button>
      </div>
    </Modal>
  );
}
