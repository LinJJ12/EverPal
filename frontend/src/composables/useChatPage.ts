import { nextTick, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import { useChatStream } from "@/composables/useChatStream";
import { useTopicCards } from "@/composables/useTopicCards";
import {
  setActiveSessionId,
  setSessionForCompanion,
} from "@/utils/activeSession";
import type { ChatMessage, ChatSource } from "@/types";

type UiMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
};

export function useChatPage() {
  const store = useProfileStore();
  const { nickname, mode, companionId, likeLabels, sessionId, companion } = storeToRefs(store);
  const { streaming, error, send, stop } = useChatStream();
  const { topics } = useTopicCards();
  const messages = ref<UiMessage[]>([]);
  const input = ref("");
  const wikiMode = ref(false);
  const listEl = ref<HTMLElement | null>(null);

  function rememberSession(sid?: string | null) {
    if (!sid) return;
    store.sessionId = sid;
    setActiveSessionId(sid);
    setSessionForCompanion(companionId.value, sid);
  }

  function resetWikiMode() {
    wikiMode.value = false;
  }

  async function scrollBottom() {
    await nextTick();
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
  }

  /**
   * @param text optional override (topic / regen)
   * @param opts.useWiki force encyclopedia for this turn (e.g. regen of a wiki reply)
   */
  async function submit(text?: string, opts?: { useWiki?: boolean }) {
    const msg = (text ?? input.value).trim();
    if (!msg || streaming.value) return;
    input.value = "";
    // Capture then clear immediately (one-shot); do not wait for SSE done/meta.
    const useWiki = opts?.useWiki ?? wikiMode.value;
    wikiMode.value = false;
    let assistantIdx = -1;
    await send(
      {
        message: msg,
        mode: mode.value,
        companion_id: companionId.value,
        nickname: nickname.value,
        likes: likeLabels.value,
        session_id: sessionId.value || undefined,
        use_wiki: useWiki,
        history: messages.value.map(
          (m): ChatMessage => ({ role: m.role, content: m.content }),
        ),
      },
      {
        onUser: (t) => {
          messages.value.push({ role: "user", content: t });
          scrollBottom();
        },
        onAssistantStart: () => {
          messages.value.push({ role: "assistant", content: "" });
          assistantIdx = messages.value.length - 1;
          scrollBottom();
        },
        onDelta: (t) => {
          if (assistantIdx >= 0) {
            messages.value[assistantIdx].content += t;
            scrollBottom();
          }
        },
        onDone: (sid, sources) => {
          rememberSession(sid);
          if (assistantIdx >= 0 && sources?.length) {
            const cur = messages.value[assistantIdx];
            messages.value[assistantIdx] = { ...cur, sources };
          }
          if (error.value && assistantIdx >= 0 && !messages.value[assistantIdx].content) {
            messages.value[assistantIdx].content = error.value;
          }
        },
      },
    );
    if (error.value && assistantIdx >= 0 && !messages.value[assistantIdx]?.content) {
      messages.value[assistantIdx].content = error.value;
    }
  }

  /** Start a blank chat: detach the *current* companion's active thread (server history kept). */
  function clear() {
    stop();
    messages.value = [];
    resetWikiMode();
    const cid = companionId.value;
    store.sessionId = null;
    setActiveSessionId(null);
    setSessionForCompanion(cid, null);
  }

  // Switching companion must not keep百科 lit for the next chat.
  watch(companionId, () => {
    resetWikiMode();
  });

  return {
    messages,
    input,
    wikiMode,
    listEl,
    streaming,
    error,
    companion,
    topics,
    submit,
    stop,
    clear,
    resetWikiMode,
  };
}
