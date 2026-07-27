<script setup lang="ts">
import type { ChatSource } from "@/types";

defineProps<{
  sources: ChatSource[];
}>();
</script>

<template>
  <details v-if="sources.length" class="chat-sources">
    <summary class="chat-sources-summary">查看来源</summary>
    <ul class="chat-sources-list">
      <li v-for="(s, i) in sources" :key="i">
        <a
          class="chat-sources-link"
          :href="s.url"
          target="_blank"
          rel="noopener noreferrer"
        >{{ s.title }}</a>
      </li>
    </ul>
  </details>
</template>
