const CLIENT_KEY = "jiuban_client_id";

export function getClientId(): string {
  let id = localStorage.getItem(CLIENT_KEY);
  if (!id) {
    id = "web_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    localStorage.setItem(CLIENT_KEY, id);
  }
  return id;
}
