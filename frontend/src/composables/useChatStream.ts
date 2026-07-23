import { ref } from "vue";
import { streamChat, type ChatStreamBody } from "@/api/chat";
import { ApiError } from "@/api/http";
import type { ChatMessage } from "@/types";

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
      onDone?: (sessionId?: string | null) => void;
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
            opts.onDone?.(sid);
          },
          onError: (_c, m) => {
            error.value = m;
          },
          onMeta: (d) => {
            opts.onMeta?.(d);
            if (typeof d.session_id === "string") {
              opts.onDone?.(d.session_id);
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
