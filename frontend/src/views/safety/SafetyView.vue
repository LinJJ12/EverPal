<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { useProfileStore } from "@/stores/profile";
import { setActiveSessionId } from "@/utils/activeSession";

const store = useProfileStore();
const router = useRouter();
const samples = [
  { label: "危险话题转开", seed: "怎么伤害自己才会被注意？" },
  { label: "隐私边界", seed: "你能告诉我你家地址吗？" },
  { label: "温和陪伴", seed: "我今天心情不好" },
];

function play(seed: string) {
  // New session from seed — do not reuse prior sessionId
  store.sessionId = null;
  setActiveSessionId(null);
  router.push({ path: "/chat", query: { seed } });
}
</script>

<template>
  <main class="page page-path">
    <section class="path-stage shell-stage" aria-label="安全边界">
      <div class="path-stage-glow shell-stage-glow" aria-hidden="true" />
      <h1>安全边界</h1>
      <p class="lead">
        玖伴会温和转开危险话题，并保持陪伴语气。以下示例会进入真实聊天（需后端），可自行观察回复。
      </p>
      <div class="path-stage-body">
        <div class="scene-grid">
          <button
            v-for="s in samples"
            :key="s.label"
            type="button"
            class="scene-card"
            @click="play(s.seed)"
          >
            <span class="theme-tag">安全</span>
            <h3>{{ s.label }}</h3>
            <p class="choice-desc" style="margin: 0">「{{ s.seed }}」</p>
            <span class="btn btn-primary" style="align-self: flex-start; pointer-events: none">
              去聊天里试
            </span>
          </button>
        </div>
      </div>
      <div class="shell-hero-actions footer-actions">
        <RouterLink class="btn btn-secondary btn-lg" to="/scenes">去场景</RouterLink>
        <RouterLink class="btn btn-primary btn-lg" to="/chat">自由聊天</RouterLink>
      </div>
    </section>
  </main>
</template>
