import { ref } from "vue";
import { streamChat, type ChatStreamBody } from "@/api/chat";
import { ApiError } from "@/api/http";
import type { ChatMessage, ChatSource } from "@/types";

/** Reject lookalikes like https://evilwikipedia.org/... */
export function parseChatSources(data: Record<string, unknown>): ChatSource[] | undefined {
  const raw = data.sources;
  if (!Array.isArray(raw) || !raw.length) return undefined;
  const out: ChatSource[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const title = (item as { title?: unknown }).title;
    const url = (item as { url?: unknown }).url;
    if (typeof title !== "string" || typeof url !== "string") continue;
    const cleanTitle = title.trim();
    if (!cleanTitle) continue;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") continue;
      if (parsed.username || parsed.password) continue;
      const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
      const ok = host === "wikipedia.org" || host.endsWith(".wikipedia.org");
      if (!ok) continue;
      out.push({ title: cleanTitle.slice(0, 120), url: parsed.toString() });
    } catch {
      continue;
    }
  }
  return out.length ? out : undefined;
}

export function useChatStream() {
  const streaming = ref(false);
  const error = ref("");
  let abort: AbortController | null = null;

  async function send(
    body: ChatStreamBody,
    opts: {
      onUser?: (text: string) => void;
      onAssistantStart?: () => void;
      onDelta?: (t: string) => void;
      onMeta?: (data: Record<string, unknown>) => void;
      onDone?: (sessionId?: string | null, sources?: ChatSource[]) => void;
    },
  ) {
    error.value = "";
    streaming.value = true;
    abort?.abort();
    abort = new AbortController();
    opts.onUser?.(body.message);
    opts.onAssistantStart?.();
    try {
      await streamChat(
        body,
        {
          onDelta: (t) => opts.onDelta?.(t),
          onDone: (d) => {
            const sid = typeof d.session_id === "string" ? d.session_id : null;
            opts.onDone?.(sid, parseChatSources(d));
          },
          onError: (_c, m) => {
            error.value = m;
          },
          onMeta: (d) => {
            opts.onMeta?.(d);
            // Early session id only — do not treat as stream completion (no sources wipe).
            if (typeof d.session_id === "string") {
              opts.onDone?.(d.session_id, undefined);
            }
          },
        },
        abort.signal,
      );
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      error.value = e instanceof ApiError ? e.message : "现在有点忙，稍后再试一下吧";
    } finally {
      streaming.value = false;
      abort = null;
    }
  }

  function stop() {
    abort?.abort();
    abort = null;
    streaming.value = false;
  }

  return { streaming, error, send, stop };
}

export type { ChatMessage };
