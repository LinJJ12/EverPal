<script setup lang="ts">
import { onMounted } from "vue";
import { RouterView } from "vue-router";
import AppHeader from "@/components/layout/AppHeader.vue";
import { useProfileStore } from "@/stores/profile";

const store = useProfileStore();
onMounted(() => store.hydrate());
</script>

<template>
  <AppHeader />
  <RouterView />
</template>
