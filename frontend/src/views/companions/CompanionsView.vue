<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/profile";
import CompanionAvatar from "@/components/companions/CompanionAvatar.vue";
import { COMPANION_SAMPLES } from "@/utils/avatars";
import { setActiveSessionId, getSessionForCompanion, setSessionForCompanion } from "@/utils/activeSession";

const store = useProfileStore();
const { companions, companionId, nickname, likeLabels } = storeToRefs(store);

function opener(id: string, name: string) {
  const sample = COMPANION_SAMPLES[id] || COMPANION_SAMPLES.nuan;
  if (nickname.value && likeLabels.value.length) {
    return `${name}在这儿。${nickname.value}好呀，还喜欢${likeLabels.value[0]}吗？今天想聊点什么？`;
  }
  if (nickname.value) return `${name}在这儿。${nickname.value}，我记得你～今天想聊点什么？`;
  if (likeLabels.value.length) {
    return `${name}在这儿。还喜欢${likeLabels.value[0]}吗？今天想聊点什么？`;
  }
  return sample;
}

async function pick(id: string) {
  if (id === companionId.value) return;
  try {
    await store.save({ companion_id: id });
    // Point active session at this companion's last thread (if known)
    let sid = getSessionForCompanion(id);
    if (!sid) {
      try {
        const { listSessions } = await import("@/api/sessions");
        const res = await listSessions();
        const hit = (res.sessions || []).find((s) => s.companion_id === id);
        if (hit?.id) {
          sid = hit.id;
          setSessionForCompanion(id, sid);
        }
      } catch {
        /* ignore */
      }
    }
    store.sessionId = sid;
    setActiveSessionId(sid);
  } catch (e) {
    alert(e instanceof Error ? e.message : "保存失败，请确认后端已启动");
  }
}

const list = computed(() => companions.value);
</script>

<template>
  <main class="page page-path">
    <section class="path-stage shell-stage" aria-label="选择角色">
      <div class="path-stage-glow shell-stage-glow" aria-hidden="true" />
      <h1>今天想找谁聊？</h1>
      <p class="lead">三位官方伙伴，各有性格与开场白。点选一位，再去场景或聊天。</p>
      <div class="path-stage-body">
        <div class="companion-grid">
          <button
            v-for="c in list"
            :key="c.id"
            type="button"
            class="companion"
            :class="{ selected: c.id === companionId }"
            @click="pick(c.id)"
          >
            <CompanionAvatar :companion-id="c.id" />
            <div class="companion-meta">{{ c.role }}</div>
            <div>
              <div class="choice-title">
                {{ c.name }}{{ c.id === companionId ? " · 已选" : "" }}
              </div>
              <div class="choice-desc">{{ c.blurb }}</div>
              <div class="sample-line">「{{ opener(c.id, c.name) }}」</div>
            </div>
          </button>
        </div>
      </div>
      <div class="shell-hero-actions footer-actions">
        <RouterLink class="btn btn-secondary btn-lg" to="/profile">上一步</RouterLink>
        <RouterLink class="btn btn-mint btn-lg" to="/scenes">去场景</RouterLink>
        <RouterLink class="btn btn-secondary btn-lg" to="/chat">先自由聊</RouterLink>
      </div>
    </section>
  </main>
</template>
