/** Plain Chinese user-facing copy; never surface raw HTTP/stack text. */
export function friendlyError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = String((err as { message: string }).message || "").trim();
    // Reject developer-looking payloads
    if (m && !/^(HTTP|Error|TypeError|fetch|ECONN|upstream)/i.test(m) && !/^\d{3}\b/.test(m)) {
      return m;
    }
  }
  return "现在有点忙，稍后再试一下吧";
}
