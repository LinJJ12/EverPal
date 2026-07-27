<script setup lang="ts">
import { computed, ref } from "vue";
import VoiceTalkButton from "@/components/voice/VoiceTalkButton.vue";

const props = defineProps<{ disabled?: boolean }>();
const model = defineModel<string>({ default: "" });
const wikiMode = defineModel<boolean>("wikiMode", { default: false });
const emit = defineEmits<{ send: []; stop: [] }>();
const voiceHint = ref("");

const placeholder = computed(() =>
  wikiMode.value ? "想了解什么百科知识…" : "想说点什么…",
);

function onTranscript(text: string) {
  voiceHint.value = "";
  const t = text.trim();
  if (!t) return;
  if (!model.value.trim()) {
    model.value = t;
  } else {
    model.value = `${model.value.trim()} ${t}`;
  }
}

function onVoiceError(message: string) {
  voiceHint.value = message;
}

function toggleWiki() {
  if (props.disabled) return;
  wikiMode.value = !wikiMode.value;
}
</script>

<template>
  <div class="composer-wrap">
    <p v-if="voiceHint" class="note composer-voice-hint">{{ voiceHint }}</p>
    <p v-if="wikiMode" class="note composer-wiki-hint">百科模式：发送后会查资料再回答</p>
    <form class="composer" @submit.prevent="emit('send')">
      <button
        type="button"
        class="composer-wiki"
        :class="{ active: wikiMode }"
        :disabled="props.disabled"
        :aria-pressed="wikiMode"
        title="点一下开启百科；再发一条问题"
        @click="toggleWiki"
      >
        百科
      </button>
      <VoiceTalkButton :disabled="props.disabled" @transcript="onTranscript" @error="onVoiceError" />
      <input
        v-model="model"
        type="text"
        :placeholder="placeholder"
        autocomplete="off"
        aria-label="消息输入"
        :disabled="props.disabled"
      />
      <button v-if="props.disabled" class="btn btn-secondary" type="button" @click="emit('stop')">
        停止
      </button>
      <button class="btn btn-primary" type="submit" :disabled="props.disabled || !model.trim()">
        发送
      </button>
    </form>
  </div>
</template>
