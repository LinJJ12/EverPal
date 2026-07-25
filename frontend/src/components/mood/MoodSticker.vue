<script setup lang="ts">
import type { MoodId } from "@/components/mood/moodOptions";

defineProps<{ mood: MoodId }>();
</script>

<template>
  <!-- Thick-outline sticker faces (no external assets). -->
  <svg
    class="mood-sticker-svg"
    viewBox="0 0 64 64"
    width="40"
    height="40"
    aria-hidden="true"
  >
    <!-- shared sticker plate -->
    <circle cx="32" cy="32" r="28" class="mood-sticker-plate" />
    <circle cx="32" cy="32" r="28" class="mood-sticker-ring" fill="none" />

    <template v-if="mood === 'happy'">
      <circle cx="22" cy="28" r="3.2" class="mood-sticker-ink" />
      <circle cx="42" cy="28" r="3.2" class="mood-sticker-ink" />
      <path
        d="M20 38c4 8 20 8 24 0"
        class="mood-sticker-stroke"
        fill="none"
      />
      <circle cx="16" cy="36" r="4" class="mood-sticker-blush" />
      <circle cx="48" cy="36" r="4" class="mood-sticker-blush" />
    </template>

    <template v-else-if="mood === 'calm'">
      <path d="M18 28c2-3 6-3 8 0" class="mood-sticker-stroke" fill="none" />
      <path d="M38 28c2-3 6-3 8 0" class="mood-sticker-stroke" fill="none" />
      <path d="M24 40c3 3 13 3 16 0" class="mood-sticker-stroke" fill="none" />
    </template>

    <template v-else-if="mood === 'tired'">
      <path d="M18 30h10" class="mood-sticker-stroke" />
      <path d="M36 30h10" class="mood-sticker-stroke" />
      <ellipse cx="32" cy="42" rx="7" ry="3.5" class="mood-sticker-ink" opacity="0.25" />
      <path d="M48 18c4 2 6 6 4 10" class="mood-sticker-stroke" fill="none" />
    </template>

    <template v-else-if="mood === 'sad'">
      <circle cx="22" cy="28" r="2.8" class="mood-sticker-ink" />
      <circle cx="42" cy="28" r="2.8" class="mood-sticker-ink" />
      <path d="M22 44c4-6 16-6 20 0" class="mood-sticker-stroke" fill="none" />
      <path d="M44 34v8" class="mood-sticker-tear" />
      <circle cx="44" cy="44" r="2.2" class="mood-sticker-tear" />
    </template>

    <template v-else-if="mood === 'angry'">
      <path d="M16 24l12 4" class="mood-sticker-stroke" />
      <path d="M48 24l-12 4" class="mood-sticker-stroke" />
      <circle cx="22" cy="30" r="3" class="mood-sticker-ink" />
      <circle cx="42" cy="30" r="3" class="mood-sticker-ink" />
      <path d="M24 44c4-4 12-4 16 0" class="mood-sticker-stroke" fill="none" />
      <path d="M50 20c3-1 5 2 3 5" class="mood-sticker-steam" fill="none" />
    </template>

    <template v-else-if="mood === 'hope'">
      <circle cx="22" cy="28" r="3" class="mood-sticker-ink" />
      <circle cx="42" cy="28" r="3" class="mood-sticker-ink" />
      <path d="M20 38c5 9 19 9 24 0" class="mood-sticker-stroke" fill="none" />
      <path
        d="M32 10l1.6 4.2H38l-3.4 2.6 1.2 4.2L32 18.6l-3.8 2.4 1.2-4.2-3.4-2.6h4.4z"
        class="mood-sticker-star"
      />
    </template>
  </svg>
</template>
