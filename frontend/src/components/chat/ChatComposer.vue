<script setup lang="ts">
defineProps<{ disabled?: boolean }>();
const model = defineModel<string>({ default: "" });
const emit = defineEmits<{ send: []; stop: [] }>();
</script>

<template>
  <form class="composer" @submit.prevent="emit('send')">
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
</template>
