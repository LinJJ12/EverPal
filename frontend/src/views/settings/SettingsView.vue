<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import { iconAdult, iconChild } from "@/utils/avatars";
import type { Mode } from "@/types";

const store = useProfileStore();
const { nickname, mode, companion, likeLabels, memories } = storeToRefs(store);
const childIcon = ref("");
const adultIcon = ref("");
const hint = ref("");

onMounted(() => {
  childIcon.value = iconChild();
  adultIcon.value = iconAdult();
});

const summary = computed(() => {
  const likes = likeLabels.value.join("、") || "无";
  return `昵称：${nickname.value || "（未设置）"} · 模式：${
    mode.value === "child" ? "儿童" : "成人"
  } · 伙伴：${companion.value?.name || "—"} · 喜好：${likes} · 记忆 ${
    (memories.value || []).length
  } 条`;
});

async function setMode(m: Mode) {
  await store.save({ mode: m });
}

async function resetLocal() {
  if (
    !confirm(
      "确定重置本机档案到默认？将恢复儿童模式、空昵称、空喜好与小暖，并新建会话标识（不清除服务端旧会话）。",
    )
  ) {
    return;
  }
  localStorage.removeItem("jiuban_client_id");
  await store.save({
    nickname: "",
    mode: "child",
    companion_id: "nuan",
    likes: [],
  });
  store.sessionId = null;
  store.memories = [];
  hint.value = "已恢复默认档案。刷新页面后会使用新的本机标识。";
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
          <div class="choice">
            <button
              type="button"
              class="choice-item"
              :class="{ active: mode === 'child' }"
              @click="setMode('child')"
            >
              <div class="choice-icon child" v-html="childIcon" />
              <div>
                <div class="choice-title">儿童模式</div>
                <div class="choice-desc">短句、更严守护</div>
              </div>
            </button>
            <button
              type="button"
              class="choice-item adult-tone"
              :class="{ active: mode === 'adult' }"
              @click="setMode('adult')"
            >
              <div class="choice-icon adult" v-html="adultIcon" />
              <div>
                <div class="choice-title">成人模式</div>
                <div class="choice-desc">可轻度倾诉，非恋爱</div>
              </div>
            </button>
          </div>
          <button type="button" class="btn btn-secondary btn-block" @click="resetLocal">
            重置本机档案
          </button>
          <p v-if="hint" class="note" style="margin: 0; text-align: left; color: var(--color-secondary)">
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
