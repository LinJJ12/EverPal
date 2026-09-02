const CLIENT_KEY = "everpal_client_id";

function createClientId(): string {
  return "web_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export function getClientId(): string {
  let id = localStorage.getItem(CLIENT_KEY);
  if (!id) {
    id = createClientId();
    localStorage.setItem(CLIENT_KEY, id);
  }
  return id;
}

/** Rotate local device id immediately (new value stored before return). */
export function resetClientId(): string {
  const id = createClientId();
  localStorage.setItem(CLIENT_KEY, id);
  return id;
}
