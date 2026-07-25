<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import { useChatPage } from "@/composables/useChatPage";
import { useSpeechSynthesis } from "@/composables/useSpeechSynthesis";
import ChatBubble from "@/components/chat/ChatBubble.vue";
import ChatComposer from "@/components/chat/ChatComposer.vue";
import TopicCards from "@/components/chat/TopicCards.vue";
import CompanionAvatar from "@/components/companions/CompanionAvatar.vue";
import { COMPANION_SAMPLES } from "@/utils/avatars";
import { friendlyError } from "@/utils/errors";
import { ApiError } from "@/api/http";
import { getActiveSessionId, setActiveSessionId, getSessionForCompanion, setSessionForCompanion } from "@/utils/activeSession";

/** Shared across ChatView remounts so a stale getSession cannot reattach sessionId. */
let chatSessionLoadSeq = 0;

const store = useProfileStore();
const { companion, nickname, likeLabels, mode, companions } = storeToRefs(store);
const {
  messages,
  input,
  listEl,
  streaming,
  error,
  topics,
  submit,
  stop,
  clear,
} = useChatPage();
const tts = useSpeechSynthesis();
const ttsSupported = tts.supported;
const speaking = tts.speaking;
const speakPaused = tts.paused;
const speakRatio = tts.progressRatio;
const ttsError = tts.error;
const speak = tts.speak;
const pauseSpeak = tts.pause;
const resumeSpeak = tts.resume;
const stopSpeak = tts.stop;
const route = useRoute();
const router = useRouter();
const sideOpen = ref(false);
const sessionLoading = ref(false);
const sessionLoadError = ref("");
const sideError = ref("");
/** Which assistant message index is being read aloud (null = none). */
const speakingIndex = ref<number | null>(null);

const headerSub = computed(() => {
  if (nickname.value && likeLabels.value.length) {
    return `${nickname.value} · 喜欢${likeLabels.value[0]}`;
  }
  if (nickname.value) return `${nickname.value}，我在呀`;
  return "我在呀";
});

const emptyHint = computed(() => {
  const id = companion.value?.id || "nuan";
  const name = companion.value?.name || "伙伴";
  if (nickname.value && likeLabels.value.length) {
    return `${name}在这儿。${nickname.value}好呀，还喜欢${likeLabels.value[0]}吗？今天想聊点什么？`;
  }
  return COMPANION_SAMPLES[id] || COMPANION_SAMPLES.nuan;
});

async function pickCompanion(id: string) {
  if (id === companion.value?.id) return;
  sideError.value = "";
  try {
    await store.save({ companion_id: id });
    chatSessionLoadSeq += 1;
    sessionLoadError.value = "";
    stopSpeak();
    speakingIndex.value = null;
    stop();
    // Switch to this companion's last thread (if any); do not wipe other companions' maps
    const sid = await resolveSessionForCompanion(id);
    if (sid) {
      await loadSessionById(sid);
    } else {
      messages.value = [];
      store.sessionId = null;
      setActiveSessionId(null);
    }
  } catch (e) {
    sideError.value = friendlyError(e);
  }
}

async function resolveSessionForCompanion(companionId: string): Promise<string | null> {
  const cached = getSessionForCompanion(companionId);
  if (cached) return cached;
  try {
    const { listSessions } = await import("@/api/sessions");
    const res = await listSessions();
    const hit = (res.sessions || []).find((s) => s.companion_id === companionId);
    if (hit?.id) {
      setSessionForCompanion(companionId, hit.id);
      return hit.id;
    }
  } catch {
    /* offline — fall through to empty */
  }
  return null;
}

function onSubmit(text?: string) {
  sessionLoadError.value = "";
  return submit(text);
}

function onClear() {
  sessionLoadError.value = "";
  speakingIndex.value = null;
  stopSpeak();
  clear();
}

function canSpeakMessage(index: number): boolean {
  if (!ttsSupported || streaming.value || sessionLoading.value) return false;
  const m = messages.value[index];
  if (!m || m.role !== "assistant") return false;
  if (!m.content.trim()) return false;
  // Don't offer speak on the in-flight streaming bubble
  if (streaming.value && index === messages.value.length - 1) return false;
  return true;
}

function startSpeakAt(index: number) {
  if (!canSpeakMessage(index)) return;
  const text = messages.value[index]?.content?.trim();
  if (!text) return;
  if (speaking.value) stopSpeak();
  speakingIndex.value = index;
  speak(text, companion.value?.id || store.companionId || "nuan");
}

