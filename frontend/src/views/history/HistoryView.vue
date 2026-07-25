<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { RouterLink, useRouter } from "vue-router";
import CompanionAvatar from "@/components/companions/CompanionAvatar.vue";
import MoodSticker from "@/components/mood/MoodSticker.vue";
import {
  getMoodFaceStyle,
  moodOption,
  parseMoodId,
  type MoodId,
} from "@/components/mood/moodOptions";
import { useHistoryCalendar } from "@/composables/useHistoryCalendar";
import { useProfileStore } from "@/stores/profile";

const router = useRouter();
const store = useProfileStore();
const { companions } = storeToRefs(store);
const faceStyle = getMoodFaceStyle();

const {
  today,
  year,
  month,
  weekdayLabels,
  loading,
  err,
  cells,
  selectedDay,
  dayLoading,
  dayErr,
  dayMood,
  dayMoodLabel,
  daySessions,
  deletingId,
  selectDay,
  removeSession,
  prevMonth,
  nextMonth,
} = useHistoryCalendar();

onMounted(() => {
  if (!store.ready) void store.hydrate();
});

function dayNum(day: string) {
  return Number(day.slice(-2));
}

function formatDayCn(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  return `${y}年${m}月${d}日`;
}

function companionName(id: string) {
  return companions.value.find((c) => c.id === id)?.name || "伙伴";
}

function openSession(id: string) {
  router.push({ path: "/chat", query: { session: id } });
}

function asMood(id: string | MoodId | null | undefined): MoodId | null {
  return parseMoodId(id);
}

function moodFace(id: string | MoodId | null | undefined) {
  return moodOption(asMood(id));
}
</script>

<template>
  <main class="page page-path page-history">
    <section class="path-stage shell-stage history-stage" aria-label="会话历史">
      <div class="path-stage-glow shell-stage-glow" aria-hidden="true" />
      <h1>会话历史</h1>
      <p class="lead">看一看哪天聊过、那天心情怎样。</p>
      <div class="path-stage-body history-cal">
        <div class="history-cal-nav">
          <button type="button" class="btn btn-secondary" @click="prevMonth">上个月</button>
          <h2 class="history-cal-title">{{ year }}年{{ month }}月</h2>
          <button type="button" class="btn btn-secondary" @click="nextMonth">下个月</button>
        </div>

        <p v-if="err" class="note">{{ err }}</p>
        <p v-else-if="loading" class="note">正在加载日历…</p>

        <div class="history-cal-grid" role="grid" aria-label="月历">
          <div
            v-for="w in weekdayLabels"
            :key="w"
            class="history-cal-weekday"
            role="columnheader"
          >
            {{ w }}
          </div>
          <template v-for="(cell, i) in cells" :key="cell.day || `pad-${i}`">
            <button
              v-if="cell.inMonth && cell.day"
              type="button"
              class="history-cal-cell"
              :class="{
                'is-muted': !cell.interactive,
                'is-selected': selectedDay === cell.day,
                'is-today': cell.day === today,
                'has-chat': cell.meta?.has_chat,
              }"
              :disabled="!cell.interactive"
              :aria-label="
                cell.interactive
                  ? `${cell.day}${cell.meta?.has_chat ? '，聊过' : ''}${cell.meta?.mood_label ? '，心情' + cell.meta.mood_label : ''}`
                  : `${cell.day}，没有记录`
              "
              @click="selectDay(cell.day)"
            >
              <span class="history-cal-num">{{ dayNum(cell.day) }}</span>
              <span
                v-if="asMood(cell.meta?.mood)"
                class="history-cal-mood"
                :style="{ '--mood-tint': moodFace(cell.meta?.mood)?.tint }"
              >
                <span
                  v-if="faceStyle === 'emoji'"
                  class="history-cal-emoji"
                  aria-hidden="true"
                  >{{ moodFace(cell.meta?.mood)?.emoji }}</span
                >
                <MoodSticker
                  v-else
                  class="history-cal-sticker"
                  :mood="asMood(cell.meta?.mood)!"
                />
              </span>
              <span v-if="cell.meta?.has_chat" class="history-cal-dot" aria-hidden="true" />
            </button>
            <div v-else class="history-cal-cell is-pad" aria-hidden="true" />
          </template>
        </div>

        <div v-if="selectedDay" class="history-day-panel card">
          <header class="history-day-head">
            <h3>{{ formatDayCn(selectedDay) }}</h3>
            <p v-if="dayMood" class="history-day-mood note">
              当天心情：
              <span
                class="history-day-mood-face"
                :style="{ '--mood-tint': moodFace(dayMood)?.tint }"
              >
                <span v-if="faceStyle === 'emoji'" aria-hidden="true">{{
                  moodFace(dayMood)?.emoji
                }}</span>
                <MoodSticker v-else :mood="dayMood" />
              </span>
              {{ dayMoodLabel || moodFace(dayMood)?.label }}
            </p>
          </header>
          <p v-if="dayErr" class="note">{{ dayErr }}</p>
          <p v-else-if="dayLoading" class="note">正在加载这一天…</p>
          <template v-else>
            <p v-if="!daySessions.length" class="note">这天还没有聊天</p>
            <ul v-else class="history-day-sessions">
              <li v-for="s in daySessions" :key="s.id" class="history-session-row">
                <button type="button" class="history-session-open" @click="openSession(s.id)">
                  <CompanionAvatar class="history-session-avatar" :companion-id="s.companion_id" />
                  <span class="history-session-copy">
                    <strong>{{ s.title || "未命名会话" }}</strong>
                    <span class="note">
                      伙伴 · {{ companionName(s.companion_id) }} · 当天
                      {{ s.message_count_that_day }} 条消息
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  class="btn btn-secondary history-session-delete"
                  :disabled="deletingId === s.id"
                  @click="removeSession(s.id)"
                >
                  {{ deletingId === s.id ? "删除中…" : "删除" }}
                </button>
              </li>
            </ul>
          </template>
        </div>
      </div>
      <div class="shell-hero-actions footer-actions">
        <RouterLink class="btn btn-secondary btn-lg" to="/">回首页</RouterLink>
        <RouterLink class="btn btn-primary btn-lg" to="/chat">去聊天</RouterLink>
      </div>
    </section>
  </main>
</template>
