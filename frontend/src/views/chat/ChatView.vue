<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import { useChatPage } from "@/composables/useChatPage";
import ChatBubble from "@/components/chat/ChatBubble.vue";
import ChatComposer from "@/components/chat/ChatComposer.vue";
import TopicCards from "@/components/chat/TopicCards.vue";
import CompanionAvatar from "@/components/companions/CompanionAvatar.vue";
import { COMPANION_SAMPLES } from "@/utils/avatars";
import { friendlyError } from "@/utils/errors";

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
const route = useRoute();
const sideOpen = ref(false);
const sessionLoading = ref(false);
const sessionLoadError = ref("");
const sideError = ref("");

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
  } catch (e) {
    sideError.value = friendlyError(e);
  }
}

function onSubmit(text?: string) {
  sessionLoadError.value = "";
  return submit(text);
}

function onClear() {
  sessionLoadError.value = "";
  clear();
}

function regen() {
  const lastUser = [...messages.value].reverse().find((m) => m.role === "user");
  if (!lastUser || streaming.value) return;
  // drop trailing assistant if present
  if (messages.value.length && messages.value[messages.value.length - 1].role === "assistant") {
    messages.value.pop();
  }
  onSubmit(lastUser.content);
}

onMounted(() => {
  const seed = route.query.seed;
  if (typeof seed === "string" && seed.trim()) {
    onSubmit(seed.trim());
  }
});

watch(
  () => route.query.session,
  async (sid) => {
    if (typeof sid !== "string" || !sid) {
      sessionLoading.value = false;
      sessionLoadError.value = "";
      return;
    }
    sessionLoading.value = true;
    sessionLoadError.value = "";
    try {
      const { getSession } = await import("@/api/sessions");
      const s = await getSession(sid);
      store.sessionId = s.id;
      messages.value = (s.messages || [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    } catch (e) {
      sessionLoadError.value = friendlyError(e);
      messages.value = [];
      // Do not keep a prior session id — avoids sending into the wrong thread
      store.sessionId = null;
    } finally {
      sessionLoading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <main class="page page-chat">
    <div class="page-head" style="margin-bottom: 16px">
      <div>
        <h1>聊天</h1>
        <p class="lead" style="margin: 0">随时聊聊。回复来自陪伴服务，不会在这里配置模型。</p>
      </div>
      <span class="chip mode-badge">{{ mode === "child" ? "儿童模式" : "成人模式" }}</span>
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
            @click="stop()"
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
          <ChatBubble
            v-for="(m, i) in messages"
            :key="i"
            :role="m.role"
            :text="m.content || (streaming && i === messages.length - 1 ? '…' : '')"
            :streaming="streaming && m.role === 'assistant' && i === messages.length - 1"
          />
        </div>

        <p v-if="error" class="note" style="color: var(--color-primary)">{{ error }}</p>

        <TopicCards :topics="topics" :disabled="streaming || sessionLoading" @pick="onSubmit" />
        <ChatComposer
          v-model="input"
          :disabled="streaming || sessionLoading"
          @send="onSubmit()"
          @stop="stop()"
        />
      </section>
    </div>
  </main>
</template>
