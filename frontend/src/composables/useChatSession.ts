import { ref, watch, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import { ApiError } from "@/api/http";
import { friendlyError } from "@/utils/errors";
import {
  getActiveSessionId,
  setActiveSessionId,
  setSessionForCompanion,
} from "@/utils/activeSession";

type ChatMsg = { role: "user" | "assistant"; content: string };

/** Shared across ChatView remounts so a stale getSession cannot reattach sessionId. */
let chatSessionLoadSeq = 0;

/**
 * Session load / companion switch / refresh-safe bootstrap for /chat.
 */
export function useChatSession(opts: {
  messages: Ref<ChatMsg[]>;
  submit: (text?: string) => void | Promise<unknown>;
  stopStream: () => void;
  stopSpeak: () => void;
}) {
  const store = useProfileStore();
  const { companion } = storeToRefs(store);
  const route = useRoute();
  const router = useRouter();

  const sessionLoading = ref(false);
  const sessionLoadError = ref("");
  const sideError = ref("");

  async function stripSeedQuery() {
    if (route.path !== "/chat") return;
    if (typeof route.query.seed !== "string" || !route.query.seed) return;
    const nextQuery = { ...route.query };
    delete nextQuery.seed;
    await router.replace({ path: "/chat", query: nextQuery });
  }

  async function loadSessionById(sid: string): Promise<boolean> {
    const gen = ++chatSessionLoadSeq;
    sessionLoading.value = true;
    sessionLoadError.value = "";
    try {
      const { getSession } = await import("@/api/sessions");
      const s = await getSession(sid);
      if (gen !== chatSessionLoadSeq) return false;
      store.sessionId = s.id;
      setActiveSessionId(s.id);
      setSessionForCompanion(s.companion_id || store.companionId, s.id);
      opts.messages.value = (s.messages || [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const companion_id = s.companion_id || store.companionId;
      const restoredMode = "child";
      if (gen !== chatSessionLoadSeq) return false;
      try {
        await store.save({ companion_id, mode: restoredMode });
      } catch {
        if (gen !== chatSessionLoadSeq) return false;
        store.companionId = companion_id;
        store.mode = restoredMode;
        store.applyModeChrome();
      }
      return true;
    } catch (e) {
      if (gen !== chatSessionLoadSeq) return false;
      sessionLoadError.value = friendlyError(e);
      opts.messages.value = [];
      if (e instanceof ApiError && e.code === "not_found") {
        store.sessionId = null;
        setActiveSessionId(null);
      }
      return false;
    } finally {
      if (gen === chatSessionLoadSeq) {
        sessionLoading.value = false;
      }
    }
  }

  async function pickCompanion(id: string) {
    if (id === companion.value?.id) return;
    sideError.value = "";
    const previousId = companion.value?.id || store.companionId;
    try {
      await store.save({ companion_id: id });
      // New blank chat for this companion; resume old threads only via history.
      chatSessionLoadSeq += 1;
      sessionLoadError.value = "";
      opts.stopSpeak();
      opts.stopStream();
      opts.messages.value = [];
      store.sessionId = null;
      setActiveSessionId(null);
      if (previousId) setSessionForCompanion(previousId, null);
      setSessionForCompanion(id, null);
    } catch (e) {
      sideError.value = friendlyError(e);
    }
  }

  /**
   * Refresh-safe bootstrap:
   * 1) ?session= from history
   * 2) persisted active session (matching companion; leftover ?seed= must NOT start a new chat)
   * 3) fresh ?seed= only when there is no usable active session
   */
  async function bootstrapChat() {
    const qSession = route.query.session;
    if (typeof qSession === "string" && qSession.trim()) {
      await loadSessionById(qSession.trim());
      return;
    }

    const active = (store.sessionId || getActiveSessionId() || "").trim();
    if (active) {
      try {
        const { getSession } = await import("@/api/sessions");
        const s = await getSession(active);
        const want = store.companionId;
        if (s.companion_id && want && s.companion_id !== want) {
          // Stale pointer for another companion — drop so ?seed= can still run
          store.sessionId = null;
          setActiveSessionId(null);
        } else {
          if (typeof route.query.seed === "string" && route.query.seed.trim()) {
            await stripSeedQuery();
          }
          await loadSessionById(active);
          return;
        }
      } catch {
        // Missing/corrupt active — clear and fall through to seed or empty
        store.sessionId = null;
        setActiveSessionId(null);
      }
    }

    const seed = route.query.seed;
    if (typeof seed === "string" && seed.trim()) {
      const text = seed.trim();
      chatSessionLoadSeq += 1;
      store.sessionId = null;
      setActiveSessionId(null);
      opts.messages.value = [];
      await stripSeedQuery();
      sessionLoadError.value = "";
      await opts.submit(text);
    }
  }

  function clearSessionError() {
    sessionLoadError.value = "";
  }

  // History list → /chat?session= while ChatView may already be mounted
  watch(
    () => route.query.session,
    (sid, prev) => {
      if (typeof sid === "string" && sid.trim() && sid !== prev) {
        opts.stopSpeak();
        void loadSessionById(sid.trim());
      }
    },
  );

  return {
    sessionLoading,
    sessionLoadError,
    sideError,
    pickCompanion,
    loadSessionById,
    bootstrapChat,
    clearSessionError,
  };
}
