<script setup lang="ts">
defineProps<{ role: "user" | "assistant"; text: string; streaming?: boolean }>();
</script>

<template>
  <div
    class="bubble turn-enter"
    :class="[role === 'user' ? 'user' : 'bot', { streaming }]"
  >
    {{ text }}
  </div>
</template>
