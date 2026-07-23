import { apiBase } from "./http";
import { getClientId } from "@/utils/clientId";
import { ApiError } from "./http";
import type { ChatMessage, Mode } from "@/types";

export interface ChatStreamHandlers {
  onMeta?: (data: Record<string, unknown>) => void;
  onDelta?: (text: string) => void;
  onDone?: (data: Record<string, unknown>) => void;
  onError?: (code: string, message: string) => void;
}

export interface ChatStreamBody {
  message: string;
  mode: Mode;
  companion_id: string;
  nickname?: string;
  likes?: string[];
  history?: ChatMessage[];
  session_id?: string;
  persist?: boolean;
}

export function streamChat(
  body: ChatStreamBody,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const url = `${apiBase()}/v1/chat/stream`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": getClientId(),
    },
    body: JSON.stringify({
      ...body,
      client_id: getClientId(),
      persist: body.persist !== false,
    }),
    signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) {
      let message = "现在有点忙，稍后再试一下吧";
      try {
        const j = await res.json();
        if (j?.error?.message) message = j.error.message;
      } catch {
        /* ignore */
      }
      throw new ApiError("upstream_unavailable", message);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let eventName = "message";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n");
      buf = parts.pop() || "";
      for (const line of parts) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          const raw = line.slice(5).trim();
          if (!raw) continue;
          let data: Record<string, unknown> = {};
          try {
            data = JSON.parse(raw);
          } catch {
            continue;
          }
          if (eventName === "meta") handlers.onMeta?.(data);
          else if (eventName === "delta" && typeof data.text === "string") {
            handlers.onDelta?.(data.text);
          } else if (eventName === "done") handlers.onDone?.(data);
          else if (eventName === "error") {
            handlers.onError?.(
              String(data.code || "error"),
              String(data.message || "现在有点忙，稍后再试一下吧"),
            );
          }
          eventName = "message";
        } else if (line.trim() === "") {
          eventName = "message";
        }
      }
    }
  });
}
