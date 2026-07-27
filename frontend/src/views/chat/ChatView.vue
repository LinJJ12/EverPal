<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import { useChatPage } from "@/composables/useChatPage";
import { useChatSession } from "@/composables/useChatSession";
import { useChatSpeak } from "@/composables/useChatSpeak";
import { useMoodGate } from "@/composables/useMoodGate";
import ChatBubble from "@/components/chat/ChatBubble.vue";
import ChatComposer from "@/components/chat/ChatComposer.vue";
import ChatSources from "@/components/chat/ChatSources.vue";
import TopicCards from "@/components/chat/TopicCards.vue";
import CompanionAvatar from "@/components/companions/CompanionAvatar.vue";
import MoodGate from "@/components/mood/MoodGate.vue";
import { COMPANION_SAMPLES } from "@/content/openers";
import { getChatSidebarOpen, setChatSidebarOpen } from "@/utils/chatSidebar";

const store = useProfileStore();
const { companion, nickname, likeLabels, companions } = storeToRefs(store);
const {
  messages,
  input,
  wikiMode,
  listEl,
  streaming,
  error,
  topics,
  submit,
  stop,
  clear,
  resetWikiMode,
} = useChatPage();

/** Filled after useChatSpeak so session switch can stop TTS without circular init. */
const speakHold: { stop: () => void } = {
  stop() {
    /* no-op until useChatSpeak wires stopAllSpeak */
  },
};

const {
  sessionLoading,
  sessionLoadError,
  sideError,
  pickCompanion,
  bootstrapChat,
  clearSessionError,
} = useChatSession({
  messages,
  submit,
  stopStream: stop,
  stopSpeak: () => speakHold.stop(),
  resetLocalUi: resetWikiMode,
});

const {
  ttsSupported,
  speaking,
  speakPaused,
  speakRatio,
  ttsError,
  speakingIndex,
  startSpeakAt,
  pauseSpeakAt,
  resumeSpeakAt,
  restartSpeakAt,
  cancelSpeakAt,
  stopAllSpeak,
} = useChatSpeak({
  messages,
  streaming,
  sessionLoading,
  companionId: () => companion.value?.id || store.companionId || "nuan",
});
speakHold.stop = stopAllSpeak;

const {
  moodGateNeeded,
  moodBusy,
  moodError,
  todayMoodLabel,
  todayMoodId,
  moodDayKey,
  moodEditorOpen,
  moodFetchFailed,
  moodBlocksChat,
  moodChipEmoji,
  onMoodPick,
  openMoodEditor,
  closeMoodEditor,
  onMoodChipClick,
} = useMoodGate({ onReadyToChat: () => bootstrapChat() });

const sidebarOpen = ref(getChatSidebarOpen(true));

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
  // Only persist desktop preference; mobile drawer is ephemeral
  if (typeof window !== "undefined" && window.matchMedia("(min-width: 961px)").matches) {
    setChatSidebarOpen(sidebarOpen.value);
  }
}

onMounted(() => {
  if (window.matchMedia("(max-width: 960px)").matches) {
    sidebarOpen.value = false;
  }
});

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

function onSubmit(text?: string, sendOpts?: { useWiki?: boolean }) {
  if (moodBlocksChat.value) return;
  clearSessionError();
  return submit(text, sendOpts);
}

function onClear() {
  clearSessionError();
  stopAllSpeak();
  clear();
}

function onStopStream() {
  stopAllSpeak();
  stop();
}

function regen() {
  const lastUser = [...messages.value].reverse().find((m) => m.role === "user");
  if (!lastUser || streaming.value) return;
  const last = messages.value[messages.value.length - 1];
  const wasWiki =
    last?.role === "assistant" && Array.isArray(last.sources) && last.sources.length > 0;
  if (messages.value.length && messages.value[messages.value.length - 1].role === "assistant") {
    messages.value.pop();
  }
  if (messages.value.length && messages.value[messages.value.length - 1].role === "user") {
    messages.value.pop();
  }
  onSubmit(lastUser.content, wasWiki ? { useWiki: true } : undefined);
}
</script>

