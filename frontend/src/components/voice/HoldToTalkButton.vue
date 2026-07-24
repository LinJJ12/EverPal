<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import { useSpeechRecognition } from "@/composables/useSpeechRecognition";

const props = defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{ transcript: [text: string]; error: [message: string] }>();

const { supported, listening, error, clearError, start, stop, abort } = useSpeechRecognition();

watch(
  () => props.disabled,
  (d) => {
    if (d && listening.value) {
      abort();
    }
  },
);

async function onClick() {
  if (props.disabled || !supported) return;
  clearError();

  if (listening.value) {
    const text = await stop();
    if (error.value) {
      emit("error", error.value);
      return;
    }
    if (text) {
      emit("transcript", text);
    } else {
      emit("error", "没听清，再点一次说话，或直接打字吧");
    }
    return;
  }

  start();
  if (error.value) {
    emit("error", error.value);
  }
}

onBeforeUnmount(() => abort());
</script>

<template>
  <button
    v-if="supported"
    type="button"
    class="btn btn-secondary voice-talk"
    :class="{ listening }"
    :disabled="disabled"
    :aria-pressed="listening"
    :aria-label="listening ? '说完了' : '点我说话'"
    @click="onClick"
  >
    {{ listening ? "说完了" : "点我说话" }}
  </button>
  <button
    v-else
    type="button"
    class="btn btn-secondary voice-talk"
    disabled
    title="当前浏览器暂不支持语音，请打字聊"
    aria-label="语音不可用"
  >
    语音不可用
  </button>
</template>
