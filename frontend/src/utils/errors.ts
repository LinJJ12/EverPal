export function friendlyError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = String((err as { message: string }).message || "");
    if (m) return m;
  }
  return "现在有点忙，稍后再试一下吧";
}
