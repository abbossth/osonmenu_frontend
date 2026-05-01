/**
 * Opt-in client performance logging. Enable with:
 * - `NEXT_PUBLIC_PERF_DEBUG=1` in `.env.local`, or
 * - `sessionStorage.setItem('perf_debug', '1')` in DevTools, then reload.
 */

export function isClientPerfDebug(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (process.env.NEXT_PUBLIC_PERF_DEBUG === "1") return true;
    return window.sessionStorage.getItem("perf_debug") === "1";
  } catch {
    return process.env.NEXT_PUBLIC_PERF_DEBUG === "1";
  }
}

export function perfDebug(scope: string, message: string, data?: Record<string, unknown>): void {
  if (!isClientPerfDebug()) return;
  if (data && Object.keys(data).length > 0) {
    console.log(`[perf:${scope}] ${message}`, data);
  } else {
    console.log(`[perf:${scope}] ${message}`);
  }
}

/** Time fetch until response is available; logs status. Body read / JSON parse is separate. */
export async function fetchWithPerf(
  scope: string,
  label: string,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const t0 = performance.now();
  const res = await fetch(input, init);
  const ms = performance.now() - t0;
  perfDebug(scope, `${label} fetch`, {
    ms: +ms.toFixed(2),
    status: res.status,
    url: typeof input === "string" ? input : String(input),
  });
  return res;
}

export function timeJsonParse<T>(scope: string, label: string, res: Response): Promise<T> {
  const t0 = performance.now();
  return res.json().then((data: T) => {
    perfDebug(scope, `${label} JSON parse`, { ms: +(performance.now() - t0).toFixed(2) });
    return data;
  }) as Promise<T>;
}
