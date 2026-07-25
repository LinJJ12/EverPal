<script setup lang="ts">
defineProps<{
  topics: { id?: string; label: string; text: string }[];
  disabled?: boolean;
}>();
const emit = defineEmits<{ pick: [text: string] }>();
</script>

<template>
  <div class="topics">
    <button
      v-for="t in topics"
      :key="t.id || t.label"
      type="button"
      class="topic"
      :disabled="disabled"
      @click="emit('pick', t.text)"
    >
      {{ t.label }}
    </button>
  </div>
</template>
