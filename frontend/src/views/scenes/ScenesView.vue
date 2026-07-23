<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { useProfileStore } from "@/stores/profile";
import { SCENE_CARDS } from "@/utils/avatars";

const store = useProfileStore();
const router = useRouter();

async function enter(scene: (typeof SCENE_CARDS)[number]) {
  try {
    await store.save({ mode: scene.mode, companion_id: scene.companion_id });
  } catch {
    /* still navigate */
  }
  router.push({ path: "/chat", query: { seed: scene.seed } });
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
      <p class="lead">挑一个日常情境，进入聊天并由伙伴真正回复（需后端已启动）。</p>
      <div class="path-stage-body">
        <div class="scene-grid">
          <button
            v-for="s in SCENE_CARDS"
            :key="s.id"
            type="button"
            class="scene-card"
            @click="enter(s)"
          >
            <span class="theme-tag">{{ s.theme }}</span>
            <h3>{{ s.title }}</h3>
            <p class="choice-desc" style="margin: 0">{{ s.desc }}</p>
            <p class="note" style="margin: 0; text-align: left">
              伙伴：{{ companionName(s.companion_id) }} · 模式：{{
                s.mode === "child" ? "儿童" : "成人"
              }}
            </p>
            <span class="btn btn-primary" style="align-self: flex-start; pointer-events: none">
              进入对话
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