<template>
  <main class="page page-chat">
    <MoodGate
      v-if="moodGateNeeded === true || moodEditorOpen"
      :busy="moodBusy"
      :day-key="moodDayKey"
      :selected="todayMoodId"
      :error="moodError"
      :show-cancel="moodEditorOpen && moodGateNeeded !== true"
      :title="moodEditorOpen ? '改一改今天的心情' : '今天心情怎么样？'"
      @pick="onMoodPick"
      @cancel="closeMoodEditor"
    />
    <div
      v-else-if="moodGateNeeded === null"
      class="mood-gate mood-gate-loading"
      role="status"
      aria-live="polite"
    >
      <div class="mood-bookmark">
        <div class="mood-bookmark-ribbon" aria-hidden="true">
          <span class="mood-bookmark-ribbon-text">今日心情</span>
        </div>
        <div class="mood-bookmark-body">
          <p class="mood-bookmark-lead" style="margin: 12px 0 0">稍等，正在翻开今天的书签…</p>
        </div>
      </div>
    </div>
    <p v-if="moodError && moodGateNeeded !== true && !moodEditorOpen" class="note chat-mood-error">
      {{ moodError }}
    </p>

    <div
      class="chat-layout"
      :class="{ 'sidebar-open': sidebarOpen, 'side-open': sidebarOpen }"
      id="chatLayout"
    >
      <button
        v-show="sidebarOpen"
        type="button"
        class="chat-sidebar-backdrop"
        aria-label="关闭侧栏"
        @click="toggleSidebar"
      />
      <aside class="chat-side" aria-label="伙伴与记忆" :aria-hidden="!sidebarOpen">
        <div class="chat-side-top">
          <h2>我的伙伴</h2>
          <button
            type="button"
            class="chat-rail-btn"
            aria-label="收起侧栏"
            title="收起侧栏"
            @click="toggleSidebar"
          >
            ⟨
          </button>
        </div>
        <div class="side-list">
          <button
            v-for="c in companions"
            :key="c.id"
            type="button"
            class="companion"
            :class="{ selected: c.id === companion?.id }"
            @click="pickCompanion(c.id)"
          >
            <CompanionAvatar :companion-id="c.id" />
            <div class="companion-text">
              <div class="choice-title">{{ c.name }}</div>
              <div class="choice-desc">{{ c.role }}</div>
            </div>
          </button>
        </div>
        <p v-if="sideError" class="note chat-side-error">
          {{ sideError }}
        </p>
        <div class="chat-side-memory">
          <h2>本机记忆</h2>
          <p class="note chat-side-nick">
            昵称：{{ nickname || "（未设）" }}
          </p>
          <div class="tag-cloud">
            <span v-for="l in likeLabels" :key="l" class="tag on">{{ l }}</span>
          </div>
        </div>
        <div class="chat-side-links">
          <RouterLink class="chat-side-link chat-side-link-primary" to="/history">
            历史对话
          </RouterLink>
          <RouterLink class="chat-side-link" to="/scenes">情境对话</RouterLink>
          <RouterLink class="chat-side-link" to="/memory">记忆面板</RouterLink>
          <RouterLink class="chat-side-link" to="/settings">本地设置</RouterLink>
        </div>
        <div class="chat-side-status">
          <button
            v-if="todayMoodLabel"
            type="button"
            class="chip mode-badge mood-chip"
            @click="openMoodEditor"
          >
            <span aria-hidden="true">{{ moodChipEmoji }}</span>
            今日：{{ todayMoodLabel }}
          </button>
          <button
            v-else-if="moodGateNeeded === false && !todayMoodLabel"
            type="button"
            class="chip mode-badge mood-chip"
            @click="onMoodChipClick"
          >
            <span aria-hidden="true">📖</span>
            {{ moodFetchFailed ? "心情暂不可用" : "补选今日心情" }}
          </button>
          <span class="chip mode-badge">未成年人陪伴</span>
        </div>
      </aside>

      <section class="chat-shell">
        <header class="chat-header">
          <button
            type="button"
            class="chat-rail-btn chat-rail-btn-open"
            :aria-expanded="sidebarOpen"
            :aria-label="sidebarOpen ? '收起侧栏' : '展开侧栏'"
            :title="sidebarOpen ? '收起侧栏' : '展开侧栏'"
            @click="toggleSidebar"
          >
            {{ sidebarOpen ? "⟨" : "☰" }}
          </button>
          <CompanionAvatar
            class="mini-avatar"
            :companion-id="companion?.id || 'nuan'"
          />
          <div class="chat-header-meta">
            <div class="chat-header-name">{{ companion?.name || "伙伴" }}</div>
            <div class="chat-header-sub">{{ headerSub }}</div>
          </div>
          <div class="chat-header-actions">
            <button
              type="button"
              class="chat-action"
              :disabled="!streaming"
              @click="onStopStream()"
            >
              停止
            </button>
            <button
              type="button"
              class="chat-action"
              :disabled="streaming || !messages.some((m) => m.role === 'user')"
              @click="regen"
            >
              重新生成
            </button>
            <span class="chat-action-muted" title="会话已自动保存到服务端">已保存</span>
            <RouterLink class="chat-action" to="/history">历史</RouterLink>
            <button type="button" class="chat-action chat-action-accent" @click="onClear()">
              新建对话
            </button>
          </div>
        </header>

        <div class="chat-thread">
          <div ref="listEl" class="chat-messages">
            <div class="chat-col">
              <p v-if="sessionLoading" class="chat-empty-hint">正在加载会话…</p>
              <p v-else-if="sessionLoadError" class="chat-empty-hint chat-empty-error">
                {{ sessionLoadError }}
              </p>
              <p v-else-if="!messages.length" class="chat-empty-hint">{{ emptyHint }}</p>
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
                <ChatSources
                  v-if="
                    m.role === 'assistant' &&
                    m.sources?.length &&
                    m.content.trim() &&
                    !(streaming && i === messages.length - 1)
                  "
                  :sources="m.sources"
                />
                <div
                  v-if="m.role === 'assistant' && m.content.trim() && !(streaming && i === messages.length - 1)"
                  class="bubble-speak-row"
                >
                  <template v-if="speaking && speakingIndex === i">
                    <template v-if="speakPaused">
                      <button
                        type="button"
                        class="bubble-speak"
                        :disabled="sessionLoading"
                        @click="resumeSpeakAt(i)"
                      >
                        继续朗读
                      </button>
                      <button
                        type="button"
                        class="bubble-speak"
                        :disabled="sessionLoading"
                        @click="restartSpeakAt(i)"
                      >
                        重新朗读
                      </button>
                    </template>
                    <button
                      v-else-if="speakRatio < 0"
                      type="button"
                      class="bubble-speak"
                      :disabled="sessionLoading"
                      aria-pressed="true"
                      @click="cancelSpeakAt(i)"
                    >
                      取消
                    </button>
                    <button
                      v-else
                      type="button"
                      class="bubble-speak"
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
                    class="bubble-speak"
                    :disabled="!ttsSupported || sessionLoading"
                    @click="startSpeakAt(i)"
                  >
                    朗读
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p v-if="error" class="note chat-stream-error">{{ error }}</p>
          <p v-else-if="ttsError" class="note chat-stream-error">{{ ttsError }}</p>

          <div class="chat-dock">
            <div class="chat-col chat-dock-inner">
              <TopicCards
                v-if="messages.length === 0 && !streaming"
                :topics="topics"
                :disabled="sessionLoading || moodBlocksChat"
                @pick="onSubmit"
              />
              <ChatComposer
                v-model="input"
                v-model:wiki-mode="wikiMode"
                :disabled="streaming || sessionLoading || moodBlocksChat"
                :streaming="streaming"
                @send="onSubmit()"
                @stop="onStopStream()"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
