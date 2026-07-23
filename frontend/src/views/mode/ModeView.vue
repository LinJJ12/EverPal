<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useProfileStore } from "@/stores/profile";
import { iconAdult, iconChild } from "@/utils/avatars";
import type { Mode } from "@/types";

const store = useProfileStore();
const router = useRouter();
const childIcon = ref("");
const adultIcon = ref("");

onMounted(() => {
  childIcon.value = iconChild();
  adultIcon.value = iconAdult();
});

async function pick(mode: Mode) {
  await store.save({ mode });
  router.push("/profile");
}
</script>

<template>
  <main class="page page-path">
    <section class="path-stage shell-stage" aria-label="选择模式">
      <div class="path-stage-glow shell-stage-glow" aria-hidden="true" />
      <h1>你想怎么聊？</h1>
      <p class="lead">儿童模式字更大、话题更浅、安全更严；成人模式更适合慢慢倾诉（非恋爱）。</p>
      <div class="path-stage-body">
        <div class="card">
          <div class="choice">
            <button type="button" class="choice-item" @click="pick('child')">
              <div class="choice-icon child" v-html="childIcon" />
              <div>
                <div class="choice-title">儿童模式</div>
                <div class="choice-desc">短句、安全更严，适合小学生</div>
              </div>
            </button>
            <button type="button" class="choice-item adult-tone" @click="pick('adult')">
              <div class="choice-icon adult" v-html="adultIcon" />
              <div>
                <div class="choice-title">成人模式</div>
                <div class="choice-desc">共情优先，允许轻度树洞</div>
              </div>
            </button>
          </div>
        </div>
      </div>
      <div class="shell-hero-actions footer-actions">
        <RouterLink class="btn btn-secondary btn-lg" to="/welcome">上一步</RouterLink>
        <RouterLink class="btn btn-primary btn-lg" to="/profile">填写档案</RouterLink>
      </div>
    </section>
  </main>
</template>
