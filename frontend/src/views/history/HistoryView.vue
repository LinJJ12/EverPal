<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { listSessions, deleteSession } from "@/api/sessions";
import type { SessionSummary } from "@/types";

const sessions = ref<SessionSummary[]>([]);
const err = ref("");
const router = useRouter();

async function load() {
  err.value = "";
  try {
    const res = await listSessions();
    sessions.value = res.sessions || [];
  } catch (e) {
    err.value = e instanceof Error ? e.message : "加载失败";
  }
}

async function remove(id: string) {
  if (!confirm("删除这个会话？")) return;
  await deleteSession(id);
  await load();
}

onMounted(load);
</script>

<template>
  <main class="page page-path">
    <section class="path-stage shell-stage" aria-label="会话历史">
      <div class="path-stage-glow shell-stage-glow" aria-hidden="true" />
      <h1>会话历史</h1>
      <p class="lead">保存在本机标识下的服务端会话，可点开回看。</p>
      <div class="path-stage-body">
        <p v-if="err" class="note">{{ err }}</p>
        <div v-if="!sessions.length && !err" class="card note">还没有会话。去聊几句再回来。</div>
        <div class="stack">
          <article v-for="s in sessions" :key="s.id" class="history-item card">
            <button
              type="button"
              class="history-open"
              @click="router.push({ path: '/chat', query: { session: s.id } })"
            >
              <strong>{{ s.title || "未命名会话" }}</strong>
              <span class="note">
                陪伴 ·
                {{ new Date(s.updated_at * 1000).toLocaleString() }}
              </span>
            </button>
            <button type="button" class="btn btn-secondary" @click="remove(s.id)">删除</button>
          </article>
        </div>
      </div>
      <div class="shell-hero-actions footer-actions">
        <RouterLink class="btn btn-secondary btn-lg" to="/">回首页</RouterLink>
        <RouterLink class="btn btn-primary btn-lg" to="/chat">去聊天</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.history-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.history-open {
  flex: 1;
  text-align: left;
  border: none;
  background: transparent;
  font: inherit;
  cursor: pointer;
  display: grid;
  gap: 0.2rem;
}
.stack {
  display: grid;
  gap: 0.75rem;
}
</style>
