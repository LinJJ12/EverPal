<script setup lang="ts">
import { onMounted } from "vue";
import { RouterView } from "vue-router";
import { storeToRefs } from "pinia";
import AppHeader from "@/components/layout/AppHeader.vue";
import { useProfileStore } from "@/stores/profile";

const store = useProfileStore();
const { backendUnreachable, ready } = storeToRefs(store);
onMounted(() => store.hydrate());
</script>

<template>
  <AppHeader />
  <div
    v-if="ready && backendUnreachable"
    class="backend-banner"
    role="status"
  >
    连不上服务器，请确认后端已启动后再试。
  </div>
  <RouterView />
</template>

<style scoped>
.backend-banner {
  margin: 0 auto;
  max-width: var(--max);
  padding: 0.65rem 1rem;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-foreground);
  background: color-mix(in srgb, var(--color-accent) 28%, var(--color-surface));
  border-bottom: 1px solid var(--color-border);
}
</style>
