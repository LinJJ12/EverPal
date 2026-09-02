const SIDEBAR_KEY = "everpal_chat_sidebar_open";

/** Desktop chat rail open/closed preference (mobile drawer is ephemeral). */
export function getChatSidebarOpen(defaultOpen = true): boolean {
  try {
    const v = localStorage.getItem(SIDEBAR_KEY);
    if (v === null) return defaultOpen;
    return v === "1";
  } catch {
    return defaultOpen;
  }
}

export function setChatSidebarOpen(open: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_KEY, open ? "1" : "0");
  } catch {
    /* ignore quota / private mode */
  }
}
