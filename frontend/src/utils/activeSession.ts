const SESSION_KEY = "everpal_active_session";
const BY_COMPANION_KEY = "everpal_sessions_by_companion";

export function getActiveSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setActiveSessionId(id: string | null): void {
  try {
    if (!id) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, id);
  } catch {
    /* ignore quota / private mode */
  }
}

function readCompanionMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(BY_COMPANION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

function writeCompanionMap(map: Record<string, string>): void {
  try {
    localStorage.setItem(BY_COMPANION_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Last chat thread for a companion on this device (survives switching away and back). */
export function getSessionForCompanion(companionId: string): string | null {
  const id = (companionId || "").trim();
  if (!id) return null;
  return readCompanionMap()[id] || null;
}

export function setSessionForCompanion(companionId: string, sessionId: string | null): void {
  const id = (companionId || "").trim();
  if (!id) return;
  const map = readCompanionMap();
  if (!sessionId) delete map[id];
  else map[id] = sessionId.trim();
  writeCompanionMap(map);
}

/** After server-side delete: drop active pointer and any companion→session map entry. */
export function forgetSessionId(sessionId: string): void {
  const sid = (sessionId || "").trim();
  if (!sid) return;
  if (getActiveSessionId() === sid) setActiveSessionId(null);
  const map = readCompanionMap();
  let changed = false;
  for (const [k, v] of Object.entries(map)) {
    if (v === sid) {
      delete map[k];
      changed = true;
    }
  }
  if (changed) writeCompanionMap(map);
}
