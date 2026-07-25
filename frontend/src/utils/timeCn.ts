/** Product calendar day helpers (UTC+8), shared by mood gate and history. */

/** Calendar day key YYYY-MM-DD in China TZ — matches backend domain.time_cn.today_day(). */
export function cnTodayKey(nowMs = Date.now()): string {
  const shifted = new Date(nowMs + 8 * 3_600_000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
