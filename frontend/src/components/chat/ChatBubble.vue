<script setup lang="ts">
import { computed } from "vue";
import { charIndexFromRatio } from "@/utils/voice/speakProgress";

const props = defineProps<{
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
  /**
   * Karaoke ratio 0..1 while this bubble is being read; -1 = not highlighting.
   * Mapped onto `text.length` so trim/truncation on the TTS side still tracks visually.
   */
  speakRatio?: number;
  /** Paused mid-read — keep highlight, soften the current marker. */
  speakPaused?: boolean;
}>();

const highlighting = computed(() => {
  const r = props.speakRatio;
  return typeof r === "number" && r >= 0 && !!props.text;
});

const cursor = computed(() => {
  if (!highlighting.value) return 0;
  return charIndexFromRatio(props.speakRatio ?? 0, props.text.length);
});

const readPart = computed(() => (highlighting.value ? props.text.slice(0, cursor.value) : ""));
const currentPart = computed(() =>
  highlighting.value && cursor.value < props.text.length ? props.text.charAt(cursor.value) : "",
);
const unreadPart = computed(() => {
  if (!highlighting.value) return "";
  const start = cursor.value + (currentPart.value ? 1 : 0);
  return props.text.slice(start);
});
</script>

<template>
  <div
    class="bubble turn-enter"
    :class="[
      role === 'user' ? 'user' : 'bot',
      {
        streaming: streaming && !!text,
        'is-waiting': streaming && !text,
        'speak-tracking': highlighting,
        'speak-paused': highlighting && !!speakPaused,
      },
    ]"
  >
    <span v-if="streaming && !text" class="typing-inline" aria-label="正在回复">
      <span /><span /><span />
    </span>
    <template v-else-if="highlighting">
      <span class="speak-read">{{ readPart }}</span><span
        v-if="currentPart"
        class="speak-current"
        >{{ currentPart }}</span
      ><span class="speak-unread">{{ unreadPart }}</span>
    </template>
    <template v-else>{{ text }}</template>
  </div>
</template>
