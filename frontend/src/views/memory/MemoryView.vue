<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import { clearMemories, fetchProfile } from "@/api/profile";
import type { MemoryCategory } from "@/types";

const store = useProfileStore();
const { nickname, likeLabels, memories, companion } = storeToRefs(store);
const hint = ref("");

const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  like: "喜欢",
  dislike: "不喜欢",
  event: "事件",
  preference: "偏好",
};

function categoryLabel(category?: string): string {
  if (category && category in CATEGORY_LABELS) {
    return CATEGORY_LABELS[category as MemoryCategory];
  }
  return "偏好";
}

onMounted(async () => {
  try {
    const p = await fetchProfile();
    store.memories = p.memories || [];
  } catch {
    /* ignore */
  }
});

async function clear() {
  if (!confirm("确定清除近期记忆条？昵称与喜好会保留。")) return;
  await clearMemories();
  store.memories = [];
  hint.value = "已清除记忆条，昵称与喜好仍保留";
  setTimeout(() => (hint.value = ""), 4000);
}
</script>

<template>
  <main class="page page-path">
    <section class="path-stage shell-stage" aria-label="轻量记忆">
      <div class="path-stage-glow shell-stage-glow" aria-hidden="true" />
      <h1>轻量记忆</h1>
      <p class="lead">昵称、喜好与近期摘要留在本机标识下，可随时查看或清除。</p>
      <div class="path-stage-body">
        <section class="card stack">
          <div class="choice-title">档案摘要</div>
          <p class="note" style="margin: 0">
            昵称：{{ nickname || "（未设）" }} · 未成年人陪伴
            · 伙伴：{{ companion?.name || "—" }}
          </p>
          <div class="tag-cloud">
            <span v-for="l in likeLabels" :key="l" class="tag on">{{ l }}</span>
            <span v-if="!likeLabels.length" class="note">还没有喜好标签，可在「档案」页点选。</span>
          </div>
        </section>
        <section class="card stack">
          <div class="choice-title">近期记忆条</div>
          <div class="memory-list">
            <p v-if="!memories.length" class="note" style="margin: 0">暂无记忆条。</p>
            <div v-for="m in memories" :key="m.id || m.text" class="memory-item">
              <div>
                <span class="tag on" style="margin-right: 8px">{{ categoryLabel(m.category) }}</span>
                {{ m.text }}
              </div>
              <time v-if="m.created_at">{{ new Date(m.created_at * 1000).toLocaleString() }}</time>
            </div>
          </div>
          <p
            v-if="hint"
            class="note"
            style="margin: 0; text-align: left; color: var(--color-secondary)"
          >
            {{ hint }}
          </p>
          <button type="button" class="btn btn-secondary btn-block" @click="clear">
            清除记忆条（保留昵称）
          </button>
        </section>
      </div>
      <div class="shell-hero-actions footer-actions">
        <RouterLink class="btn btn-secondary btn-lg" to="/profile">去改档案</RouterLink>
        <RouterLink class="btn btn-primary btn-lg" to="/chat">回聊天</RouterLink>
      </div>
    </section>
  </main>
</template>
