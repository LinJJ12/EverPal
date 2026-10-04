const CLIENT_KEY = "everpal_client_id";

/** randomUUID only exists in secure contexts; LAN http:// deployments need a fallback. */
function randomToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function createClientId(): string {
  return "web_" + randomToken();
}

export function getClientId(): string {
  let id: string | null = null;
  try {
    id = localStorage.getItem(CLIENT_KEY);
  } catch {
    /* private mode etc. */
  }
  if (!id) {
    id = createClientId();
    try {
      localStorage.setItem(CLIENT_KEY, id);
    } catch {
      /* keep in-memory id for this page session */
    }
  }
  return id;
}

/** Rotate local device id immediately (new value stored before return). */
export function resetClientId(): string {
  const id = createClientId();
  try {
    localStorage.setItem(CLIENT_KEY, id);
  } catch {
    /* ignore */
  }
  return id;
}
