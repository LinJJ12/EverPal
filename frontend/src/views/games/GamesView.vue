<script setup lang="ts">
import { RouterLink } from "vue-router";
import { GAME_META } from "@/utils/avatars";
</script>

<template>
  <main class="page">
    <div class="page-head">
      <div>
        <h1>益智小游戏</h1>
        <p class="games-hub-lead">
          七款本地小游戏，专为小朋友准备：触控优先、难度固定、成绩记在本机。不联网、不接外链游戏。
        </p>
      </div>
      <span class="chip">离线可玩</span>
    </div>

    <div class="games-grid" aria-label="游戏列表">
      <a
        v-for="g in GAME_META"
        :key="g.id"
        class="game-card"
        :href="`/games/${g.id}.html`"
      >
        <span class="game-card-kicker">益智小游戏</span>
        <strong>{{ g.title }}</strong>
        <span class="blurb">{{ g.blurb }}</span>
        <span class="record">点开即可玩</span>
      </a>
    </div>

    <div class="footer-actions">
      <RouterLink class="btn btn-secondary" to="/">回首页</RouterLink>
      <RouterLink class="btn btn-primary" to="/chat">去聊天</RouterLink>
    </div>
  </main>
</template>