function pauseSpeakAt(index: number) {
  if (speakingIndex.value !== index) return;
  pauseSpeak();
}

function resumeSpeakAt(index: number) {
  if (speakingIndex.value !== index) return;
  if (!resumeSpeak()) {
    // Browser lost the paused utterance — restart this bubble.
    startSpeakAt(index);
  }
}

function restartSpeakAt(index: number) {
  startSpeakAt(index);
}

function cancelSpeakAt(index: number) {
  if (speakingIndex.value !== index) return;
  speakingIndex.value = null;
  stopSpeak();
}

function onStopStream() {
  speakingIndex.value = null;
  stopSpeak();
  stop();
}

function regen() {
  const lastUser = [...messages.value].reverse().find((m) => m.role === "user");
  if (!lastUser || streaming.value) return;
  if (messages.value.length && messages.value[messages.value.length - 1].role === "assistant") {
    messages.value.pop();
  }
  if (messages.value.length && messages.value[messages.value.length - 1].role === "user") {
    messages.value.pop();
  }
  onSubmit(lastUser.content);
}

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
    messages.value = (s.messages || [])
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
    messages.value = [];
    // Keep id on network errors so refresh can retry; only drop on definitive miss
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

/**
 * Refresh-safe bootstrap:
 * 1) ?session= from history
 * 2) persisted active session (leftover ?seed= must NOT start a new chat)
 * 3) fresh ?seed= only when there is no active session
 */
async function bootstrapChat() {
  const qSession = route.query.session;
  if (typeof qSession === "string" && qSession.trim()) {
    await loadSessionById(qSession.trim());
    return;
  }

  const active = (store.sessionId || getActiveSessionId() || "").trim();
  if (active) {
    if (typeof route.query.seed === "string" && route.query.seed.trim()) {
      await stripSeedQuery();
    }
    await loadSessionById(active);
    return;
  }

  const seed = route.query.seed;
  if (typeof seed === "string" && seed.trim()) {
    const text = seed.trim();
    chatSessionLoadSeq += 1;
    store.sessionId = null;
    setActiveSessionId(null);
    messages.value = [];
    // Remove seed from the URL first so a refresh cannot re-fire a new opener
    await stripSeedQuery();
    await onSubmit(text);
  }
}

onMounted(() => {
  void bootstrapChat();
});

onBeforeUnmount(() => {
  speakingIndex.value = null;
  stopSpeak();
});

watch(streaming, (busy) => {
  if (busy) {
    speakingIndex.value = null;
    stopSpeak();
  }
});

watch(speaking, (on) => {
  if (on) return;
  // speak() briefly sets speaking=false during cancel when switching bubbles;
  // defer so the new speak() can set speaking=true before we clear the index.
  queueMicrotask(() => {
    if (!speaking.value) speakingIndex.value = null;
  });
});

// History list → /chat?session= while ChatView may already be mounted
watch(
  () => route.query.session,
  (sid, prev) => {
    if (typeof sid === "string" && sid.trim() && sid !== prev) {
      stopSpeak();
      void loadSessionById(sid.trim());
    }
  },
);
</script>

