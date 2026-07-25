<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import { clearMemories, deleteMemory, fetchProfile } from "@/api/profile";
import { fetchTodayMood, putTodayMood } from "@/api/mood";
import {
  MOOD_OPTIONS,
  dailyMoodQuote,
  getMoodFaceStyle,
  setMoodFaceStyle,
  parseMoodId,
  type MoodFaceStyle,
  type MoodId,
} from "@/components/mood/moodOptions";
import MoodSticker from "@/components/mood/MoodSticker.vue";
import type { MemoryCategory } from "@/types";
import { friendlyError } from "@/utils/errors";

const store = useProfileStore();
const { nickname, likeLabels, memories, companion } = storeToRefs(store);
const hint = ref("");
const todayMood = ref<MoodId | null>(null);
const todayMoodLabel = ref("");
const moodDayKey = ref("");
const moodBusy = ref(false);
const moodError = ref("");
const pageError = ref("");
const faceStyle = ref<MoodFaceStyle>(getMoodFaceStyle());
const moodQuote = computed(() => dailyMoodQuote(moodDayKey.value || undefined));

function setStyle(s: MoodFaceStyle) {
  faceStyle.value = s;
  setMoodFaceStyle(s);
}

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

async function loadMood() {
  try {
    const m = await fetchTodayMood();
    const mid = parseMoodId(m.mood);
    todayMood.value = mid;
    todayMoodLabel.value = mid ? m.label || MOOD_OPTIONS.find((o) => o.id === mid)?.label || "" : "";
    moodDayKey.value = m.day || "";
    moodError.value = "";
  } catch (e) {
    moodError.value = friendlyError(e);
  }
}

onMounted(async () => {
  try {
    const p = await fetchProfile();
    store.memories = p.memories || [];
  } catch {
    /* ignore */
  }
  await loadMood();
});

async function onMoodChange(mood: MoodId) {
  moodBusy.value = true;
  moodError.value = "";
  try {
    const m = await putTodayMood(mood);
    const mid = parseMoodId(m.mood) || mood;
    todayMood.value = mid;
    todayMoodLabel.value = m.label || mood;
    moodDayKey.value = m.day || moodDayKey.value;
    hint.value = "今日心情已更新";
    setTimeout(() => (hint.value = ""), 3000);
  } catch (e) {
    moodError.value = friendlyError(e);
  } finally {
    moodBusy.value = false;
  }
}

async function removeOne(id: number | undefined) {
  if (id == null) return;
  if (!confirm("删掉这条记忆？")) return;
  try {
    await deleteMemory(id);
    store.memories = store.memories.filter((m) => m.id !== id);
    hint.value = "已删除一条记忆";
    setTimeout(() => (hint.value = ""), 3000);
  } catch (e) {
    pageError.value = friendlyError(e);
  }
}

async function clear() {
  if (!confirm("确定清除近期记忆条？昵称与喜好会保留。")) return;
  try {
    await clearMemories();
    store.memories = [];
    hint.value = "已清除记忆条，昵称与喜好仍保留";
    setTimeout(() => (hint.value = ""), 4000);
  } catch (e) {
    pageError.value = friendlyError(e);
  }
}
</script>

<template>
  <main class="page page-path">
    <section class="path-stage shell-stage" aria-label="轻量记忆">
      <div class="path-stage-glow shell-stage-glow" aria-hidden="true" />
      <h1>轻量记忆</h1>
      <p class="lead">昵称、喜好、今日心情与近期摘要留在本机标识下，可随时查看或清除。</p>
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
          <div class="choice-title">今日心情</div>
          <p class="note" style="margin: 0">
            {{ todayMoodLabel ? `今天：${todayMoodLabel}` : "今天还没选心情，去聊天时也会问你一次。" }}
          </p>
          <p v-if="moodQuote" class="note mood-memory-quote">「{{ moodQuote }}」</p>
          <div class="mood-style-switch" role="group" aria-label="表情风格">
            <button
              type="button"
              class="mood-style-btn"
              :class="{ on: faceStyle === 'emoji' }"
              :disabled="moodBusy"
              @click="setStyle('emoji')"
            >
              表情
            </button>
            <button
              type="button"
              class="mood-style-btn"
              :class="{ on: faceStyle === 'sticker' }"
              :disabled="moodBusy"
              @click="setStyle('sticker')"
            >
              贴纸
            </button>
          </div>
          <div class="mood-pick-row">
            <button
              v-for="opt in MOOD_OPTIONS"
              :key="opt.id"
              type="button"
              class="mood-face-btn mood-face-compact"
              :class="{ 'mood-on': todayMood === opt.id }"
              :style="{ '--mood-tint': opt.tint }"
              :disabled="moodBusy"
              :aria-label="opt.label"
              @click="onMoodChange(opt.id)"
            >
              <span v-if="faceStyle === 'emoji'" class="mood-face-emoji" aria-hidden="true">{{
                opt.emoji
              }}</span>
              <MoodSticker v-else :mood="opt.id" />
              <span class="mood-face-label">{{ opt.label }}</span>
            </button>
          </div>
          <p
            v-if="moodError"
            class="note"
            style="margin: 0; text-align: left; color: var(--color-primary)"
          >
            {{ moodError }}
          </p>
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
              <div class="memory-item-actions">
                <time v-if="m.created_at">{{ new Date(m.created_at * 1000).toLocaleString() }}</time>
                <button
                  v-if="m.id != null"
                  type="button"
                  class="btn btn-secondary memory-del"
                  @click="removeOne(m.id)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
          <p
            v-if="hint"
            class="note"
            style="margin: 0; text-align: left; color: var(--color-secondary)"
          >
            {{ hint }}
          </p>
          <p
            v-if="pageError"
            class="note"
            style="margin: 0; text-align: left; color: var(--color-primary)"
          >
            {{ pageError }}
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
