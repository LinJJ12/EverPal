<script setup lang="ts">
import { ref, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import { LIKE_OPTIONS } from "@/types";

const store = useProfileStore();
const { nickname, likes, ready } = storeToRefs(store);
const localNick = ref("");
const localLikes = ref<string[]>([]);
const router = useRouter();
const saving = ref(false);
const err = ref("");

watch(
  () => [ready.value, nickname.value, likes.value.slice()] as const,
  () => {
    if (!ready.value) return;
    localNick.value = nickname.value;
    localLikes.value = [...likes.value];
  },
  { immediate: true },
);

function toggle(id: string) {
  if (localLikes.value.includes(id)) {
    localLikes.value = localLikes.value.filter((x) => x !== id);
  } else {
    localLikes.value = [...localLikes.value, id];
  }
}

async function save() {
  saving.value = true;
  err.value = "";
  try {
    await store.save({ nickname: localNick.value.trim(), likes: localLikes.value });
    router.push("/companions");
  } catch (e) {
    err.value = e instanceof Error ? e.message : "保存失败，请确认后端已启动";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <main class="page page-path">
    <section class="path-stage shell-stage" aria-label="你的档案">
      <div class="path-stage-glow shell-stage-glow" aria-hidden="true" />
      <h1>你的档案</h1>
      <p class="lead">昵称和喜好会记在本机标识下，聊天时伙伴能用到。</p>
      <div class="path-stage-body">
        <div class="card stack">
          <div class="field">
            <label for="nickname">昵称</label>
            <input
              id="nickname"
              v-model="localNick"
              type="text"
              maxlength="20"
              placeholder="例如：豆豆、小明…"
              autocomplete="nickname"
            />
          </div>
          <div>
            <div class="choice-title">我喜欢…（可多选）</div>
            <p class="note" style="margin: 0; text-align: left">
              点选后会进入本机记忆，聊天招呼里可能被自然提起。
            </p>
            <div class="tag-cloud">
              <button
                v-for="opt in LIKE_OPTIONS"
                :key="opt.id"
                type="button"
                class="tag"
                :class="{ on: localLikes.includes(opt.id) }"
                @click="toggle(opt.id)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <p v-if="err" class="note" style="color: var(--color-primary); margin: 0">{{ err }}</p>
        </div>
      </div>
      <div class="shell-hero-actions footer-actions">
        <RouterLink class="btn btn-secondary btn-lg" to="/welcome">上一步</RouterLink>
        <button type="button" class="btn btn-primary btn-lg" :disabled="saving" @click="save">
          选角色
        </button>
        <RouterLink class="btn btn-secondary btn-lg" to="/companions">暂时跳过</RouterLink>
      </div>
    </section>
  </main>
</template>
