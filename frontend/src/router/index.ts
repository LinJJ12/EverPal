import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: () => import("@/views/home/HomeView.vue") },
    { path: "/welcome", name: "welcome", component: () => import("@/views/welcome/WelcomeView.vue") },
    { path: "/mode", name: "mode", component: () => import("@/views/mode/ModeView.vue") },
    { path: "/profile", name: "profile", component: () => import("@/views/profile/ProfileView.vue") },
    {
      path: "/companions",
      name: "companions",
      component: () => import("@/views/companions/CompanionsView.vue"),
    },
    { path: "/scenes", name: "scenes", component: () => import("@/views/scenes/ScenesView.vue") },
    { path: "/chat", name: "chat", component: () => import("@/views/chat/ChatView.vue") },
    { path: "/history", name: "history", component: () => import("@/views/history/HistoryView.vue") },
    { path: "/memory", name: "memory", component: () => import("@/views/memory/MemoryView.vue") },
    { path: "/settings", name: "settings", component: () => import("@/views/settings/SettingsView.vue") },
    { path: "/games", name: "games", component: () => import("@/views/games/GamesView.vue") },
    { path: "/safety", name: "safety", component: () => import("@/views/safety/SafetyView.vue") },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

export default router;
