<script setup lang="ts">
import { computed } from "vue";
import { avatarSvg } from "@/utils/avatars";

const props = defineProps<{ companionId: string }>();
const html = computed(() => avatarSvg(props.companionId));
</script>

<template>
  <div class="avatar" :class="companionId" v-html="html" />
</template>