<template>
  <main class="page page-chat">
    <div class="page-head" style="margin-bottom: 16px">
      <div>
        <h1>聊天</h1>
        <p class="lead" style="margin: 0">随时聊聊。回复来自陪伴服务，不会在这里配置模型。</p>
      </div>
      <span class="chip mode-badge">未成年人陪伴</span>
    </div>

    <div class="chat-layout" :class="{ 'side-open': sideOpen }" id="chatLayout">
      <aside class="chat-side" aria-label="伙伴与记忆">
        <h2>我的伙伴</h2>
        <div class="side-list">
          <button
            v-for="c in companions"
            :key="c.id"
            type="button"
            class="companion"
            :class="{ selected: c.id === companion?.id }"
            style="width: 100%; text-align: left"
            @click="pickCompanion(c.id)"
          >
            <CompanionAvatar :companion-id="c.id" />
            <div>
              <div class="choice-title">{{ c.name }}</div>
              <div class="choice-desc">{{ c.role }}</div>
            </div>
          </button>
        </div>
        <p v-if="sideError" class="note" style="margin: 0; text-align: left; color: var(--color-primary)">
          {{ sideError }}
        </p>
        <h2>本机记忆快照</h2>
        <p class="note" style="margin: 0; text-align: left">
          昵称：{{ nickname || "（未设）" }}
        </p>
        <div class="tag-cloud">
          <span v-for="l in likeLabels" :key="l" class="tag on">{{ l }}</span>
        </div>
        <RouterLink class="btn btn-secondary btn-block" to="/scenes">情境对话</RouterLink>
        <RouterLink class="btn btn-secondary btn-block" to="/memory">记忆面板</RouterLink>
        <RouterLink class="btn btn-secondary btn-block" to="/settings">本地设置</RouterLink>
      </aside>

      <section class="chat-shell">
        <button
          type="button"
          class="btn btn-secondary chat-side-toggle"
          :aria-expanded="sideOpen"
          @click="sideOpen = !sideOpen"
        >
          伙伴 / 记忆
        </button>

        <header class="chat-header">
          <CompanionAvatar
            class="mini-avatar"
            :companion-id="companion?.id || 'nuan'"
          />
          <div>
            <div
              style="
                font-weight: 800;
                font-family: var(--font-display);
                font-size: 1.15rem;
              "
            >
              {{ companion?.name || "伙伴" }}
            </div>
            <div style="font-size: 0.85rem; color: var(--color-muted)">{{ headerSub }}</div>
          </div>
        </header>

        <div class="chat-toolbar">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="!streaming"
            @click="onStopStream()"
          >
            停止生成
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="streaming || !messages.some((m) => m.role === 'user')"
            @click="regen"
          >
            重新生成上一句
          </button>
          <button type="button" class="btn btn-secondary" disabled title="会话已自动保存到服务端">
            已自动保存
          </button>
          <button type="button" class="btn btn-secondary" @click="onClear()">清空屏幕</button>
        </div>

        <div ref="listEl" class="chat-messages">
          <p
            v-if="sessionLoading"
            class="note"
            style="margin: auto; text-align: center"
          >
            正在加载会话…
          </p>
          <p
            v-else-if="sessionLoadError"
            class="note"
            style="margin: auto; text-align: center; color: var(--color-primary)"
          >
            {{ sessionLoadError }}
          </p>
          <p
            v-else-if="!messages.length"
            class="note"
            style="margin: auto; text-align: center"
          >
            {{ emptyHint }}
          </p>
          <div
            v-for="(m, i) in messages"
            :key="i"
            class="chat-turn"
            :class="m.role === 'user' ? 'chat-turn-user' : 'chat-turn-bot'"
          >
            <ChatBubble
              :role="m.role"
              :text="m.content"
              :streaming="streaming && m.role === 'assistant' && i === messages.length - 1"
              :speak-ratio="speaking && speakingIndex === i ? speakRatio : -1"
              :speak-paused="speaking && speakPaused && speakingIndex === i"
            />
            <div
              v-if="m.role === 'assistant' && m.content.trim() && !(streaming && i === messages.length - 1)"
              class="bubble-speak-row"
            >
              <template v-if="speaking && speakingIndex === i">
                <template v-if="speakPaused">
                  <button
                    type="button"
                    class="btn btn-secondary bubble-speak"
                    :disabled="sessionLoading"
                    @click="resumeSpeakAt(i)"
                  >
                    继续朗读
                  </button>
                  <button
                    type="button"
                    class="btn btn-secondary bubble-speak"
                    :disabled="sessionLoading"
                    @click="restartSpeakAt(i)"
                  >
                    重新朗读
                  </button>
                </template>
                <button
                  v-else-if="speakRatio < 0"
                  type="button"
                  class="btn btn-secondary bubble-speak"
                  :disabled="sessionLoading"
                  aria-pressed="true"
                  @click="cancelSpeakAt(i)"
                >
                  取消
                </button>
                <button
                  v-else
                  type="button"
                  class="btn btn-secondary bubble-speak"
                  :disabled="sessionLoading"
                  aria-pressed="true"
                  @click="pauseSpeakAt(i)"
                >
                  暂停
                </button>
              </template>
              <button
                v-else
                type="button"
                class="btn btn-secondary bubble-speak"
                :disabled="!ttsSupported || sessionLoading"
                @click="startSpeakAt(i)"
              >
                朗读这条
              </button>
            </div>
          </div>
        </div>

        <p v-if="error" class="note" style="color: var(--color-primary)">{{ error }}</p>
        <p v-else-if="ttsError" class="note" style="color: var(--color-primary)">{{ ttsError }}</p>

        <TopicCards :topics="topics" :disabled="streaming || sessionLoading" @pick="onSubmit" />
        <ChatComposer
          v-model="input"
          :disabled="streaming || sessionLoading"
          @send="onSubmit()"
          @stop="onStopStream()"
        />
      </section>
    </div>
  </main>
</template>
