<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import { useChatPage } from "@/composables/useChatPage";
import { useChatSession } from "@/composables/useChatSession";
import { useChatSpeak } from "@/composables/useChatSpeak";
import { useMoodGate } from "@/composables/useMoodGate";
import ChatBubble from "@/components/chat/ChatBubble.vue";
import ChatComposer from "@/components/chat/ChatComposer.vue";
import TopicCards from "@/components/chat/TopicCards.vue";
import CompanionAvatar from "@/components/companions/CompanionAvatar.vue";
import MoodGate from "@/components/mood/MoodGate.vue";
import { COMPANION_SAMPLES } from "@/utils/avatars";

const store = useProfileStore();
const { companion, nickname, likeLabels, companions } = storeToRefs(store);
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

const sideOpen = ref(false);

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

function onSubmit(text?: string) {
  if (moodBlocksChat.value) return;
  clearSessionError();
  return submit(text);
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
  if (messages.value.length && messages.value[messages.value.length - 1].role === "assistant") {
    messages.value.pop();
  }
  if (messages.value.length && messages.value[messages.value.length - 1].role === "user") {
    messages.value.pop();
  }
  onSubmit(lastUser.content);
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
    <div class="page-head" style="margin-bottom: 16px">
      <div>
        <h1>聊天</h1>
        <p class="lead" style="margin: 0">随时聊聊。回复来自陪伴服务，不会在这里配置模型。</p>
      </div>
      <div class="chat-mood-chip-wrap">
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
          {{ moodFetchFailed ? "心情服务暂不可用，点此重试" : "补选今日心情" }}
        </button>
        <span class="chip mode-badge">未成年人陪伴</span>
      </div>
    </div>
    <p v-if="moodError && moodGateNeeded !== true && !moodEditorOpen" class="note" style="color: var(--color-primary)">
      {{ moodError }}
    </p>

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

        <TopicCards
          :topics="topics"
          :disabled="streaming || sessionLoading || moodBlocksChat"
          @pick="onSubmit"
        />
        <ChatComposer
          v-model="input"
          :disabled="streaming || sessionLoading || moodBlocksChat"
          @send="onSubmit()"
          @stop="onStopStream()"
        />
      </section>
    </div>
  </main>
</template>
