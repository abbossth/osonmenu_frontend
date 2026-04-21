"use client";

import Image from "next/image";

export type PhoneMenuItem = {
  name: string;
  price: string;
  image: string;
  badge?: string;
};

type PhoneMenuMockupProps = {
  menuTag: string;
  restaurant: string;
  section: string;
  items: PhoneMenuItem[];
  cartSummary: string;
  cartTotal: string;
};

export function PhoneMenuMockup({
  menuTag,
  restaurant,
  section,
  items,
  cartSummary,
  cartTotal,
}: PhoneMenuMockupProps) {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-blue-500/25 via-amber-400/15 to-fuchsia-500/20 blur-3xl" />
      <div className="relative rounded-[2.85rem] border-[11px] border-neutral-900 bg-neutral-900 shadow-[0_40px_100px_-24px_rgba(0,0,0,0.55)] dark:border-neutral-950">
        <div className="overflow-hidden rounded-[2.05rem] bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900">
          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <span className="text-[10px] font-medium text-neutral-400">9:41</span>
            <div className="h-5 w-20 rounded-full bg-neutral-900" />
            <div className="flex gap-1">
              <span className="h-2 w-3 rounded-sm bg-neutral-600" />
              <span className="h-2 w-2 rounded-full bg-neutral-600" />
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-300/90">{menuTag}</p>
                <p className="text-sm font-semibold text-white">{restaurant}</p>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-[10px] font-bold text-white ring-1 ring-white/15">
                QR
              </div>
            </div>

            <p className="mt-4 text-xs font-medium text-neutral-400">{section}</p>

            <div className="mt-2 space-y-2.5">
              {items.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 rounded-2xl bg-white/5 p-2 ring-1 ring-white/10"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                      {item.badge ? (
                        <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-emerald-300/90">{item.price}</p>
                  </div>
                  <button
                    type="button"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-lg font-light text-white shadow-lg shadow-blue-600/30"
                    aria-hidden
                  >
                    +
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600/30 to-amber-500/20 px-3 py-2.5 ring-1 ring-white/10">
              <p className="text-[11px] text-neutral-200">{cartSummary}</p>
              <p className="text-sm font-semibold text-white">{cartTotal}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
