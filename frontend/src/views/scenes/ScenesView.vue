<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useProfileStore } from "@/stores/profile";
import { sceneCards, storyCards } from "@/content/packs";
import { friendlyError } from "@/utils/errors";

type EntryCard = ReturnType<typeof sceneCards>[number];

const store = useProfileStore();
const router = useRouter();
const enterError = ref("");
const scenes = sceneCards();
const stories = storyCards();

async function enter(card: EntryCard) {
  enterError.value = "";
  try {
    await store.save({ mode: card.mode, companion_id: card.companion_id });
  } catch (e) {
    enterError.value = friendlyError(e);
    return;
  }
  // New session from seed — do not reuse prior sessionId
  store.sessionId = null;
  router.push({ path: "/chat", query: { seed: card.seed } });
}

function companionName(id: string) {
  return store.companions.find((c) => c.id === id)?.name || id;
}
</script>

<template>
  <main class="page page-path">
    <section class="path-stage shell-stage" aria-label="情境对话">
      <div class="path-stage-glow shell-stage-glow" aria-hidden="true" />
      <h1>情境对话</h1>
      <p class="lead">挑一个日常情境或短故事，进入聊天并由伙伴真正回复（需后端已启动）。</p>
      <p
        v-if="enterError"
        class="note"
        style="margin: 0 0 12px; text-align: center; color: var(--color-primary)"
        role="alert"
      >
        {{ enterError }}
      </p>
      <div class="path-stage-body">
        <h2 class="section-title">日常情境</h2>
        <div class="scene-grid">
          <button
            v-for="s in scenes"
            :key="s.id"
            type="button"
            class="scene-card"
            @click="enter(s)"
          >
            <span class="theme-tag">{{ s.theme }}</span>
            <h3>{{ s.title }}</h3>
            <p class="choice-desc" style="margin: 0">{{ s.desc }}</p>
            <p class="note" style="margin: 0; text-align: left">
              伙伴：{{ companionName(s.companion_id) }}
            </p>
            <span class="btn btn-primary" style="align-self: flex-start; pointer-events: none">
              进入对话
            </span>
          </button>
        </div>

        <h2 class="section-title" style="margin-top: 28px">短故事</h2>
        <p class="note" style="margin: 0 0 12px; text-align: left">
          点开后会发出审定过的开场句，再由伙伴接着讲。
        </p>
        <div class="scene-grid">
          <button
            v-for="s in stories"
            :key="s.id"
            type="button"
            class="scene-card"
            @click="enter(s)"
          >
            <span class="theme-tag">{{ s.theme }}</span>
            <h3>{{ s.title }}</h3>
            <p class="choice-desc" style="margin: 0">{{ s.desc }}</p>
            <p class="note" style="margin: 0; text-align: left">
              伙伴：{{ companionName(s.companion_id) }}
            </p>
            <span class="btn btn-primary" style="align-self: flex-start; pointer-events: none">
              听故事
            </span>
          </button>
        </div>
      </div>
      <div class="shell-hero-actions footer-actions">
        <RouterLink class="btn btn-secondary btn-lg" to="/companions">返回角色</RouterLink>
        <RouterLink class="btn btn-primary btn-lg" to="/chat">去自由聊天</RouterLink>
      </div>
    </section>
  </main>
</template>
