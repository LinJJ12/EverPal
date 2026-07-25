/** Plain Chinese user-facing copy; never surface raw HTTP/stack text. */
export function friendlyError(err: unknown): string {
  const fallback = "现在有点忙，稍后再试一下吧";
  if (err && typeof err === "object" && "message" in err) {
    const m = String((err as { message: string }).message || "").trim();
    if (
      m &&
      !/^(HTTP|Error|TypeError|fetch|ECONN|upstream)/i.test(m) &&
      !/^\d{3}\b/.test(m) &&
      !/^(not\s*found|unauthorized|forbidden|bad\s*request|internal\s*server)/i.test(m) &&
      !/^[A-Za-z][A-Za-z0-9 _\-.]{0,40}$/.test(m) // pure English/status phrases
    ) {
      return m;
    }
  }
  return fallback;
}
