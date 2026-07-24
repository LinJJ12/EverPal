<script setup lang="ts">
import { ref } from "vue";
import HoldToTalkButton from "@/components/voice/HoldToTalkButton.vue";

defineProps<{ disabled?: boolean }>();
const model = defineModel<string>({ default: "" });
const emit = defineEmits<{ send: []; stop: [] }>();
const voiceHint = ref("");

function onTranscript(text: string) {
  voiceHint.value = "";
  const t = text.trim();
  if (!t) return;
  // Already sanitized in recognition stop(); keep defensive trim only.
  if (!model.value.trim()) {
    model.value = t;
  } else {
    model.value = `${model.value.trim()} ${t}`;
  }
}

function onVoiceError(message: string) {
  voiceHint.value = message;
}
</script>

<template>
  <div class="composer-wrap">
    <p v-if="voiceHint" class="note composer-voice-hint">{{ voiceHint }}</p>
    <form class="composer" @submit.prevent="emit('send')">
      <HoldToTalkButton :disabled="disabled" @transcript="onTranscript" @error="onVoiceError" />
      <input
        v-model="model"
        type="text"
        placeholder="想说点什么…"
        autocomplete="off"
        aria-label="消息输入"
        :disabled="disabled"
      />
      <button v-if="disabled" class="btn btn-secondary" type="button" @click="emit('stop')">
        停止
      </button>
      <button class="btn btn-primary" type="submit" :disabled="disabled || !model.trim()">
        发送
      </button>
    </form>
  </div>
</template>
