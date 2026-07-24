<script setup lang="ts">
import { onBeforeUnmount } from "vue";
import { useSpeechRecognition } from "@/composables/useSpeechRecognition";

const props = defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{ transcript: [text: string]; error: [message: string] }>();

const { supported, listening, error, clearError, start, stop, abort } = useSpeechRecognition();
let holdActive = false;

async function onPointerDown(ev: PointerEvent) {
  if (props.disabled || !supported) return;
  if (ev.button !== 0) return;
  (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
  clearError();
  holdActive = true;
  start();
  if (error.value) {
    holdActive = false;
    emit("error", error.value);
  }
}

async function onPointerUp() {
  if (!holdActive) return;
  holdActive = false;
  const text = await stop();
  if (error.value) {
    emit("error", error.value);
    return;
  }
  if (text) {
    emit("transcript", text);
  } else {
    emit("error", "没听清，再试一次或打字吧");
  }
}

function onPointerCancel() {
  holdActive = false;
  abort();
}

onBeforeUnmount(() => abort());
</script>

<template>
  <button
    v-if="supported"
    type="button"
    class="btn btn-secondary hold-talk"
    :class="{ listening }"
    :disabled="disabled"
    :aria-pressed="listening"
    aria-label="按住说话"
    @pointerdown.prevent="onPointerDown"
    @pointerup.prevent="onPointerUp"
    @pointercancel.prevent="onPointerCancel"
    @contextmenu.prevent
  >
    {{ listening ? "松开结束" : "按住说话" }}
  </button>
  <button
    v-else
    type="button"
    class="btn btn-secondary hold-talk"
    disabled
    title="当前浏览器暂不支持语音，请打字聊"
    aria-label="语音不可用"
  >
    语音不可用
  </button>
</template>
