<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  MOOD_OPTIONS,
  dailyMoodQuote,
  getMoodFaceStyle,
  setMoodFaceStyle,
  type MoodFaceStyle,
  type MoodId,
} from "@/components/mood/moodOptions";
import MoodSticker from "@/components/mood/MoodSticker.vue";

const props = defineProps<{
  busy?: boolean;
  title?: string;
  subtitle?: string;
  showCancel?: boolean;
  /** Optional YYYY-MM-DD to keep quote stable with server day. */
  dayKey?: string;
  /** Highlight current mood when editing. */
  selected?: MoodId | null;
  /** Shown inside the overlay so failures are not hidden. */
  error?: string;
}>();

const emit = defineEmits<{ pick: [mood: MoodId]; cancel: [] }>();

const quote = computed(() => dailyMoodQuote(props.dayKey));
const faceStyle = ref<MoodFaceStyle>(getMoodFaceStyle());

watch(faceStyle, (s) => setMoodFaceStyle(s));

function setStyle(s: MoodFaceStyle) {
  faceStyle.value = s;
}
</script>

<template>
  <div class="mood-gate" role="dialog" aria-modal="true" aria-labelledby="mood-gate-title">
    <div class="mood-bookmark" :class="{ busy }">
      <div class="mood-bookmark-ribbon" aria-hidden="true">
        <span class="mood-bookmark-ribbon-text">今日心情</span>
      </div>
      <div class="mood-bookmark-body">
        <p class="mood-bookmark-quote">「{{ quote }}」</p>
        <h2 id="mood-gate-title" class="mood-bookmark-title">
          {{ title || "今天心情怎么样？" }}
        </h2>
        <p class="mood-bookmark-lead">
          {{ subtitle || "点一个小表情告诉伙伴，它会记得轻轻关心你。" }}
        </p>

        <div class="mood-style-switch" role="group" aria-label="表情风格">
          <button
            type="button"
            class="mood-style-btn"
            :class="{ on: faceStyle === 'emoji' }"
            :disabled="busy"
            @click="setStyle('emoji')"
          >
            表情
          </button>
          <button
            type="button"
            class="mood-style-btn"
            :class="{ on: faceStyle === 'sticker' }"
            :disabled="busy"
            @click="setStyle('sticker')"
          >
            贴纸
          </button>
        </div>

        <div class="mood-bookmark-grid">
          <button
            v-for="opt in MOOD_OPTIONS"
            :key="opt.id"
            type="button"
            class="mood-face-btn"
            :class="{ 'mood-on': selected === opt.id }"
            :style="{ '--mood-tint': opt.tint }"
            :disabled="busy"
            :aria-label="opt.label"
            :aria-pressed="selected === opt.id"
            @click="emit('pick', opt.id)"
          >
            <span v-if="faceStyle === 'emoji'" class="mood-face-emoji" aria-hidden="true">{{
              opt.emoji
            }}</span>
            <MoodSticker v-else :mood="opt.id" />
            <span class="mood-face-label">{{ opt.label }}</span>
          </button>
        </div>
        <p v-if="error" class="mood-gate-error" role="alert">{{ error }}</p>
        <button
          v-if="showCancel"
          type="button"
          class="mood-bookmark-skip"
          :disabled="busy"
          @click="emit('cancel')"
        >
          先不改
        </button>
      </div>
      <div class="mood-bookmark-tail" aria-hidden="true" />
    </div>
  </div>
</template>
