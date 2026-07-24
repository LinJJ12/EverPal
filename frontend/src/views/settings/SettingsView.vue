<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import { resetClientId } from "@/utils/clientId";

const store = useProfileStore();
const { nickname, companion, likeLabels, memories } = storeToRefs(store);
const hint = ref("");

const summary = computed(() => {
  const likes = likeLabels.value.join("、") || "无";
  return `昵称：${nickname.value || "（未设置）"} · 未成年人陪伴 · 伙伴：${
    companion.value?.name || "—"
  } · 喜好：${likes} · 记忆 ${(memories.value || []).length} 条`;
});

function resetLocal() {
  if (
    !confirm(
      "确定重置本机档案到默认？将换用新的本机标识并刷新页面；聊天与档案会回到默认（不清除服务端旧会话）。",
    )
  ) {
    return;
  }
  resetClientId();
  store.sessionId = null;
  location.reload();
}
</script>

<template>
  <main class="page page-path">
    <section class="path-stage shell-stage" aria-label="本地设置">
      <div class="path-stage-glow shell-stage-glow" aria-hidden="true" />
      <h1>本地设置</h1>
      <p class="lead">只保留陪伴相关选项——没有模型列表、温度或接口配置。数据跟你的本机标识走。</p>
      <div class="path-stage-body">
        <section class="card stack">
          <div>
            <div class="choice-title">当前档案</div>
            <p class="note" style="margin: 8px 0 0">{{ summary }}</p>
          </div>
          <button type="button" class="btn btn-secondary btn-block" @click="resetLocal">
            重置本机档案
          </button>
          <p v-if="hint" class="note" style="margin: 0; text-align: left; color: var(--color-primary)">
            {{ hint }}
          </p>
          <p class="note" style="margin: 0; text-align: left">
            更多：
            <RouterLink to="/profile">档案</RouterLink> ·
            <RouterLink to="/memory">记忆</RouterLink> ·
            <RouterLink to="/companions">伙伴</RouterLink>
          </p>
        </section>
      </div>
      <div class="shell-hero-actions footer-actions">
        <RouterLink class="btn btn-secondary btn-lg" to="/">回首页</RouterLink>
        <RouterLink class="btn btn-primary btn-lg" to="/scenes">去场景</RouterLink>
      </div>
    </section>
  </main>
</template>
