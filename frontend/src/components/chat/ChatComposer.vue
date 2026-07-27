<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import VoiceTalkButton from "@/components/voice/VoiceTalkButton.vue";

const props = defineProps<{ disabled?: boolean; streaming?: boolean }>();
const model = defineModel<string>({ default: "" });
const wikiMode = defineModel<boolean>("wikiMode", { default: false });
const emit = defineEmits<{ send: []; stop: [] }>();
const voiceHint = ref("");
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const placeholder = computed(() =>
  wikiMode.value ? "想了解什么百科知识…" : "想说点什么…",
);

const canSend = computed(() => !props.disabled && Boolean(model.value.trim()));

function resizeTextarea() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
}

watch(model, () => {
  void nextTick(resizeTextarea);
});

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

function onKeydown(e: KeyboardEvent) {
  if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
  e.preventDefault();
  if (canSend.value) emit("send");
}

function onSubmit() {
  if (canSend.value) emit("send");
}
</script>

<template>
  <div class="composer-wrap">
    <p v-if="voiceHint" class="note composer-voice-hint">{{ voiceHint }}</p>
    <p v-if="wikiMode" class="note composer-wiki-hint">百科模式：发送后会查资料再回答</p>
    <form class="composer" @submit.prevent="onSubmit">
      <textarea
        ref="textareaRef"
        v-model="model"
        rows="1"
        :placeholder="placeholder"
        autocomplete="off"
        aria-label="消息输入"
        :disabled="props.disabled"
        @input="resizeTextarea"
        @keydown="onKeydown"
      />
      <div class="composer-toolbar">
        <div class="composer-tools">
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
          <VoiceTalkButton
            compact
            :disabled="props.disabled"
            @transcript="onTranscript"
            @error="onVoiceError"
          />
        </div>
        <div class="composer-actions">
          <button
            v-if="props.streaming"
            class="btn btn-secondary composer-stop"
            type="button"
            @click="emit('stop')"
          >
            停止
          </button>
          <button
            v-else
            class="btn btn-primary composer-send"
            type="submit"
            :disabled="!canSend"
            aria-label="发送"
          >
            发送
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
