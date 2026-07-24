import { nextTick, ref } from "vue";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import { useChatStream } from "@/composables/useChatStream";
import {
  setActiveSessionId,
  setSessionForCompanion,
} from "@/utils/activeSession";
import type { ChatMessage } from "@/types";

const TOPICS = [
  { label: "听个短故事", text: "我想听个短故事" },
  { label: "为什么天是蓝的", text: "为什么天是蓝的？" },
  { label: "假装去太空", text: "我们假装去太空吧！" },
  { label: "今天有点累", text: "今天有点累，想聊聊" },
];

export function useChatPage() {
  const store = useProfileStore();
  const { nickname, mode, companionId, likeLabels, sessionId, companion } = storeToRefs(store);
  const { streaming, error, send, stop } = useChatStream();
  const messages = ref<{ role: "user" | "assistant"; content: string }[]>([]);
  const input = ref("");
  const listEl = ref<HTMLElement | null>(null);

  function rememberSession(sid?: string | null) {
    if (!sid) return;
    store.sessionId = sid;
    setActiveSessionId(sid);
    setSessionForCompanion(companionId.value, sid);
  }

  async function scrollBottom() {
    await nextTick();
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
  }

  async function submit(text?: string) {
    const msg = (text ?? input.value).trim();
    if (!msg || streaming.value) return;
    input.value = "";
    let assistantIdx = -1;
    await send(
      {
        message: msg,
        mode: mode.value,
        companion_id: companionId.value,
        nickname: nickname.value,
        likes: likeLabels.value,
        session_id: sessionId.value || undefined,
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
        onDone: (sid) => {
          rememberSession(sid);
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

  /** Empty the screen and detach the *current* companion's active thread (others kept). */
  function clear() {
    stop();
    messages.value = [];
    const cid = companionId.value;
    store.sessionId = null;
    setActiveSessionId(null);
    setSessionForCompanion(cid, null);
  }

  return {
    messages,
    input,
    listEl,
    streaming,
    error,
    companion,
    topics: TOPICS,
    submit,
    stop,
    clear,
  };
}
