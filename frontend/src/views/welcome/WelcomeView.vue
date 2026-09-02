<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import CompanionAvatar from "@/components/companions/CompanionAvatar.vue";

const store = useProfileStore();
const { nickname, companion, likeLabels } = storeToRefs(store);

const title = computed(() =>
  nickname.value ? `${nickname.value}，我在这儿` : "你好呀，我在这儿",
);
const lead = computed(() => {
  const name = companion.value?.name || "伙伴";
  if (nickname.value) {
    const likeBit = likeLabels.value.length ? `还喜欢${likeLabels.value[0]}吗？` : "";
    return `${name}记得你。${likeBit}可以挑个场景聊聊，也可以直接开始聊天。`;
  }
  return "玖伴（Everpal）是面向小学生与初中生的 AI 陪伴助手——九久相伴，永远有人回应。耐心听完、说话好懂、记得你是谁。";
});
const memoryBits = computed(() => {
  const bits: string[] = [];
  if (nickname.value) bits.push(`昵称 · ${nickname.value}`);
  bits.push("未成年人陪伴");
  likeLabels.value.slice(0, 3).forEach((l) => bits.push(l));
  return bits;
});
</script>

<template>
  <main class="page page-welcome">
    <section class="welcome-stage" aria-label="欢迎">
      <div class="welcome-stage-glow" aria-hidden="true" />
      <div class="welcome-presence">
        <CompanionAvatar
          class="welcome-avatar"
          :companion-id="companion?.id || 'nuan'"
        />
        <p class="welcome-presence-name">{{ companion?.name || "小暖" }}</p>
        <p class="welcome-presence-note">
          {{ nickname || likeLabels.length ? "记得你，一直在" : "打开就能聊，我在这儿" }}
        </p>
      </div>
      <h1>{{ title }}</h1>
      <p class="lead">{{ lead }}</p>
      <div v-if="memoryBits.length" class="welcome-memory">
        <span v-for="b in memoryBits" :key="b">{{ b }}</span>
      </div>
      <div class="shell-hero-actions">
        <RouterLink class="btn btn-primary btn-lg" to="/profile">设置昵称</RouterLink>
        <RouterLink class="btn btn-secondary btn-lg" to="/chat">直接聊天</RouterLink>
      </div>
    </section>

    <section class="welcome-next" aria-labelledby="next-title">
      <h2 id="next-title" class="section-title">接下来可以…</h2>
      <div class="hub-grid hub-grid-welcome">
        <RouterLink class="hub-item" to="/profile">
          <span class="step">档案</span>
          <strong>告诉我怎么称呼你</strong>
          <span>昵称与喜好留在本机</span>
        </RouterLink>
        <RouterLink class="hub-item" to="/scenes">
          <span class="step">场景</span>
          <strong>先看情境</strong>
          <span>无聊、好奇、心事——跟着聊几轮</span>
        </RouterLink>
        <RouterLink class="hub-item" to="/companions">
          <span class="step">伙伴</span>
          <strong>换一位角色</strong>
          <span>小暖、跳跳、阿茶，今天想找谁</span>
        </RouterLink>
      </div>
    </section>
  </main>
</template>
