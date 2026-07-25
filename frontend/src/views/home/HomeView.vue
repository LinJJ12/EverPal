<script setup lang="ts">
import { RouterLink } from "vue-router";
import { GAME_META } from "@/utils/gamesMeta";
</script>

<template>
  <div class="page-home">
    <section class="shell-hero" aria-label="玖伴">
      <div class="shell-hero-glow" aria-hidden="true" />
      <div class="shell-hero-inner">
        <img class="shell-hero-mark" src="/brand/logo.png" alt="" width="160" height="160" />
        <h1 class="shell-hero-brand">玖伴</h1>
        <p class="shell-hero-tagline">九久相伴，永远有人回应</p>
        <p class="shell-hero-lead">不是更快的 ChatGPT，是更好懂的伙伴。打开就能聊。</p>
        <div class="shell-hero-actions">
          <RouterLink class="btn btn-primary btn-lg" to="/welcome">开始陪伴</RouterLink>
          <RouterLink class="btn btn-secondary btn-lg" to="/chat">去聊天</RouterLink>
        </div>
      </div>
    </section>

    <main class="page page-home-main">
      <section class="benefit-band" aria-labelledby="benefits-title">
        <h2 id="benefits-title" class="section-title">玖伴能为你做什么</h2>
        <ul class="benefit-list">
          <li>
            <strong>随时陪伴</strong>
            <span>零登录开箱即聊，打开就有人回应</span>
          </li>
          <li>
            <strong>安心边界</strong>
            <span>危险话题会温和转开，守护更严</span>
          </li>
          <li>
            <strong>记得你</strong>
            <span>昵称与喜好留在本机，下次还会提起</span>
          </li>
          <li>
            <strong>温暖不越界</strong>
            <span>可以说说心事，明确不做恋爱角色</span>
          </li>
        </ul>
      </section>

      <section class="explore-band" aria-labelledby="explore-title">
        <h2 id="explore-title" class="section-title">去探索</h2>
        <div class="hub-grid hub-grid-explore">
          <RouterLink class="hub-item" to="/welcome">
            <span class="step">起步</span>
            <strong>欢迎</strong>
            <span>认识玖伴</span>
          </RouterLink>
          <RouterLink class="hub-item" to="/profile">
            <span class="step">档案</span>
            <strong>昵称与喜好</strong>
            <span>告诉伙伴怎么称呼你</span>
          </RouterLink>
          <RouterLink class="hub-item" to="/companions">
            <span class="step">伙伴</span>
            <strong>官方角色</strong>
            <span>小暖、跳跳、阿茶</span>
          </RouterLink>
          <RouterLink class="hub-item" to="/scenes">
            <span class="step">场景</span>
            <strong>情境对话</strong>
            <span>无聊、好奇与心事</span>
          </RouterLink>
          <RouterLink class="hub-item" to="/chat">
            <span class="step">聊天</span>
            <strong>自由聊天</strong>
            <span>打字、话题卡</span>
          </RouterLink>
          <RouterLink class="hub-item" to="/games">
            <span class="step">游戏</span>
            <strong>益智小游戏</strong>
            <span>{{ GAME_META.length }} 款本地可玩</span>
          </RouterLink>
          <RouterLink class="hub-item" to="/memory">
            <span class="step">记忆</span>
            <strong>记忆面板</strong>
            <span>查看或清理</span>
          </RouterLink>
          <RouterLink class="hub-item" to="/settings">
            <span class="step">设置</span>
            <strong>本地设置</strong>
            <span>模式与数据</span>
          </RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>
