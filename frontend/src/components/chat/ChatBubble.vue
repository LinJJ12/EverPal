<script setup lang="ts">
defineProps<{ role: "user" | "assistant"; text: string; streaming?: boolean }>();
</script>

<template>
  <div
    class="bubble turn-enter"
    :class="[
      role === 'user' ? 'user' : 'bot',
      {
        streaming: streaming && !!text,
        'is-waiting': streaming && !text,
      },
    ]"
  >
    <span v-if="streaming && !text" class="typing-inline" aria-label="正在回复">
      <span /><span /><span />
    </span>
    <template v-else>{{ text }}</template>
  </div>
</template>
