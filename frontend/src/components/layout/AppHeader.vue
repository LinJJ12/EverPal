<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { RouterLink, useRoute } from "vue-router";

const route = useRoute();
const moreOpen = ref(false);

const PRIMARY = [
  { to: "/", label: "首页", match: ["/"] },
  { to: "/welcome", label: "欢迎", match: ["/welcome"] },
  { to: "/scenes", label: "场景", match: ["/scenes"] },
  { to: "/chat", label: "聊天", match: ["/chat"] },
  { to: "/games", label: "游戏", match: ["/games"] },
  { to: "/safety", label: "安全", match: ["/safety"] },
];

const MORE = [
  { to: "/mode", label: "模式" },
  { to: "/profile", label: "档案" },
  { to: "/companions", label: "角色" },
  { to: "/memory", label: "记忆" },
  { to: "/history", label: "历史" },
  { to: "/settings", label: "设置" },
];

function isHere(match: string[]) {
  return match.includes(route.path);
}

function onDocClick() {
  moreOpen.value = false;
}

onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
</script>

<template>
  <header class="site-header">
    <div class="site-header-inner">
      <RouterLink class="brand-lockup" to="/">
        <img class="brand-mark" src="/brand/logo.png" width="36" height="36" alt="" />
        <span>玖伴</span>
      </RouterLink>
      <nav class="nav-links" aria-label="主要导航">
        <RouterLink
          v-for="item in PRIMARY"
          :key="item.to"
          :to="item.to"
          :class="{ here: isHere(item.match) }"
          :aria-current="isHere(item.match) ? 'page' : undefined"
        >
          {{ item.label }}
        </RouterLink>
        <div class="nav-more" @click.stop>
          <button
            type="button"
            class="nav-more-btn"
            :aria-expanded="moreOpen"
            aria-haspopup="true"
            @click="moreOpen = !moreOpen"
          >
            更多
          </button>
          <div class="nav-more-panel" :hidden="!moreOpen">
            <RouterLink
              v-for="item in MORE"
              :key="item.to"
              :to="item.to"
              @click="moreOpen = false"
            >
              {{ item.label }}
            </RouterLink>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>
