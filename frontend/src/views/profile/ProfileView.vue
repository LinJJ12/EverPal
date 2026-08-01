<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import { LIKE_OPTIONS } from "@/types";

const MAX_LIKES = 6;
const MAX_LIKE_LEN = 12;

const store = useProfileStore();
const { nickname, ready, likeLabels } = storeToRefs(store);
const localNick = ref("");
const localLikes = ref<string[]>([]);
const draft = ref("");
const router = useRouter();
const saving = ref(false);
const err = ref("");
const hint = ref("");

// Sync from store when hydrate lands / server likes change — not on every keystroke.
watch(
  () => (ready.value ? `${nickname.value}\n${likeLabels.value.join("\0")}` : ""),
  () => {
    if (!ready.value) return;
    localNick.value = nickname.value;
    // Prefer display labels so legacy ids become readable custom tags.
    localLikes.value = likeLabels.value.slice(0, MAX_LIKES);
  },
  { immediate: true },
);

const atLimit = computed(() => localLikes.value.length >= MAX_LIKES);

function normalizeLike(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_LIKE_LEN);
}

function addLike(raw: string) {
  err.value = "";
  hint.value = "";
  const text = normalizeLike(raw);
  if (!text) return;
  if (localLikes.value.includes(text)) {
    hint.value = "这个已经加过啦";
    draft.value = "";
    return;
  }
  if (localLikes.value.length >= MAX_LIKES) {
    hint.value = `最多选 ${MAX_LIKES} 个喜好哦`;
    return;
  }
  localLikes.value = [...localLikes.value, text];
  draft.value = "";
}

function removeLike(text: string) {
  localLikes.value = localLikes.value.filter((x) => x !== text);
  hint.value = "";
}

function onDraftKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    addLike(draft.value);
  }
}

async function save() {
  saving.value = true;
  err.value = "";
  try {
    // Flush pending draft if any
    if (draft.value.trim()) addLike(draft.value);
    const pending = localLikes.value.slice(0, MAX_LIKES);
    await store.save({
      nickname: localNick.value.trim(),
      likes: pending,
    });
    // Server may drop lexicon-hitting likes; keep UI honest before navigate.
    if (likeLabels.value.length < pending.length) {
      localLikes.value = likeLabels.value.slice(0, MAX_LIKES);
      err.value = "有的词不太适合记成喜好，已帮你去掉啦";
      return;
    }
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
          <div class="field">
            <label for="like-draft">我喜欢…（最多 {{ MAX_LIKES }} 个）</label>
            <p class="note" style="margin: 0 0 8px; text-align: left">
              自己填写，或点下面的推荐；聊天招呼里可能会自然提起。
            </p>
            <div class="like-add-row">
              <input
                id="like-draft"
                v-model="draft"
                type="text"
                :maxlength="MAX_LIKE_LEN"
                :disabled="atLimit"
                placeholder="例如：乐高、钢琴、篮球…"
                autocomplete="off"
                @keydown="onDraftKeydown"
              />
              <button
                type="button"
                class="btn btn-secondary"
                :disabled="atLimit || !draft.trim()"
                @click="addLike(draft)"
              >
                添加
              </button>
            </div>
            <div v-if="localLikes.length" class="tag-cloud" style="margin-top: 10px">
              <button
                v-for="item in localLikes"
                :key="item"
                type="button"
                class="tag on"
                :title="`去掉「${item}」`"
                @click="removeLike(item)"
              >
                {{ item }} ×
              </button>
            </div>
            <p class="note" style="margin: 8px 0 0; text-align: left">
              已选 {{ localLikes.length }}/{{ MAX_LIKES }}
              <span v-if="hint"> · {{ hint }}</span>
            </p>
            <p class="note" style="margin: 10px 0 0; text-align: left">也可以点推荐快速加上：</p>
            <div class="tag-cloud">
              <button
                v-for="opt in LIKE_OPTIONS"
                :key="opt.id"
                type="button"
                class="tag"
                :class="{ on: localLikes.includes(opt.label) }"
                :disabled="!localLikes.includes(opt.label) && atLimit"
                @click="
                  localLikes.includes(opt.label) ? removeLike(opt.label) : addLike(opt.label)
                "
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

<style scoped>
.like-add-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.like-add-row input {
  flex: 1 1 auto;
  min-width: 0;
}

.like-add-row .btn {
  flex: 0 0 auto;
  white-space: nowrap;
}
</style>
